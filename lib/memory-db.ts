// Simple in-memory database for development
interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  xProfile?: any
  walletAddress?: string
}

interface Game {
  id: string
  roomCode: string
  player1Id: string
  player2Id?: string
  currentPlayer: string
  board: string
  winner?: string | null
  gameOver: boolean
  moves: number
  multiplier: number
  streak: number
  isPrivate?: boolean
  createdAt: Date
}

interface Move {
  id: string
  gameId: string
  playerId: string
  position: number
  symbol: string
  createdAt: Date
}

// In-memory storage
let users: Player[] = []
let games: Game[] = []
let moves: Move[] = []

// Export users for external access
export { users }

// Helper functions
export const memoryDb = {
  // User operations
  findUserByWallet: (walletAddress: string) => {
    return users.find(user => user.walletAddress === walletAddress)
  },

  createUser: (userData: Omit<Player, 'id'>) => {
    const user: Player = {
      id: Math.random().toString(36).substring(2, 15),
      ...userData
    }
    users.push(user)
    return user
  },

  updateUser: (id: string, updates: Partial<Player>) => {
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      return users[userIndex]
    }
    return null
  },

  // Game operations
  createGame: (gameData: Omit<Game, 'id' | 'createdAt'>) => {
    const game: Game = {
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
      ...gameData
    }
    games.push(game)
    return game
  },

  findGameByRoomCode: (roomCode: string) => {
    return games.find(game => game.roomCode === roomCode)
  },

  findGameById: (id: string) => {
    return games.find(game => game.id === id)
  },

  updateGame: (id: string, updates: Partial<Game>) => {
    const gameIndex = games.findIndex(game => game.id === id)
    if (gameIndex !== -1) {
      games[gameIndex] = { ...games[gameIndex], ...updates }
      return games[gameIndex]
    }
    return null
  },

  // Move operations
  createMove: (moveData: Omit<Move, 'id' | 'createdAt'>) => {
    const move: Move = {
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
      ...moveData
    }
    moves.push(move)
    return move
  },

  getMovesByGame: (gameId: string) => {
    return moves.filter(move => move.gameId === gameId)
  },

  // Leaderboard
  getLeaderboard: () => {
    return users
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))
  }
}
