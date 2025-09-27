'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Crown, Medal, Award } from 'lucide-react'
import { Player } from '@/app/page'

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
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/50'
      case 1:
        return 'from-gray-400/20 to-gray-500/20 border-gray-300/50'
      case 2:
        return 'from-amber-500/20 to-amber-600/20 border-amber-400/50'
      default:
        return 'from-primary-500/20 to-primary-600/20 border-primary-400/50'
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
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-primary-200"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-primary-400/50" />
                <p className="text-lg">No players yet!</p>
                <p className="text-sm">Be the first to play and climb the leaderboard!</p>
              </motion.div>
            ) : (
              leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`leaderboard-item border ${getRankColor(index)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                        {getRankIcon(index)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {player.xProfile?.avatar && (
                          <img
                            src={player.xProfile.avatar}
                            alt={player.name}
                            className="w-10 h-10 rounded-full border-2 border-white/30"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-white">{player.name}</div>
                          {player.xProfile && (
                            <div className="text-sm text-primary-300">
                              @{player.xProfile.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {player.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-primary-300">
                        {player.gamesWon}/{player.gamesPlayed} wins
                      </div>
                    </div>
                  </div>

                  {/* X Profile Ethos Score */}
                  {player.xProfile?.ethosScore && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-primary-300">X Ethos Score:</span>
                        <span className="text-white font-semibold">
                          {player.xProfile.ethosScore}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
