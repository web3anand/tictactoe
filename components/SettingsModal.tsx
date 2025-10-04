'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Twitter, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  walletAddress?: string
  xProfile?: {
    username: string
    displayName: string
    avatar: string
    ethosScore: number
  }
}

interface SettingsModalProps {
  onClose: () => void
  player: Player | null
  onPlayerUpdate?: (updatedPlayer: Player) => void
}

interface EthosApiResponse {
  data: {
    id: string
    username: string
    name: string
    profileImageUrl: string
    ethosScore: number
    isVerified: boolean
  }
}

export default function SettingsModal({ onClose, player, onPlayerUpdate }: SettingsModalProps) {
  const [xUsername, setXUsername] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const connectXAccount = async () => {
    if (!xUsername.trim() || !player) return

    setIsConnecting(true)
    setConnectionStatus('idle')
    setErrorMessage('')

    try {
      // Clean username (remove @ if present)
      const cleanUsername = xUsername.replace('@', '').trim()
      
      // Call our internal API endpoint
      const response = await fetch(`/api/ethos?username=${encodeURIComponent(cleanUsername)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch user data: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('User not found on Ethos network')
      }

      const ethosData = result.data

      // Update player with X profile data
      const updatedPlayer: Player = {
        ...player,
        xProfile: {
          username: ethosData.username,
          displayName: ethosData.name,
          avatar: ethosData.profileImageUrl,
          ethosScore: ethosData.ethosScore
        }
      }

      // Update player data
      if (onPlayerUpdate) {
        onPlayerUpdate(updatedPlayer)
      }

      // Update localStorage
      localStorage.setItem('tictactoe-player', JSON.stringify(updatedPlayer))
      
      // Also update in all players storage
      const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
      allSavedPlayers[updatedPlayer.name] = updatedPlayer
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))

      setConnectionStatus('success')
      setXUsername('')
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error connecting X account:', error)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect X account')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectXAccount = () => {
    if (!player) return

    const updatedPlayer: Player = {
      ...player,
      xProfile: undefined
    }

    if (onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer)
    }

    // Update localStorage
    localStorage.setItem('tictactoe-player', JSON.stringify(updatedPlayer))
    
    // Also update in all players storage
    const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
    allSavedPlayers[updatedPlayer.name] = updatedPlayer
    localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))

    setConnectionStatus('idle')
    setErrorMessage('')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto mx-2 border border-white/20 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Player Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Player Profile</h3>
            <div className="bg-gray-100 dark:bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{player?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {player?.points.toLocaleString()} points • {player?.gamesWon}/{player?.gamesPlayed} wins
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* X Account Connection Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <Twitter className="w-5 h-5 text-blue-400" />
              <span>X (Twitter) Account</span>
            </h3>

            {player?.xProfile ? (
              /* Connected State */
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={player.xProfile.avatar}
                      alt={player.xProfile.displayName}
                      className="w-12 h-12 rounded-full border-2 border-green-300"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          {player.xProfile.displayName}
                        </p>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        @{player.xProfile.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {player.xProfile.ethosScore}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">Ethos Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        +{Math.floor(player.xProfile.ethosScore / 100 * 0.5 * 100)}%
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">Points Bonus</p>
                    </div>
                  </div>

                  <button
                    onClick={disconnectXAccount}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Disconnect X Account
                  </button>
                </div>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Connect your X account to get bonus points based on your Ethos score!
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        X Username
                      </label>
                      <input
                        type="text"
                        value={xUsername}
                        onChange={(e) => setXUsername(e.target.value)}
                        placeholder="Enter your X username"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isConnecting}
                      />
                    </div>

                    {connectionStatus === 'error' && (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {connectionStatus === 'success' && (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Successfully connected X account!</span>
                      </div>
                    )}

                    <button
                      onClick={connectXAccount}
                      disabled={!xUsername.trim() || isConnecting}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Twitter className="w-4 h-4" />
                          <span>Connect X Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Benefits Info */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits of connecting:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Earn bonus points based on your Ethos score</li>
                    <li>• Show your verified X profile in leaderboard</li>
                    <li>• Display your profile picture and real name</li>
                    <li>• Gain credibility in the gaming community</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Other Settings */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Game Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Sound Effects</span>
                <button className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Animations</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}