'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Target, Clock, Star, TrendingUp } from 'lucide-react'

interface Player {
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
  }
}

interface MultiplierInfoProps {
  onClose: () => void
  player: Player
}

export default function MultiplierInfo({ onClose, player }: MultiplierInfoProps) {
  const multiplierFactors = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Speed Bonus",
      description: "Win in fewer moves for higher multipliers",
      details: [
        "5 moves or less: +2.0x",
        "6-7 moves: +1.5x", 
        "8-9 moves: +1.0x"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Win Streak",
      description: "Consecutive wins increase your multiplier",
      details: [
        "Each win streak: +0.5x per win",
        "Max streak bonus: +5.0x"
      ],
      color: "from-red-500 to-pink-500"
    }
  ]

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
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full mx-2 border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Multiplier System</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Current Player Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-xl p-4 mb-6"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Your Current Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{player.gamesPlayed}</p>
                <p className="text-indigo-300 text-sm">Games</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-indigo-300 text-sm">Win Rate</p>
              </div>
            </div>
          </motion.div>

          {/* Multiplier Factors */}
          <div className="space-y-4 mb-6">
            {multiplierFactors.map((factor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${factor.color}/20 border border-white/10 rounded-xl p-4`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-white mt-1">
                    {factor.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">
                      {factor.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      {factor.description}
                    </p>
                    <ul className="space-y-2">
                      {factor.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-white/90 flex items-center">
                          <span className="w-2 h-2 bg-white/60 rounded-full mr-3"></span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-4"
          >
            <h3 className="text-base font-semibold text-white mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 mt-2"></span>
                <span>Focus on winning quickly to maximize speed multipliers</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 mt-2"></span>
                <span>Build win streaks to compound your multiplier effects</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 mt-2"></span>
                <span>Connect your wallet for enhanced rewards on Base network</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
