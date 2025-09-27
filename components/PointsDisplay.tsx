'use client'

import { motion } from 'framer-motion'
import { Star, Zap, Trophy, Target } from 'lucide-react'
import { Player } from '@/app/page'

interface PointsDisplayProps {
  player: Player
  currentMultiplier: number
  streak: number
}

export default function PointsDisplay({ player, currentMultiplier, streak }: PointsDisplayProps) {
  const winRate = player.gamesPlayed > 0 ? (player.gamesWon / player.gamesPlayed) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
    >
      {/* Total Points */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-center"
      >
        <Star className="w-6 h-6 mx-auto mb-2 text-black" />
        <div className="text-2xl font-bold text-black">{player.points.toLocaleString()}</div>
        <div className="text-sm text-black/80">Total Points</div>
      </motion.div>

      {/* Current Multiplier */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-center"
      >
        <Zap className="w-6 h-6 mx-auto mb-2 text-white" />
        <div className="text-2xl font-bold text-white">{currentMultiplier}x</div>
        <div className="text-sm text-white/80">Current Multiplier</div>
      </motion.div>

      {/* Win Streak */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-center"
      >
        <Target className="w-6 h-6 mx-auto mb-2 text-white" />
        <div className="text-2xl font-bold text-white">{streak}</div>
        <div className="text-sm text-white/80">Win Streak</div>
      </motion.div>

      {/* Win Rate */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-center"
      >
        <Trophy className="w-6 h-6 mx-auto mb-2 text-white" />
        <div className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</div>
        <div className="text-sm text-white/80">Win Rate</div>
      </motion.div>
    </motion.div>
  )
}
