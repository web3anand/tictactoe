// Human-like Bot player logic for TicTacToe
interface BotPlayer {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'human'
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

// Human-like bot names and personalities
const PREDEFINED_BOTS = [
  { name: 'Alex', personality: 'strategic', points: 850, winRate: 0.65 },
  { name: 'Jordan', personality: 'aggressive', points: 720, winRate: 0.58 },
  { name: 'Casey', personality: 'cautious', points: 640, winRate: 0.52 },
  { name: 'Taylor', personality: 'unpredictable', points: 890, winRate: 0.70 },
  { name: 'Morgan', personality: 'lazy', points: 560, winRate: 0.45 },
  { name: 'Riley', personality: 'brilliant', points: 950, winRate: 0.75 },
  { name: 'Finley', personality: 'balanced', points: 780, winRate: 0.60 },
  { name: 'Quinn', personality: 'rookie', points: 420, winRate: 0.38 },
  { name: 'Blake', personality: 'competitive', points: 820, winRate: 0.63 },
  { name: 'Cameron', personality: 'creative', points: 690, winRate: 0.55 }
]

// 6x6 board positions for better strategy
const BOARD_SIZE = 6
const WIN_LENGTH = 4 // 4 in a row to win

export const createBotPlayer = (botIndex: number = 0): BotPlayer => {
  const botData = PREDEFINED_BOTS[botIndex % PREDEFINED_BOTS.length]
  const baseGames = 25 + Math.floor(Math.random() * 20) // 25-45 games
  
  return {
    id: `bot_${botData.name.toLowerCase()}_${Date.now()}`,
    name: botData.name,
    difficulty: 'human',
    points: botData.points + Math.floor(Math.random() * 100 - 50), // ±50 points variation
    gamesPlayed: baseGames,
    gamesWon: Math.floor(baseGames * botData.winRate),
    walletAddress: `bot_${botData.name.toLowerCase()}_wallet`
  }
}

// Get total number of available bots
export const getTotalBots = (): number => {
  return PREDEFINED_BOTS.length
}

// Human-like bot move logic with varying intelligence and occasional mistakes
export const getBotMove = (gameBoard: GameBoard, botSymbol: string, difficulty: string = 'human'): number => {
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

  // Human-like decision making with varying intelligence levels
  const intelligenceLevel = Math.random() // 0-1, determines how smart the bot is this turn
  const lazinessLevel = Math.random() // 0-1, determines if bot makes lazy moves
  
  // Sometimes be lazy and make random moves (human-like)
  if (lazinessLevel < 0.15) { // 15% chance of lazy move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)]
  }

  // Always try to win if possible (even lazy humans do this)
  const winMove = findWinningMove(board, botSymbol, emptyCells)
  if (winMove !== -1) {
    // Sometimes miss obvious wins (human-like mistake)
    if (intelligenceLevel > 0.1) { // 90% chance to see winning move
      return winMove
    }
  }

  // Try to block opponent from winning
  const blockMove = findWinningMove(board, opponentSymbol, emptyCells)
  if (blockMove !== -1) {
    // Sometimes miss blocks (human-like mistake)
    if (intelligenceLevel > 0.2) { // 80% chance to see block
      return blockMove
    }
  }

  // Smart moves when intelligence is high
  if (intelligenceLevel > 0.7) { // 30% chance of brilliant play
    // Create fork opportunities
    const forkMove = findForkMove(board, botSymbol, emptyCells)
    if (forkMove !== -1) return forkMove

    // Block opponent forks
    const blockForkMove = findForkMove(board, opponentSymbol, emptyCells)
    if (blockForkMove !== -1) return blockForkMove
  }

  // Medium intelligence moves
  if (intelligenceLevel > 0.4) { // 60% chance of decent play
    // Try center if available
    const center = 17 // Center of 6x6 board
    if (emptyCells.includes(center)) {
      return center
    }

    // Try corners
    const corners = [0, 5, 30, 35]
    const availableCorners = corners.filter(corner => emptyCells.includes(corner))
    if (availableCorners.length > 0 && Math.random() > 0.3) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)]
    }
  }

  // Default: somewhat strategic move with some randomness
  return getHumanLikeMove(board, botSymbol, emptyCells, intelligenceLevel)
}

// Human-like move selection
const getHumanLikeMove = (board: string[], symbol: string, emptyCells: number[], intelligence: number): number => {
  // Create a weighted selection based on position value
  const moveWeights: { [key: number]: number } = {}
  
  for (const cell of emptyCells) {
    let weight = 1 // Base weight
    
    // Center preference (humans like center)
    if (cell === 17) weight += 3
    
    // Corner preference (humans know corners are good)
    const corners = [0, 5, 30, 35]
    if (corners.includes(cell)) weight += 2
    
    // Adjacent to existing pieces (humans like to build)
    if (hasAdjacentPiece(board, cell, symbol)) weight += 2
    
    // Block opponent building (humans try to interfere)
    const opponentSymbol = symbol === 'X' ? 'O' : 'X'
    if (hasAdjacentPiece(board, cell, opponentSymbol)) weight += 1
    
    // Apply intelligence factor
    weight *= (0.5 + intelligence * 0.5) // Scale weight based on intelligence
    
    moveWeights[cell] = weight
  }
  
  // Weighted random selection (more human-like than pure random)
  const totalWeight = Object.values(moveWeights).reduce((sum, weight) => sum + weight, 0)
  let random = Math.random() * totalWeight
  
  for (const [cell, weight] of Object.entries(moveWeights)) {
    random -= weight
    if (random <= 0) {
      return parseInt(cell)
    }
  }
  
  // Fallback to random move
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

// Check if a position has adjacent pieces
const hasAdjacentPiece = (board: string[], position: number, symbol: string): boolean => {
  const row = Math.floor(position / BOARD_SIZE)
  const col = position % BOARD_SIZE
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      
      const newRow = row + dr
      const newCol = col + dc
      
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        const adjacentPos = newRow * BOARD_SIZE + newCol
        if (board[adjacentPos] === symbol) {
          return true
        }
      }
    }
  }
  
  return false
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
