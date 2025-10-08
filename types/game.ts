// Shared types for TicTacToe Pro

export interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  walletAddress?: string
  farcasterProfile?: {
    fid: number
    username: string
    displayName: string
    avatar: string
    bio: string
    followerCount: number
    followingCount: number
    verified?: boolean
    source?: string
  }
  privyProfile?: {
    id: string
    email?: string
    wallet?: string
    farcaster?: any
    twitter?: any
    google?: any
  }
}

export interface GameState {
  board: (string | null)[]
  currentPlayer: 'X' | 'O'
  winner: string | null
  gameOver: boolean
  moves: number
  multiplier: number
  streak: number
}

export interface GameRoom {
  id: string
  roomCode: string
  player1: Player
  player2: Player | null
  currentPlayer: 'X' | 'O'
  board: (string | null)[]
  gameOver: boolean
  winner: string | null
  status: 'waiting' | 'playing' | 'finished'
  moves: number
  multiplier: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  pointsReward: number
  unlocked?: boolean
  unlockedAt?: Date
}

export interface LeaderboardEntry {
  rank: number
  player: Player
  winRate: number
}