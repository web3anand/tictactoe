'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Users, Trophy, Zap, Settings, X, Copy, Share2, Bot, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createBotPlayer, getBotMove } from '@/lib/bot-player'

// Constants
const BOARD_SIZE = 6
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE // 36
const WIN_LENGTH = 4
const BOT_COUNTDOWN_SECONDS = 10
const BOT_MOVE_DELAY = 1000
const BASE_MULTIPLIER = 1.5

// Utility functions
const generateWinningCombinations = (): number[][] => {
  const combinations: number[][] = []
  
  // Rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      const start = row * BOARD_SIZE + col
      combinations.push(Array.from({ length: WIN_LENGTH }, (_, i) => start + i))
    }
  }
  
  // Columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
      const start = row * BOARD_SIZE + col
      combinations.push(Array.from({ length: WIN_LENGTH }, (_, i) => start + i * BOARD_SIZE))
    }
  }
  
  // Diagonals (top-left to bottom-right)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      const start = row * BOARD_SIZE + col
      combinations.push(Array.from({ length: WIN_LENGTH }, (_, i) => start + i * (BOARD_SIZE + 1)))
    }
  }
  
  // Diagonals (top-right to bottom-left)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < BOARD_SIZE; col++) {
      const start = row * BOARD_SIZE + col
      combinations.push(Array.from({ length: WIN_LENGTH }, (_, i) => start + i * (BOARD_SIZE - 1)))
    }
  }
  
  return combinations
}

const checkWinner = (board: string[], combinations: number[][]): string | null => {
  for (const combination of combinations) {
    const [first, ...rest] = combination
    if (board[first] && rest.every(pos => board[pos] === board[first])) {
      return board[first]
    }
  }
  return null
}

const calculateMultiplier = (moves: number, streak: number, xProfile?: Player['xProfile']): number => {
  let multiplier = BASE_MULTIPLIER
  
  // Speed bonus
  if (moves <= 5) multiplier += 2.0
  else if (moves <= 7) multiplier += 1.5
  else if (moves <= 9) multiplier += 1.0
  
  // Streak bonus
  if (streak > 0) multiplier += streak * 0.5
  
  // X profile bonus
  if (xProfile?.ethosScore) {
    multiplier += (xProfile.ethosScore / 100) * 0.5
  }
  
  return multiplier
}

const generateRoomCode = (isBot: boolean = false): string => {
  const prefix = isBot ? 'BOT' : ''
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return prefix + suffix
}

  interface Player {
    id: string
    name: string
    points: number
    gamesPlayed: number
    gamesWon: number
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'human'
    walletAddress?: string
    xProfile?: any
  }

interface Game {
  id: string
  roomCode: string
  player1: Player
  player2?: Player
  currentPlayer: string
  board: string[]
  gameOver: boolean
  winner?: string | null
  moves: number
  multiplier: number
  streak: number
}

export default function MultiplayerPage() {
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isBotGame, setIsBotGame] = useState(false)
  const [botPlayer, setBotPlayer] = useState<Player | null>(null)
  const [botCountdown, setBotCountdown] = useState(0)
  const [showVictoryPopup, setShowVictoryPopup] = useState(false)
  const [victoryData, setVictoryData] = useState<{
    winner: string
    loser: string
    winnerProfile: Player
    loserProfile: Player
    multiplier: number
    moves: number
    pointsEarned: number
  } | null>(null)

  // Load player from localStorage
  useEffect(() => {
    const savedPlayer = localStorage.getItem('tictactoe-player')
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer))
    }
  }, [])

  // Enhanced createGame function with better structure
  const createGame = useCallback(async (withBot: boolean = false) => {
    if (!player) {
      setError('Player not found. Please login again.')
      return
    }

    setIsCreating(true)
    setError('')
    setBotCountdown(0) // Reset countdown

    try {
      if (withBot) {
        // Create bot game locally
        const bot = createBotPlayer(0) // Use first bot for multiplayer fallback
        setBotPlayer(bot)
        setIsBotGame(true)
        
        const mockGame: Game = {
          id: Math.random().toString(36).substring(2, 15),
          roomCode: generateRoomCode(true),
          player1: player,
          player2: bot,
          currentPlayer: 'X',
          board: Array(BOARD_CELLS).fill(''),
          gameOver: false,
          moves: 0,
          multiplier: BASE_MULTIPLIER,
          streak: 0
        }
        
        setGame(mockGame)
      } else {
        // Create online game
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            playerName: player.name,
            walletAddress: player.walletAddress,
            xProfile: player.xProfile
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          // Ensure the game has a properly initialized board
          const gameWithBoard = {
            ...data.game,
            board: data.game.board?.length === BOARD_CELLS ? data.game.board : Array(BOARD_CELLS).fill('')
          }
          setGame(gameWithBoard)
          
          // Start countdown for bot auto-join
          setBotCountdown(BOT_COUNTDOWN_SECONDS)
          const countdownInterval = setInterval(() => {
            setBotCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          
          // Auto-add bot after countdown
          const botTimeout = setTimeout(() => {
            setGame(currentGame => {
              if (currentGame && !currentGame.player2) {
                const bot = createBotPlayer(0) // Use first bot for auto-fallback
                setBotPlayer(bot)
                setIsBotGame(true)
                setBotCountdown(0)
                
                return {
                  ...currentGame,
                  player2: bot,
                  board: currentGame.board?.length === BOARD_CELLS ? currentGame.board : Array(BOARD_CELLS).fill('')
                }
              }
              return currentGame
            })
          }, BOT_COUNTDOWN_SECONDS * 1000)

          // Store timeout ID for cleanup
          return () => {
            clearInterval(countdownInterval)
            clearTimeout(botTimeout)
          }
        } else {
          setError(data.error || 'Failed to create game')
        }
      }
    } catch (error) {
      console.error('Create game error:', error)
      setError('Failed to create game. Please check your connection and try again.')
    } finally {
      setIsCreating(false)
    }
  }, [player])

  // Enhanced joinGame function
  const joinGame = useCallback(async () => {
    if (!player) {
      setError('Player not found. Please login again.')
      return
    }
    
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      const response = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.trim(),
          playerId: player.id,
          playerName: player.name,
          walletAddress: player.walletAddress,
          xProfile: player.xProfile
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Ensure the game has a properly initialized board
        const gameWithBoard = {
          ...data.game,
          board: data.game.board?.length === BOARD_CELLS ? data.game.board : Array(BOARD_CELLS).fill('')
        }
        setGame(gameWithBoard)
        setRoomCode('') // Clear room code after successful join
      } else {
        setError(data.error || 'Failed to join game')
      }
    } catch (error) {
      console.error('Join game error:', error)
      setError('Failed to join game. Please check the room code and try again.')
    } finally {
      setIsJoining(false)
    }
  }, [player, roomCode])

  // Enhanced resetGame function
  const resetGame = useCallback(() => {
    setError('') // Clear any errors
    
    if (isBotGame && botPlayer && player) {
      const newGame: Game = {
        id: Math.random().toString(36).substring(2, 15),
        roomCode: generateRoomCode(true),
        player1: player,
        player2: botPlayer,
        currentPlayer: 'X',
        board: Array(BOARD_CELLS).fill(''),
        gameOver: false,
        moves: 0,
        multiplier: BASE_MULTIPLIER,
        streak: 0
      }
      setGame(newGame)
    } else {
      // Reset online game - go back to lobby
      setGame(null)
      setIsBotGame(false)
      setBotPlayer(null)
      setBotCountdown(0)
    }
  }, [isBotGame, botPlayer, player])

  // Enhanced copyRoomCode function with user feedback
  const copyRoomCode = useCallback(async () => {
    if (!game?.roomCode) return
    
    try {
      await navigator.clipboard.writeText(game.roomCode)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy room code:', error)
      setError('Failed to copy room code')
    }
  }, [game?.roomCode])

  // Memoize winning combinations for performance
  const winningCombinations = useMemo(() => generateWinningCombinations(), [])

  // Enhanced makeMove function with better error handling
  const makeMove = useCallback(async (position: number) => {
    if (!game || !player || game.gameOver || game.board[position]) {
      return
    }

    // Prevent moves when waiting for online player
    if (!isBotGame && !game.player2) {
      setError('Waiting for another player to join')
      return
    }

    try {
      if (isBotGame) {
        // Handle bot game locally
        const newBoard = [...game.board]
        newBoard[position] = game.currentPlayer
        
        const winner = checkWinner(newBoard, winningCombinations)
        const newMoves = game.moves + 1
        const gameOver = !!winner || newMoves === BOARD_CELLS
        const finalWinner = winner || (newMoves === BOARD_CELLS ? 'Draw' : null)

        // Calculate multiplier for winning player
        let multiplier = game.multiplier
        if (gameOver && finalWinner && finalWinner !== 'Draw') {
          multiplier = calculateMultiplier(newMoves, game.streak, player.xProfile)
        }

        const updatedGame = {
          ...game,
          board: newBoard,
          currentPlayer: game.currentPlayer === 'X' ? 'O' : 'X',
          moves: newMoves,
          winner: finalWinner,
          gameOver,
          multiplier: gameOver ? multiplier : game.multiplier,
          streak: gameOver && finalWinner && finalWinner !== 'Draw' ? game.streak + 1 : 0
        }

        setGame(updatedGame)
        
        // Update player stats and show victory popup
        if (gameOver && finalWinner && finalWinner !== 'Draw') {
          updatePlayerStats(finalWinner, multiplier)
        }

        // Schedule bot move if game continues
        if (!gameOver && updatedGame.currentPlayer === 'O') {
          setTimeout(() => {
            const botMove = getBotMove({
              board: updatedGame.board,
              currentPlayer: updatedGame.currentPlayer,
              gameOver: updatedGame.gameOver,
              winner: updatedGame.winner,
              moves: updatedGame.moves
            }, 'O', botPlayer?.difficulty || 'medium')

            if (botMove !== -1) {
              makeMove(botMove)
            }
          }, BOT_MOVE_DELAY)
        }
      } else {
        // Handle online game
        const response = await fetch(`/api/games/${game.id}/moves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position,
            playerId: player.id,
            symbol: game.currentPlayer
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setGame(data.game)
          setError('') // Clear any previous errors
        } else {
          setError(data.error || 'Failed to make move')
        }
      }
    } catch (error) {
      console.error('Move error:', error)
      setError('Failed to make move. Please try again.')
    }
  }, [game, player, isBotGame, winningCombinations, botPlayer])

  // Helper function to update player statistics
  const updatePlayerStats = useCallback((winner: string | null, multiplier: number) => {
    if (!player || !winner || winner === 'Draw') return

    const isPlayerWinner = (winner === 'X' && game?.player1.id === player.id) || 
                          (winner === 'O' && game?.player2?.id === player.id)

    if (isPlayerWinner) {
      const pointsEarned = Math.floor(100 * multiplier)
      const updatedPlayer = {
        ...player,
        points: player.points + pointsEarned,
        gamesPlayed: player.gamesPlayed + 1,
        gamesWon: player.gamesWon + 1
      }
      setPlayer(updatedPlayer)
      localStorage.setItem('tictactoe-player', JSON.stringify(updatedPlayer))
      
      // Set victory data for popup
      if (game?.player2) {
        setVictoryData({
          winner: winner,
          loser: winner === 'X' ? 'O' : 'X',
          winnerProfile: winner === 'X' ? game.player1 : game.player2,
          loserProfile: winner === 'X' ? game.player2 : game.player1,
          multiplier: multiplier,
          moves: game.moves + 1,
          pointsEarned: pointsEarned
        })
        setShowVictoryPopup(true)
      }
    } else {
      // Player lost or drew
      const updatedPlayer = {
        ...player,
        gamesPlayed: player.gamesPlayed + 1
      }
      setPlayer(updatedPlayer)
      localStorage.setItem('tictactoe-player', JSON.stringify(updatedPlayer))
      
      // Set defeat data for popup
      if (game?.player2) {
        setVictoryData({
          winner: winner,
          loser: winner === 'X' ? 'O' : 'X',
          winnerProfile: winner === 'X' ? game.player1 : game.player2,
          loserProfile: winner === 'X' ? game.player2 : game.player1,
          multiplier: multiplier,
          moves: game.moves + 1,
          pointsEarned: 0
        })
        setShowVictoryPopup(true)
      }
    }
  }, [player, game])

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please login first</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Multiplayer TicTacToe</h1>
            <p className="text-primary-200">Play with friends and compete for points!</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => createGame(false)}
                disabled={isCreating}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">Online Game</span>
              </button>

              <button
                onClick={() => createGame(true)}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span className="text-sm">Play with Bot</span>
              </button>
            </div>

            <div className="text-center text-primary-300">or</div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    joinGame()
                  }
                }}
              />
              <button
                onClick={joinGame}
                disabled={isJoining || !roomCode.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h1 className="text-lg font-bold text-white">Multiplayer Game</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>


        {/* Enhanced Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="error-container"
          >
            <div className="error-card">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Board - 6x6 */}
        <div className="mb-6 flex justify-center">
          <div 
            className="grid mx-auto p-3 bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-3xl border-2 border-blue-200 shadow-xl"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, 64px)`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, 64px)`,
              gap: '4px',
              width: '404px'
            }}
          >
            {game.board.map((cell, index) => {
              const isDisabled = !!cell || game.gameOver || (!isBotGame && !game.player2)
              
              return (
                <button
                  key={index}
                  onClick={() => makeMove(index)}
                  disabled={isDisabled}
                  className={`relative bg-white border-2 border-blue-200 rounded-xl flex items-center justify-center text-2xl font-semibold transition-all duration-300 ${
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                  style={{
                    width: '64px',
                    height: '64px'
                  }}
                  aria-label={`Cell ${index + 1}, ${cell || 'empty'}`}
                >
                  {/* Corner accents */}
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-40"></div>
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-40"></div>
                  <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-40"></div>
                  <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-40"></div>
                  
                  {cell === 'X' && (
                    <motion.div
                      initial={{ rotateY: 180, scale: 0.8 }}
                      animate={{ 
                        rotateY: 0, 
                        scale: 1,
                        x: [0, 1, -1, 1, 0],
                        y: [0, -1, 1, -1, 0]
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300,
                        damping: 20,
                        x: {
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut"
                        },
                        y: {
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut"
                        }
                      }}
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <motion.div
                        initial={{ rotateY: 180 }}
                        animate={{ 
                          rotateY: 0,
                          boxShadow: [
                            "0 0 0px rgba(34, 211, 238, 0.4)",
                            "0 0 8px rgba(34, 211, 238, 0.6)",
                            "0 0 0px rgba(34, 211, 238, 0.4)"
                          ]
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300,
                          damping: 20,
                          delay: 0.1,
                          boxShadow: {
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut"
                          }
                        }}
                        className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-lg"
                        style={{ 
                          transformStyle: 'preserve-3d',
                          filter: 'contrast(1.1) brightness(1.05)'
                        }}
                      />
                    </motion.div>
                  )}
                  {cell === 'O' && (
                    <motion.div
                      initial={{ rotateY: -180, scale: 0.8 }}
                      animate={{ 
                        rotateY: 0, 
                        scale: 1,
                        x: [0, -1, 1, -1, 0],
                        y: [0, 1, -1, 1, 0]
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300,
                        damping: 20,
                        x: {
                          repeat: Infinity,
                          duration: 2.2,
                          ease: "easeInOut"
                        },
                        y: {
                          repeat: Infinity,
                          duration: 1.8,
                          ease: "easeInOut"
                        }
                      }}
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <motion.div
                        initial={{ rotateY: -180 }}
                        animate={{ 
                          rotateY: 0,
                          boxShadow: [
                            "0 0 0px rgba(236, 72, 153, 0.4)",
                            "0 0 8px rgba(236, 72, 153, 0.6)",
                            "0 0 0px rgba(236, 72, 153, 0.4)"
                          ]
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300,
                          damping: 20,
                          delay: 0.1,
                          boxShadow: {
                            repeat: Infinity,
                            duration: 1.3,
                            ease: "easeInOut"
                          }
                        }}
                        className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg"
                        style={{ 
                          transformStyle: 'preserve-3d',
                          filter: 'contrast(1.1) brightness(1.05)'
                        }}
                      />
                    </motion.div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Current Turn Indicator (only when game is active) */}
        {!game.gameOver && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-[404px] bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-2xl p-4 shadow-lg text-center">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Current Turn
              </p>
              <p className="text-lg font-black">
                <span className={`${game.currentPlayer === 'X' ? 'text-cyan-600' : 'text-pink-600'}`}>
                  Player {game.currentPlayer}
                </span>
                {isBotGame && game.currentPlayer === 'O' && (
                  <span className="text-sm text-purple-600 ml-2 font-medium">(AI Thinking...)</span>
                )}
              </p>
              {!isBotGame && !game.player2 && (
                <div className="text-sm text-amber-600 mt-2 font-medium">
                  <p>⏳ Waiting for another player...</p>
                  {botCountdown > 0 && (
                    <p className="text-orange-600 font-bold mt-1">
                      🤖 Bot joins in {botCountdown}s
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multiplier Info */}
        {game.multiplier > 1 && (
          <div className="multiplier-container">
            <div className="multiplier-card">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-black text-amber-700">Multiplier: {game.multiplier}x</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1 text-center">Bonus points active!</p>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <span>🎮</span>
            <span>New Game</span>
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <span>🏠</span>
            <span>Menu</span>
          </button>
        </div>

        {/* Victory Popup */}
        <AnimatePresence>
          {showVictoryPopup && victoryData && (
            <VictoryPopup
              victoryData={victoryData}
              currentPlayer={player}
              onClose={() => {
                setShowVictoryPopup(false)
                setVictoryData(null)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Victory Popup Component
function VictoryPopup({ 
  victoryData, 
  currentPlayer, 
  onClose 
}: { 
  victoryData: {
    winner: string
    loser: string
    winnerProfile: Player
    loserProfile: Player
    multiplier: number
    moves: number
    pointsEarned: number
  }
  currentPlayer: Player | null
  onClose: () => void 
}) {
  const isWinner = currentPlayer?.id === victoryData.winnerProfile.id
  
  const copyVictoryCard = async () => {
    try {
      // Create a canvas to generate the victory card image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = 600
      canvas.height = 800
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 600, 800)
      if (isWinner) {
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(0.5, '#FFA500')
        gradient.addColorStop(1, '#FF6B35')
      } else {
        gradient.addColorStop(0, '#6366F1')
        gradient.addColorStop(0.5, '#8B5CF6')
        gradient.addColorStop(1, '#A855F7')
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 600, 800)
      
      // Add sparkle effects
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 600
        const y = Math.random() * 800
        const size = Math.random() * 4 + 1
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Add title
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(isWinner ? 'VICTORY!' : 'DEFEAT', 300, 100)
      
      // Add game info
      ctx.font = '24px Arial'
      ctx.fillText(`${victoryData.winnerProfile.name} VS ${victoryData.loserProfile.name}`, 300, 200)
      ctx.fillText(`Winner: ${victoryData.winner} | Moves: ${victoryData.moves}`, 300, 250)
      ctx.fillText(`Multiplier: ${victoryData.multiplier}x`, 300, 300)
      if (victoryData.pointsEarned > 0) {
        ctx.fillText(`Points Earned: ${victoryData.pointsEarned}`, 300, 350)
      }
      
      // Convert to blob and copy to clipboard
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ])
            alert('Victory card copied to clipboard!')
          } catch (err) {
            console.error('Failed to copy image:', err)
            // Fallback: download the image
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tictactoe-victory-${Date.now()}.png`
            a.click()
            URL.revokeObjectURL(url)
          }
        }
      })
    } catch (error) {
      console.error('Error creating victory card:', error)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.5, rotateY: -180 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Victory Card */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border-4 ${
          isWinner 
            ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 border-yellow-300' 
            : 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 border-purple-300'
        }`}>
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isWinner 
                ? 'from-yellow-200/50 via-transparent to-orange-200/50' 
                : 'from-purple-200/50 via-transparent to-blue-200/50'
            } animate-pulse`}></div>
            
            {/* Sparkle Effects */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Content */}
          <div className="relative p-8 text-center text-white">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h1 className={`text-4xl font-black mb-2 ${
                isWinner ? 'text-yellow-100' : 'text-purple-100'
              }`}>
                {isWinner ? '🏆 VICTORY! 🏆' : '💪 GOOD FIGHT! 💪'}
              </h1>
              <p className="text-lg font-semibold opacity-90">
                {isWinner ? 'Congratulations, Champion!' : 'Better luck next time!'}
              </p>
            </motion.div>

            {/* VS Section */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                {/* Winner */}
                <div className={`flex flex-col items-center p-4 rounded-2xl ${
                  isWinner ? 'bg-white/20 ring-2 ring-yellow-300' : 'bg-white/10'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                    victoryData.winner === 'X' 
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
                      : 'bg-gradient-to-br from-pink-500 to-purple-600'
                  }`}>
                    <span className="text-2xl font-black text-white">{victoryData.winner}</span>
                  </div>
                  <p className="text-sm font-bold text-center">{victoryData.winnerProfile.name}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Trophy className="w-3 h-3 text-yellow-300" />
                    <span className="text-xs">{victoryData.winnerProfile.points.toLocaleString()}</span>
                  </div>
                  {isWinner && (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-2xl mt-2"
                    >
                      👑
                    </motion.div>
                  )}
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-3xl font-black text-white mb-2"
                  >
                    VS
                  </motion.div>
                  <div className="text-sm opacity-75">
                    {victoryData.moves} moves
                  </div>
                </div>

                {/* Loser */}
                <div className={`flex flex-col items-center p-4 rounded-2xl ${
                  !isWinner ? 'bg-white/20 ring-2 ring-purple-300' : 'bg-white/10'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                    victoryData.loser === 'X' 
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
                      : 'bg-gradient-to-br from-pink-500 to-purple-600'
                  }`}>
                    <span className="text-2xl font-black text-white">{victoryData.loser}</span>
                  </div>
                  <p className="text-sm font-bold text-center">{victoryData.loserProfile.name}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Trophy className="w-3 h-3 text-gray-300" />
                    <span className="text-xs">{victoryData.loserProfile.points.toLocaleString()}</span>
                  </div>
                  {!isWinner && (
                    <div className="text-lg mt-2">🔥</div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-2xl font-black">{victoryData.multiplier}x</div>
                  <div className="text-xs opacity-75">Multiplier</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-2xl font-black">
                    {isWinner ? `+${victoryData.pointsEarned}` : '0'}
                  </div>
                  <div className="text-xs opacity-75">Points</div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex space-x-3"
            >
              <button
                onClick={copyVictoryCard}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Card</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
