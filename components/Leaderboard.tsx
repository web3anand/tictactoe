'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Crown, Medal, Award } from 'lucide-react'

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

interface LeaderboardProps {
  leaderboard: Player[]
  onClose: () => void
}

export default function Leaderboard({ leaderboard, onClose }: LeaderboardProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <Trophy className="w-5 h-5 text-primary-400" />
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'border-yellow-400/70 shadow-yellow-400/20 shadow-md'
      case 1:
        return 'border-gray-400/70 shadow-gray-400/20 shadow-md'
      case 2:
        return 'border-amber-500/70 shadow-amber-500/20 shadow-md'
      default:
        return 'border-blue-400/50 shadow-blue-400/10 shadow-sm'
    }
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
          className="bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl p-4 max-w-sm w-full max-h-[85vh] overflow-y-auto mx-2 border border-white/20 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leaderboard</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-gray-600 dark:text-gray-300"
              >
                <Trophy className="w-12 h-12 mx-auto mb-3 text-primary-400/50" />
                <p className="text-sm text-gray-700 dark:text-gray-200">No players yet!</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Be the first to play and climb the leaderboard!</p>
              </motion.div>
            ) : (
              leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/30 dark:hover:border-white/20 ${getRankColor(index)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-white/20">
                        {getRankIcon(index)}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-32">{player.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {player.gamesPlayed} games
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {player.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {player.gamesWon}/{player.gamesPlayed}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
