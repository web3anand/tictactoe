import { NextRequest, NextResponse } from 'next/server'
import { memoryDb, users } from '@/lib/memory-db'

// Make a move in the game
export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { position, playerId, symbol } = await request.json()
    const gameId = params.gameId

    // Get the current game state
    const game = memoryDb.findGameById(gameId)
    const player1 = users.find(u => u.id === game?.player1Id)
    const player2 = game?.player2Id ? users.find(u => u.id === game.player2Id) : null

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
    }

    if (game.gameOver) {
      return NextResponse.json({ success: false, error: 'Game is over' }, { status: 400 })
    }

    if (game.currentPlayer !== symbol) {
      return NextResponse.json({ success: false, error: 'Not your turn' }, { status: 400 })
    }

    // Parse current board - handle both string and array formats
    let board
    if (typeof game.board === 'string') {
      board = game.board.split(',')
    } else {
      board = [...game.board] // Clone the array
    }
    
    if (board[position] !== '' && board[position] !== null) {
      return NextResponse.json({ success: false, error: 'Position already taken' }, { status: 400 })
    }

    // Make the move
    board[position] = symbol
    const newMoves = game.moves + 1

    // Check for win - 6x6 board with 4-in-a-row
    const winningCombinations = []
    
    // Rows (6 rows, 3 possible 4-in-a-row per row)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col <= 2; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 1, start + 2, start + 3])
      }
    }
    
    // Columns (6 columns, 3 possible 4-in-a-row per column)
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row <= 2; row++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 6, start + 12, start + 18])
      }
    }
    
    // Diagonals (top-left to bottom-right)
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 2; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 7, start + 14, start + 21])
      }
    }
    
    // Diagonals (top-right to bottom-left)
    for (let row = 0; row <= 2; row++) {
      for (let col = 3; col < 6; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 5, start + 10, start + 15])
      }
    }

    let winner = null
    let gameOver = false

    for (const [a, b, c, d] of winningCombinations) {
      if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
        winner = board[a]
        gameOver = true
        break
      }
    }

    if (!gameOver && newMoves === 36) {
      winner = 'Draw'
      gameOver = true
    }

    // Calculate multiplier
    let multiplier = 1.0
    if (gameOver && winner && winner !== 'Draw') {
      // Speed bonus
      if (newMoves <= 5) multiplier += 2.0
      else if (newMoves <= 7) multiplier += 1.5
      else if (newMoves <= 9) multiplier += 1.0

      // Streak bonus
      if (game.streak > 0) multiplier += game.streak * 0.5

      // X profile bonus
      const player = symbol === 'X' ? player1 : player2
      if (player?.xProfile) {
        const xProfile = typeof player.xProfile === 'string' ? JSON.parse(player.xProfile) : player.xProfile
        if (xProfile.ethosScore) {
          multiplier += (xProfile.ethosScore / 100) * 0.5
        }
      }
    }

    // Update game state - ensure board is stored as string in memory DB
    const updatedGame = memoryDb.updateGame(gameId, {
      board: board.join(','),
      currentPlayer: symbol === 'X' ? 'O' : 'X',
      moves: newMoves,
      winner: winner || null,
      gameOver,
      multiplier: gameOver ? multiplier : game.multiplier,
      streak: gameOver && winner && winner !== 'Draw' ? game.streak + 1 : 0
    })

    if (!updatedGame) {
      return NextResponse.json({ success: false, error: 'Failed to update game' }, { status: 500 })
    }

    // Create move record
    memoryDb.createMove({
      gameId,
      playerId,
      position,
      symbol
    })

    // Update player stats if game is over
    if (gameOver) {
      const winnerPlayer = winner === 'X' ? player1 : player2
      if (winnerPlayer && winner !== 'Draw') {
        const pointsEarned = Math.floor(100 * multiplier)
        memoryDb.updateUser(winnerPlayer.id, {
          points: winnerPlayer.points + pointsEarned,
          gamesPlayed: winnerPlayer.gamesPlayed + 1,
          gamesWon: winnerPlayer.gamesWon + 1
        })
      } else {
        // Update both players for draw
        if (player1) {
          memoryDb.updateUser(player1.id, { gamesPlayed: player1.gamesPlayed + 1 })
        }
        if (player2) {
          memoryDb.updateUser(player2.id, { gamesPlayed: player2.gamesPlayed + 1 })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      game: {
        id: updatedGame.id,
        roomCode: updatedGame.roomCode,
        player1: player1,
        player2: player2,
        currentPlayer: updatedGame.currentPlayer,
        board: typeof updatedGame.board === 'string' ? updatedGame.board.split(',') : updatedGame.board,
        gameOver: updatedGame.gameOver,
        winner: updatedGame.winner,
        moves: updatedGame.moves,
        multiplier: updatedGame.multiplier,
        streak: updatedGame.streak
      }
    })
  } catch (error) {
    console.error('Error making move:', error)
    return NextResponse.json({ success: false, error: 'Failed to make move' }, { status: 500 })
  }
}
