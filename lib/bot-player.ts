// Advanced Bot player logic for TicTacToe
interface BotPlayer {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  points: number
  gamesPlayed: number
  gamesWon: number
  xProfile?: any
  walletAddress?: string
}

interface GameBoard {
  board: string[]
  currentPlayer: string
  gameOver: boolean
  winner?: string | null
  moves: number
}

// Advanced bot names with difficulty indicators
const BOT_NAMES = {
  easy: ['Friendly Bot', 'Beginner AI', 'Learning Bot', 'Novice Player'],
  medium: ['Smart Bot', 'Strategic AI', 'Tactical Player', 'Logic Bot'],
  hard: ['Advanced AI', 'Expert Bot', 'Master Player', 'Challenger Bot'],
  expert: ['Elite AI', 'Pro Bot', 'Champion Player', 'Veteran Bot'],
  master: ['Grandmaster AI', 'Legendary Bot', 'Ultimate Player', 'Supreme Bot']
}

// 6x6 board positions for better strategy
const BOARD_SIZE = 6
const WIN_LENGTH = 4 // 4 in a row to win

export const createBotPlayer = (difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master'): BotPlayer => {
  const selectedDifficulty = difficulty || (['easy', 'medium', 'hard', 'expert', 'master'][Math.floor(Math.random() * 5)] as 'easy' | 'medium' | 'hard' | 'expert' | 'master')
  const randomName = BOT_NAMES[selectedDifficulty][Math.floor(Math.random() * BOT_NAMES[selectedDifficulty].length)]
  
  // Higher difficulty bots have better stats
  const basePoints = selectedDifficulty === 'easy' ? 100 : 
                    selectedDifficulty === 'medium' ? 500 : 
                    selectedDifficulty === 'hard' ? 1000 : 
                    selectedDifficulty === 'expert' ? 2000 : 5000
  
  const baseGames = selectedDifficulty === 'easy' ? 10 : 
                   selectedDifficulty === 'medium' ? 50 : 
                   selectedDifficulty === 'hard' ? 100 : 
                   selectedDifficulty === 'expert' ? 200 : 500
  
  const winRate = selectedDifficulty === 'easy' ? 0.3 : 
                 selectedDifficulty === 'medium' ? 0.6 : 
                 selectedDifficulty === 'hard' ? 0.8 : 
                 selectedDifficulty === 'expert' ? 0.9 : 0.95
  
  return {
    id: `bot_${Math.random().toString(36).substring(2, 15)}`,
    name: `${randomName} (${selectedDifficulty})`,
    difficulty: selectedDifficulty,
    points: basePoints + Math.floor(Math.random() * basePoints),
    gamesPlayed: baseGames + Math.floor(Math.random() * baseGames),
    gamesWon: Math.floor((baseGames + Math.floor(Math.random() * baseGames)) * winRate),
    walletAddress: `bot_${Math.random().toString(36).substring(2, 15)}`
  }
}

// Advanced bot move logic with sophisticated strategies
export const getBotMove = (gameBoard: GameBoard, botSymbol: string, difficulty: string = 'medium'): number => {
  const { board, currentPlayer } = gameBoard
  
  // Only make a move if it's the bot's turn
  if (currentPlayer !== botSymbol) {
    return -1
  }

  // Convert board to array of indices with empty cells
  const emptyCells = board.map((cell, index) => (cell === '' || cell === null) ? index : null).filter(index => index !== null) as number[]
  
  if (emptyCells.length === 0) {
    return -1
  }

  const opponentSymbol = botSymbol === 'X' ? 'O' : 'X'

  // Easy bot: Random move with slight preference for center
  if (difficulty === 'easy') {
    const center = 17 // Center of 6x6 board
    if (emptyCells.includes(center)) {
      return Math.random() < 0.7 ? center : emptyCells[Math.floor(Math.random() * emptyCells.length)]
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }

  // Medium bot: Basic strategy
  if (difficulty === 'medium') {
    // Try to win
    const winMove = findWinningMove(board, botSymbol, emptyCells)
    if (winMove !== -1) return winMove

    // Try to block opponent
    const blockMove = findWinningMove(board, opponentSymbol, emptyCells)
    if (blockMove !== -1) return blockMove

    // Center preference
    const center = 17
    if (emptyCells.includes(center)) return center

    // Random move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }

  // Hard bot: Advanced strategy
  if (difficulty === 'hard') {
    // Try to win
    const winMove = findWinningMove(board, botSymbol, emptyCells)
    if (winMove !== -1) return winMove

    // Try to block opponent
    const blockMove = findWinningMove(board, opponentSymbol, emptyCells)
    if (blockMove !== -1) return blockMove

    // Create fork opportunities
    const forkMove = findForkMove(board, botSymbol, emptyCells)
    if (forkMove !== -1) return forkMove

    // Block opponent forks
    const blockForkMove = findForkMove(board, opponentSymbol, emptyCells)
    if (blockForkMove !== -1) return blockForkMove

    // Strategic positioning
    return getStrategicMove(board, botSymbol, emptyCells)
  }

  // Expert bot: Very advanced strategy
  if (difficulty === 'expert') {
    // Try to win
    const winMove = findWinningMove(board, botSymbol, emptyCells)
    if (winMove !== -1) return winMove

    // Try to block opponent
    const blockMove = findWinningMove(board, opponentSymbol, emptyCells)
    if (blockMove !== -1) return blockMove

    // Create multiple threats
    const threatMove = createMultipleThreats(board, botSymbol, emptyCells)
    if (threatMove !== -1) return threatMove

    // Block opponent threats
    const blockThreatMove = createMultipleThreats(board, opponentSymbol, emptyCells)
    if (blockThreatMove !== -1) return blockThreatMove

    // Advanced strategic positioning
    return getAdvancedStrategicMove(board, botSymbol, emptyCells)
  }

  // Master bot: Perfect play
  if (difficulty === 'master') {
    // Use minimax algorithm for perfect play
    const minimaxMove = minimax(board, botSymbol, 0, true, -Infinity, Infinity)
    if (minimaxMove.move !== -1) return minimaxMove.move

    // Fallback to expert strategy
    return getAdvancedStrategicMove(board, botSymbol, emptyCells)
  }

  // Default: Random move
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

// Advanced win condition checker for 6x6 board with 4 in a row
const checkWin = (board: string[], symbol: string): boolean => {
  // Check rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      let count = 0
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[row * BOARD_SIZE + col + i] === symbol) count++
      }
      if (count === WIN_LENGTH) return true
    }
  }

  // Check columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
      let count = 0
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[(row + i) * BOARD_SIZE + col] === symbol) count++
      }
      if (count === WIN_LENGTH) return true
    }
  }

  // Check diagonals (top-left to bottom-right)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      let count = 0
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[(row + i) * BOARD_SIZE + col + i] === symbol) count++
      }
      if (count === WIN_LENGTH) return true
    }
  }

  // Check diagonals (top-right to bottom-left)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < BOARD_SIZE; col++) {
      let count = 0
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[(row + i) * BOARD_SIZE + col - i] === symbol) count++
      }
      if (count === WIN_LENGTH) return true
    }
  }

  return false
}

// Find winning move for a symbol
const findWinningMove = (board: string[], symbol: string, emptyCells: number[]): number => {
  for (const cell of emptyCells) {
    const testBoard = [...board]
    testBoard[cell] = symbol
    if (checkWin(testBoard, symbol)) {
      return cell
    }
  }
  return -1
}

// Find fork move (creating multiple winning opportunities)
const findForkMove = (board: string[], symbol: string, emptyCells: number[]): number => {
  for (const cell of emptyCells) {
    const testBoard = [...board]
    testBoard[cell] = symbol
    
    // Count how many winning opportunities this move creates
    let winningOpportunities = 0
    for (const nextCell of emptyCells) {
      if (nextCell !== cell) {
        const nextTestBoard = [...testBoard]
        nextTestBoard[nextCell] = symbol
        if (checkWin(nextTestBoard, symbol)) {
          winningOpportunities++
        }
      }
    }
    
    if (winningOpportunities >= 2) {
      return cell
    }
  }
  return -1
}

// Create multiple threats
const createMultipleThreats = (board: string[], symbol: string, emptyCells: number[]): number => {
  let bestMove = -1
  let maxThreats = 0

  for (const cell of emptyCells) {
    const testBoard = [...board]
    testBoard[cell] = symbol
    
    let threats = 0
    // Count potential winning sequences this move contributes to
    threats += countThreats(testBoard, symbol, cell)
    
    if (threats > maxThreats) {
      maxThreats = threats
      bestMove = cell
    }
  }

  return bestMove
}

// Count threats for a position
const countThreats = (board: string[], symbol: string, position: number): number => {
  const row = Math.floor(position / BOARD_SIZE)
  const col = position % BOARD_SIZE
  let threats = 0

  // Check horizontal threats
  for (let start = Math.max(0, col - WIN_LENGTH + 1); start <= Math.min(BOARD_SIZE - WIN_LENGTH, col); start++) {
    let count = 0
    let emptyCount = 0
    for (let i = 0; i < WIN_LENGTH; i++) {
      const cellValue = board[row * BOARD_SIZE + start + i]
      if (cellValue === symbol) count++
      else if (cellValue === '' || cellValue === null) emptyCount++
    }
    if (count >= 2 && count + emptyCount === WIN_LENGTH) threats++
  }

  // Check vertical threats
  for (let start = Math.max(0, row - WIN_LENGTH + 1); start <= Math.min(BOARD_SIZE - WIN_LENGTH, row); start++) {
    let count = 0
    let emptyCount = 0
    for (let i = 0; i < WIN_LENGTH; i++) {
      const cellValue = board[(start + i) * BOARD_SIZE + col]
      if (cellValue === symbol) count++
      else if (cellValue === '' || cellValue === null) emptyCount++
    }
    if (count >= 2 && count + emptyCount === WIN_LENGTH) threats++
  }

  // Check diagonal threats (top-left to bottom-right)
  const diagStartRow = Math.max(0, row - Math.min(row, col))
  const diagStartCol = Math.max(0, col - Math.min(row, col))
  for (let start = 0; start <= Math.min(BOARD_SIZE - WIN_LENGTH - diagStartRow, BOARD_SIZE - WIN_LENGTH - diagStartCol); start++) {
    let count = 0
    let emptyCount = 0
    for (let i = 0; i < WIN_LENGTH; i++) {
      const cellValue = board[(diagStartRow + start + i) * BOARD_SIZE + diagStartCol + start + i]
      if (cellValue === symbol) count++
      else if (cellValue === '' || cellValue === null) emptyCount++
    }
    if (count >= 2 && count + emptyCount === WIN_LENGTH) threats++
  }

  return threats
}

// Strategic move selection
const getStrategicMove = (board: string[], symbol: string, emptyCells: number[]): number => {
  // Priority order: center, corners, edges
  const center = 17
  const corners = [0, 5, 30, 35]
  const edges = [1, 2, 3, 4, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33]

  if (emptyCells.includes(center)) return center

  const availableCorners = corners.filter(corner => emptyCells.includes(corner))
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)]
  }

  const availableEdges = edges.filter(edge => emptyCells.includes(edge))
  if (availableEdges.length > 0) {
    return availableEdges[Math.floor(Math.random() * availableEdges.length)]
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

// Advanced strategic move selection
const getAdvancedStrategicMove = (board: string[], symbol: string, emptyCells: number[]): number => {
  // Evaluate each move based on multiple factors
  let bestMove = -1
  let bestScore = -Infinity

  for (const cell of emptyCells) {
    let score = 0
    
    // Center control
    if (cell === 17) score += 10
    
    // Corner control
    const corners = [0, 5, 30, 35]
    if (corners.includes(cell)) score += 5
    
    // Threat creation
    score += countThreats(board, symbol, cell) * 3
    
    // Block opponent threats
    const opponentSymbol = symbol === 'X' ? 'O' : 'X'
    score += countThreats(board, opponentSymbol, cell) * 2
    
    // Position value based on distance from center
    const row = Math.floor(cell / BOARD_SIZE)
    const col = cell % BOARD_SIZE
    const centerRow = Math.floor(BOARD_SIZE / 2)
    const centerCol = Math.floor(BOARD_SIZE / 2)
    const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol)
    score += (BOARD_SIZE - distanceFromCenter) * 0.5

    if (score > bestScore) {
      bestScore = score
      bestMove = cell
    }
  }

  return bestMove
}

// Minimax algorithm for perfect play
const minimax = (board: string[], symbol: string, depth: number, isMaximizing: boolean, alpha: number, beta: number): { move: number, score: number } => {
  const emptyCells = board.map((cell, index) => (cell === '' || cell === null) ? index : null).filter(index => index !== null) as number[]
  const opponentSymbol = symbol === 'X' ? 'O' : 'X'

  // Terminal conditions
  if (checkWin(board, symbol)) return { move: -1, score: 100 - depth }
  if (checkWin(board, opponentSymbol)) return { move: -1, score: -100 + depth }
  if (emptyCells.length === 0) return { move: -1, score: 0 }

  // Limit depth for performance
  if (depth >= 4) {
    return { move: -1, score: evaluateBoard(board, symbol) }
  }

  if (isMaximizing) {
    let maxScore = -Infinity
    let bestMove = -1

    for (const cell of emptyCells) {
      const testBoard = [...board]
      testBoard[cell] = symbol
      const result = minimax(testBoard, symbol, depth + 1, false, alpha, beta)
      
      if (result.score > maxScore) {
        maxScore = result.score
        bestMove = cell
      }
      
      alpha = Math.max(alpha, result.score)
      if (beta <= alpha) break // Alpha-beta pruning
    }

    return { move: bestMove, score: maxScore }
  } else {
    let minScore = Infinity
    let bestMove = -1

    for (const cell of emptyCells) {
      const testBoard = [...board]
      testBoard[cell] = opponentSymbol
      const result = minimax(testBoard, symbol, depth + 1, true, alpha, beta)
      
      if (result.score < minScore) {
        minScore = result.score
        bestMove = cell
      }
      
      beta = Math.min(beta, result.score)
      if (beta <= alpha) break // Alpha-beta pruning
    }

    return { move: bestMove, score: minScore }
  }
}

// Evaluate board position
const evaluateBoard = (board: string[], symbol: string): number => {
  const opponentSymbol = symbol === 'X' ? 'O' : 'X'
  let score = 0

  // Evaluate all possible 4-in-a-row sequences
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      score += evaluateSequence(board, row, col, 0, 1, symbol, opponentSymbol)
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
      score += evaluateSequence(board, row, col, 1, 0, symbol, opponentSymbol)
    }
  }

  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      score += evaluateSequence(board, row, col, 1, 1, symbol, opponentSymbol)
    }
  }

  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < BOARD_SIZE; col++) {
      score += evaluateSequence(board, row, col, 1, -1, symbol, opponentSymbol)
    }
  }

  return score
}

// Evaluate a sequence of 4 positions
const evaluateSequence = (board: string[], startRow: number, startCol: number, deltaRow: number, deltaCol: number, symbol: string, opponentSymbol: string): number => {
  let symbolCount = 0
  let opponentCount = 0
  let emptyCount = 0

  for (let i = 0; i < WIN_LENGTH; i++) {
    const cellValue = board[(startRow + i * deltaRow) * BOARD_SIZE + startCol + i * deltaCol]
    if (cellValue === symbol) symbolCount++
    else if (cellValue === opponentSymbol) opponentCount++
    else if (cellValue === '' || cellValue === null) emptyCount++
  }

  if (symbolCount > 0 && opponentCount > 0) return 0 // Blocked sequence
  if (symbolCount === 0 && opponentCount === 0) return 0 // Empty sequence

  if (symbolCount > 0) {
    return Math.pow(10, symbolCount) // Favor our own sequences
  } else {
    return -Math.pow(10, opponentCount) // Penalize opponent sequences
  }
}

// Auto-join bot to game if no human player joins within timeout
export const autoJoinBot = (gameId: string, timeout: number = 10000): Promise<BotPlayer> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bot = createBotPlayer()
      resolve(bot)
    }, timeout)
  })
}
