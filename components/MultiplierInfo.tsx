'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Target, Clock, Star, TrendingUp } from 'lucide-react'
import { Player } from '@/app/page'

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
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "X Ethos Score",
      description: "Your X profile's ethos score affects multipliers",
      details: [
        "Ethos score / 100 * 0.5x bonus",
        "Higher ethos = better rewards"
      ],
      color: "from-blue-500 to-purple-500"
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
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Multiplier System</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Current Player Stats */}
          {player && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-400/30 rounded-xl p-4 mb-6"
            >
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Your Current Stats
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-primary-300">Games Played:</span>
                  <span className="text-white font-semibold ml-2">{player.gamesPlayed}</span>
                </div>
                <div>
                  <span className="text-primary-300">Win Rate:</span>
                  <span className="text-white font-semibold ml-2">
                    {player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                {player.xProfile && (
                  <>
                    <div>
                      <span className="text-primary-300">X Ethos Score:</span>
                      <span className="text-white font-semibold ml-2">{player.xProfile.ethosScore}</span>
                    </div>
                    <div>
                      <span className="text-primary-300">Ethos Bonus:</span>
                      <span className="text-white font-semibold ml-2">
                        +{((player.xProfile.ethosScore / 100) * 0.5).toFixed(1)}x
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Multiplier Factors */}
          <div className="space-y-4">
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
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {factor.title}
                    </h3>
                    <p className="text-primary-200 mb-3">
                      {factor.description}
                    </p>
                    <ul className="space-y-1">
                      {factor.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-white/80 flex items-center">
                          <span className="w-2 h-2 bg-white/40 rounded-full mr-2"></span>
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
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-4"
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Pro Tips
            </h3>
            <ul className="space-y-1 text-sm text-white/90">
              <li>• Connect your X profile for permanent ethos score bonuses</li>
              <li>• Focus on winning quickly to maximize speed multipliers</li>
              <li>• Build win streaks to compound your multiplier effects</li>
              <li>• Higher ethos scores provide better long-term rewards</li>
            </ul>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
