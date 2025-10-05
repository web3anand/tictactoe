import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, createUser, getUserByWallet } from '@/lib/supabase'
import { memoryDb } from '@/lib/memory-db'

// Helper function to create fallback game when database is not available
function createFallbackGame(body: any) {
  const player1Data = body.player1 || {
    wallet_address: body.walletAddress || `guest_${body.playerId}`,
    name: body.playerName,
    points: 0,
    gamesPlayed: 0,
    gamesWon: 0
  }

  const walletAddress = player1Data.wallet_address || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  const finalRoomCode = body.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()
  const gameId = Math.random().toString(36).substring(2, 15)
  const player1Id = player1Data.id || Math.random().toString(36).substring(2, 15)

  // Create or find user in memory database
  let memoryUser = memoryDb.findUserByWallet(walletAddress)
  if (!memoryUser) {
    memoryUser = memoryDb.createUser({
      name: player1Data.name,
      points: player1Data.points || 0,
      gamesPlayed: player1Data.gamesPlayed || 0,
      gamesWon: player1Data.gamesWon || 0,
      walletAddress: walletAddress
    })
  }

  // Create game in memory database
  const memoryGame = memoryDb.createGame({
    roomCode: finalRoomCode,
    player1Id: memoryUser.id,
    currentPlayer: 'X',
    board: Array(36).fill(null).join(','), // Store as comma-separated string
    gameOver: false,
    moves: 0,
    multiplier: body.gameMode === 'ranked' ? 2.0 : 1.5,
    streak: 0,
    isPrivate: body.isPrivate || false
  })

  const mockUser = {
    id: memoryUser.id,
    wallet_address: walletAddress,
    username: player1Data.name,
    display_name: player1Data.name,
    total_points: player1Data.points || 0,
    games_played: player1Data.gamesPlayed || 0,
    games_won: player1Data.gamesWon || 0
  }

  return NextResponse.json({ 
    success: true, 
    mode: 'fallback',
    game: {
      id: memoryGame.id,
      roomCode: memoryGame.roomCode,
      player1: {
        id: memoryUser.id,
        name: memoryUser.name,
        points: memoryUser.points,
        gamesPlayed: memoryUser.gamesPlayed,
        gamesWon: memoryUser.gamesWon,
        walletAddress: memoryUser.walletAddress
      },
      player2: null,
      currentPlayer: memoryGame.currentPlayer,
      board: Array(36).fill(null), // Return as array for frontend
      gameOver: memoryGame.gameOver,
      status: 'waiting',
      moves: memoryGame.moves,
      multiplier: memoryGame.multiplier,
      streak: memoryGame.streak
    }
  })
}

// Helper function to create game with database
async function createDatabaseGame(body: any, player1Data: any) {
  try {
    // Find or create user
    let user = await getUserByWallet(player1Data.wallet_address)
    
    if (!user) {
      user = await createUser({
        wallet_address: player1Data.wallet_address,
        username: player1Data.name,
        display_name: player1Data.name,
        total_points: player1Data.points || 0,
        games_played: player1Data.gamesPlayed || 0,
        games_won: player1Data.gamesWon || 0
      })
    }

    if (!user) {
      throw new Error('Failed to create or find user')
    }

    // Generate room code
    const roomCode = body.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create game in database
    const { data: newGame, error } = await supabaseAdmin!
      .from('games')
      .insert({
        room_code: roomCode,
        player_x_id: user.id,
        status: 'waiting',
        game_mode: body.gameMode || (body.isPrivate ? 'private' : 'quick'),
        is_private: body.isPrivate || false,
        base_points: body.gameMode === 'ranked' ? 50 : 25,
        multiplier: body.gameMode === 'ranked' ? 2.0 : 1.5
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating game:', error)
      throw error
    }

    // Manually fetch user data since foreign key join is not available
    const playerData = await getUserByWallet(player1Data.wallet_address)

    return NextResponse.json({ 
      success: true, 
      mode: 'database',
      game: {
        id: newGame.id,
        roomCode: newGame.room_code,
        player1: playerData ? {
          id: playerData.id,
          name: playerData.display_name || playerData.username,
          points: playerData.total_points,
          gamesPlayed: playerData.games_played,
          gamesWon: playerData.games_won,
          walletAddress: playerData.wallet_address
        } : player1Data,
        player2: null,
        currentPlayer: newGame.current_player,
        board: newGame.board,
        gameOver: newGame.status === 'finished',
        status: newGame.status,
        moves: newGame.total_moves,
        multiplier: newGame.multiplier,
        streak: 0
      }
    })
  } catch (error) {
    console.error('Error creating database game:', error)
    // Fallback to mock game if database fails
    return createFallbackGame(body)
  }
}

// Create a new game room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received request body:', body)

    // Handle different request formats
    let player1Data
    if (body.player1) {
      player1Data = {
        wallet_address: body.player1.walletAddress || body.player1.wallet_address,
        name: body.player1.name,
        points: body.player1.points || 0,
        gamesPlayed: body.player1.gamesPlayed || 0,
        gamesWon: body.player1.gamesWon || 0,
        id: body.player1.id
      }
    } else if (body.playerId && body.playerName) {
      player1Data = {
        wallet_address: body.walletAddress || `guest_${body.playerId}`,
        name: body.playerName,
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0
      }
    } else {
      return NextResponse.json({ error: 'Player data required' }, { status: 400 })
    }

    if (!player1Data || (!player1Data.wallet_address && !player1Data.name)) {
      return NextResponse.json({ error: 'Valid player data required' }, { status: 400 })
    }

    // Check if database is available
    if (!supabaseAdmin) {
      console.warn('Database not configured - using fallback mode')
      return createFallbackGame(body)
    }

    // Check if player has a valid wallet address
    // If wallet_address is missing, starts with "guest_", or is not a valid ethereum address, use fallback
    const hasValidWallet = player1Data.wallet_address && 
                          !player1Data.wallet_address.startsWith('guest_') &&
                          player1Data.wallet_address.startsWith('0x') &&
                          player1Data.wallet_address.length === 42

    if (!hasValidWallet) {
      console.warn(`Player ${player1Data.name} has no valid wallet address (${player1Data.wallet_address}) - using fallback mode`)
      return createFallbackGame(body)
    }

    // Use database for players with valid wallet addresses
    return await createDatabaseGame(body, player1Data)

  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get all active games (for admin/monitoring)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Return mock data for development
    const mockGames: any[] = []
    
    return NextResponse.json({ 
      success: true, 
      games: mockGames
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
