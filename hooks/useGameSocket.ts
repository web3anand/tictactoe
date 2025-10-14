import { useEffect, useState, useRef, createContext, useContext, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { Game, GameMove, User } from '@/lib/supabase'

interface GameSocketEvents {
  // Server to client events
  authenticated: (data: { success: boolean, user?: User }) => void
  authentication_failed: (data: { error: string }) => void
  game_state: (game: Game) => void
  player_joined: (data: { userId: string, isPlayer: boolean, playerCount: number, spectatorCount: number }) => void
  player_left: (data: { userId: string, playerCount: number, spectatorCount: number }) => void
  move_made: (data: { row: number, col: number, player: string, playerId: string, gameState: Game, moveNumber: number }) => void
  game_ended: (data: { winner: string | null, isDraw: boolean, gameState: Game }) => void
  matchmaking_joined: (data: { skillLevel: number, gameMode: string }) => void
  matchmaking_left: () => void
  match_found: (data: { roomCode: string, gameId: string, opponent: string, symbol: 'X' | 'O' }) => void
  error: (data: { message: string }) => void

  // Client to server events
  authenticate: (data: { userId: string, walletAddress: string }) => void
  join_game: (data: { roomCode: string }) => void
  make_move: (data: { roomCode: string, row: number, col: number }) => void
  join_matchmaking: (data: { gameMode: 'quick' | 'ranked' }) => void
  leave_matchmaking: () => void
}

export interface UseGameSocketReturn {
  socket: Socket | null
  connected: boolean
  authenticated: boolean
  gameState: Game | null
  playerCount: number
  spectatorCount: number
  isInMatchmaking: boolean
  matchmakingData: { skillLevel?: number, gameMode?: string } | null
  error: string | null
  
  // Actions
  authenticate: (userId: string, walletAddress: string) => void
  joinGame: (roomCode: string) => void
  makeMove: (roomCode: string, row: number, col: number) => void
  joinMatchmaking: (gameMode: 'quick' | 'ranked') => void
  leaveMatchmaking: () => void
  clearError: () => void
}

export function useGameSocket(): UseGameSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [gameState, setGameState] = useState<Game | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [isInMatchmaking, setIsInMatchmaking] = useState(false)
  const [matchmakingData, setMatchmakingData] = useState<{ skillLevel?: number, gameMode?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Event handlers refs to avoid recreating functions
  const eventHandlersRef = useRef<Partial<GameSocketEvents>>({})

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    console.log('🔌 Connecting to Socket.IO server:', socketUrl)
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to game server')
      setConnected(true)
      setError(null)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from game server:', reason)
      setConnected(false)
      setAuthenticated(false)
      setGameState(null)
      setIsInMatchmaking(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Connection error:', error)
      setError('Failed to connect to game server')
      setConnected(false)
    })

    // Game events
    newSocket.on('authenticated', (data) => {
      console.log('🔐 Authenticated successfully')
      setAuthenticated(true)
      setError(null)
    })

    newSocket.on('authentication_failed', (data) => {
      console.error('🚫 Authentication failed:', data.error)
      setError(data.error)
      setAuthenticated(false)
    })

    newSocket.on('game_state', (game) => {
      console.log('🎮 Received game state:', game.room_code)
      setGameState(game)
    })

    newSocket.on('player_joined', (data) => {
      console.log('👤 Player joined:', data)
      setPlayerCount(data.playerCount)
      setSpectatorCount(data.spectatorCount)
    })

    newSocket.on('player_left', (data) => {
      console.log('👋 Player left:', data)
      setPlayerCount(data.playerCount)
      setSpectatorCount(data.spectatorCount)
    })

    newSocket.on('move_made', (data) => {
      console.log('🎯 Move made:', data)
      setGameState(data.gameState)
      
      // You can add custom move animation logic here
      if (eventHandlersRef.current.move_made) {
        eventHandlersRef.current.move_made(data)
      }
    })

    newSocket.on('game_ended', (data) => {
      console.log('🏁 Game ended:', data)
      setGameState(data.gameState)
      
      // You can add custom game end logic here
      if (eventHandlersRef.current.game_ended) {
        eventHandlersRef.current.game_ended(data)
      }
    })

    newSocket.on('matchmaking_joined', (data) => {
      console.log('🔍 Joined matchmaking:', data)
      setIsInMatchmaking(true)
      setMatchmakingData(data)
    })

    newSocket.on('matchmaking_left', () => {
      console.log('❌ Left matchmaking')
      setIsInMatchmaking(false)
      setMatchmakingData(null)
    })

    newSocket.on('match_found', (data) => {
      console.log('🎉 Match found:', data)
      setIsInMatchmaking(false)
      setMatchmakingData(null)
      
      // You can add custom match found logic here
      if (eventHandlersRef.current.match_found) {
        eventHandlersRef.current.match_found(data)
      }
    })

    newSocket.on('error', (data) => {
      console.error('❌ Socket error:', data.message)
      setError(data.message)
    })

    setSocket(newSocket)

    return () => {
      console.log('🔌 Cleaning up socket connection')
      newSocket.close()
    }
  }, [])

  // Action functions
  const authenticate = (userId: string, walletAddress: string) => {
    if (socket && connected) {
      console.log('🔐 Authenticating user:', userId)
      socket.emit('authenticate', { userId, walletAddress })
    }
  }

  const joinGame = (roomCode: string) => {
    if (socket && authenticated) {
      console.log('🎮 Joining game:', roomCode)
      socket.emit('join_game', { roomCode })
    }
  }

  const makeMove = (roomCode: string, row: number, col: number) => {
    if (socket && authenticated) {
      console.log('🎯 Making move:', { roomCode, row, col })
      socket.emit('make_move', { roomCode, row, col })
    }
  }

  const joinMatchmaking = (gameMode: 'quick' | 'ranked') => {
    if (socket && authenticated) {
      console.log('🔍 Joining matchmaking:', gameMode)
      socket.emit('join_matchmaking', { gameMode })
    }
  }

  const leaveMatchmaking = () => {
    if (socket && authenticated) {
      console.log('❌ Leaving matchmaking')
      socket.emit('leave_matchmaking')
    }
  }

  const clearError = () => {
    setError(null)
  }

  // Custom event handler setter (for advanced usage)
  const setEventHandler = <K extends keyof GameSocketEvents>(
    event: K, 
    handler: GameSocketEvents[K]
  ) => {
    eventHandlersRef.current[event] = handler
  }

  return {
    socket,
    connected,
    authenticated,
    gameState,
    playerCount,
    spectatorCount,
    isInMatchmaking,
    matchmakingData,
    error,
    
    // Actions
    authenticate,
    joinGame,
    makeMove,
    joinMatchmaking,
    leaveMatchmaking,
    clearError,
    
    // Advanced
    setEventHandler
  } as UseGameSocketReturn & { setEventHandler: typeof setEventHandler }
}

export default useGameSocket