'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Zap, Users, Twitter, Crown } from 'lucide-react'
import { sdk } from '@farcaster/miniapp-sdk'
import GameBoard from '@/components/GameBoard'
import Leaderboard from '@/components/Leaderboard'
import PointsDisplay from '@/components/PointsDisplay'
import XProfileConnect from '@/components/XProfileConnect'
import MultiplierInfo from '@/components/MultiplierInfo'

export interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  xProfile?: {
    username: string
    displayName: string
    avatar: string
    ethosScore: number
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

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false,
    moves: 0,
    multiplier: 1,
    streak: 0
  })

  const [player, setPlayer] = useState<Player | null>(null)
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showMultiplierInfo, setShowMultiplierInfo] = useState(false)

  // Load player data from localStorage and initialize MiniApp SDK
  useEffect(() => {
    const savedPlayer = localStorage.getItem('tictactoe-player')
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer))
    }

    const savedLeaderboard = localStorage.getItem('tictactoe-leaderboard')
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard))
    }

    // Initialize MiniApp SDK
    const initSDK = async () => {
      try {
        await sdk.actions.ready()
      } catch (error) {
        console.log('MiniApp SDK not available:', error)
      }
    }
    
    initSDK()
  }, [])

  // Save player data to localStorage
  useEffect(() => {
    if (player) {
      localStorage.setItem('tictactoe-player', JSON.stringify(player))
    }
  }, [player])

  // Save leaderboard to localStorage
  useEffect(() => {
    if (leaderboard.length > 0) {
      localStorage.setItem('tictactoe-leaderboard', JSON.stringify(leaderboard))
    }
  }, [leaderboard])

  const calculateMultiplier = (moves: number, streak: number): number => {
    let multiplier = 1
    
    // Base multiplier based on move count (faster wins = higher multiplier)
    if (moves <= 5) multiplier += 2
    else if (moves <= 7) multiplier += 1.5
    else if (moves <= 9) multiplier += 1
    
    // Streak bonus
    if (streak > 0) multiplier += streak * 0.5
    
    // X profile ethos score bonus
    if (player?.xProfile?.ethosScore) {
      multiplier += (player.xProfile.ethosScore / 100) * 0.5
    }
    
    return Math.round(multiplier * 10) / 10
  }

  const handleGameEnd = (winner: string | null, moves: number) => {
    if (!player) return

    const newMultiplier = calculateMultiplier(moves, gameState.streak)
    const pointsEarned = winner ? Math.floor(100 * newMultiplier) : Math.floor(20 * newMultiplier)
    
    const updatedPlayer = {
      ...player,
      points: player.points + pointsEarned,
      gamesPlayed: player.gamesPlayed + 1,
      gamesWon: winner ? player.gamesWon + 1 : player.gamesWon
    }

    setPlayer(updatedPlayer)
    
    // Update leaderboard
    const existingPlayerIndex = leaderboard.findIndex(p => p.id === player.id)
    if (existingPlayerIndex >= 0) {
      const updatedLeaderboard = [...leaderboard]
      updatedLeaderboard[existingPlayerIndex] = updatedPlayer
      setLeaderboard(updatedLeaderboard.sort((a, b) => b.points - a.points))
    } else {
      setLeaderboard([...leaderboard, updatedPlayer].sort((a, b) => b.points - a.points))
    }

    // Update streak
    setGameState(prev => ({
      ...prev,
      streak: winner ? prev.streak + 1 : 0
    }))
  }

  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false,
      moves: 0,
      multiplier: 1,
      streak: gameState.streak
    })
  }

  const createPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      points: 0,
      gamesPlayed: 0,
      gamesWon: 0
    }
    setPlayer(newPlayer)
  }

  const connectXProfile = (xProfile: any) => {
    if (!player) return
    
    setPlayer({
      ...player,
      xProfile: {
        username: xProfile.username,
        displayName: xProfile.displayName,
        avatar: xProfile.avatar,
        ethosScore: xProfile.ethosScore || 50 // Default ethos score
      }
    })
  }

  const logout = () => {
    if (!player) return
    
    if (window.confirm('Are you sure you want to disconnect your X profile? This will remove your ethos score bonus.')) {
      setPlayer({
        ...player,
        xProfile: undefined
      })
    }
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">TicTacToe Pro</h1>
            <p className="text-primary-200">Strategic XO with Multipliers</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-400"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  createPlayer(e.currentTarget.value.trim())
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input')
                if (input?.value.trim()) {
                  createPlayer(input.value.trim())
                }
              }}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Start Playing
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">TicTacToe Pro</h1>
              <p className="text-primary-200">Welcome, {player.name}!</p>
              {player.xProfile && (
                <div className="flex items-center space-x-2 mt-1">
                  <img
                    src={player.xProfile.avatar}
                    alt={player.xProfile.displayName}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-primary-300">
                    @{player.xProfile.username} • Ethos: {player.xProfile.ethosScore}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {player.xProfile && (
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 rounded-lg transition-all duration-300 text-red-300 hover:text-red-200"
              >
                <Twitter className="w-4 h-4" />
                <span>Disconnect X</span>
              </button>
            )}
            
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300"
            >
              <Trophy className="w-5 h-5" />
              <span>Leaderboard</span>
            </button>
            
            <button
              onClick={() => setShowMultiplierInfo(!showMultiplierInfo)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300"
            >
              <Zap className="w-5 h-5" />
              <span>Multipliers</span>
            </button>
          </div>
        </motion.header>

        {/* X Profile Connection */}
        {!player.xProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <XProfileConnect onConnect={connectXProfile} />
          </motion.div>
        )}

        {/* Points Display */}
        <PointsDisplay 
          player={player} 
          currentMultiplier={calculateMultiplier(gameState.moves, gameState.streak)}
          streak={gameState.streak}
        />

        {/* Game Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <GameBoard
            gameState={gameState}
            setGameState={setGameState}
            onGameEnd={handleGameEnd}
            multiplier={calculateMultiplier(gameState.moves, gameState.streak)}
          />
        </motion.div>

        {/* Game Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            New Game
          </button>
        </motion.div>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <Leaderboard
              leaderboard={leaderboard}
              onClose={() => setShowLeaderboard(false)}
            />
          )}
        </AnimatePresence>

        {/* Multiplier Info Modal */}
        <AnimatePresence>
          {showMultiplierInfo && (
            <MultiplierInfo
              onClose={() => setShowMultiplierInfo(false)}
              player={player}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
