'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, User, LogOut } from 'lucide-react'

interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  walletAddress?: string
}

interface SettingsModalProps {
  onClose: () => void
  player: Player | null
  onPlayerUpdate?: (updatedPlayer: Player) => void
  onLogout?: () => void
}

export default function SettingsModal({ onClose, player, onPlayerUpdate, onLogout }: SettingsModalProps) {
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
            <div className="bg-gray-100 dark:bg-white/10 rounded-lg p-4 space-y-3">
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
              
              {/* Wallet Address */}
              {player?.walletAddress && (
                <div className="pt-2 border-t border-gray-200 dark:border-white/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                    {player.walletAddress}
                  </p>
                </div>
              )}
              
              {/* Player Stats */}
              <div className="pt-2 border-t border-gray-200 dark:border-white/20 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {player?.gamesPlayed ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Player ID</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {player?.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="mb-6">
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

          {/* Logout Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout()
                  onClose()
                }
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout & Disconnect Wallet</span>
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              This will disconnect your wallet and clear your session
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}