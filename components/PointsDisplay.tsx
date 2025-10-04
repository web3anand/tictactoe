'use client'

import { motion } from 'framer-motion'
import { Star, Zap, Trophy, Target } from 'lucide-react'
import { Player } from '@/types/game'

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
      className="grid grid-cols-2 gap-2 mb-4"
    >
      {/* Total Points */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-2 text-center hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
      >
        <Star className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
        <div className="text-sm font-bold text-foreground">{player.points.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Points</div>
      </motion.div>

      {/* Current Multiplier */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-2 text-center hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
      >
        <Zap className="w-4 h-4 mx-auto mb-1 text-purple-500" />
        <div className="text-sm font-bold text-foreground">{currentMultiplier}x</div>
        <div className="text-xs text-muted-foreground">Multiplier</div>
      </motion.div>

      {/* Win Streak */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-2 text-center hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
      >
        <Target className="w-4 h-4 mx-auto mb-1 text-red-500" />
        <div className="text-sm font-bold text-foreground">{streak}</div>
        <div className="text-xs text-muted-foreground">Streak</div>
      </motion.div>

      {/* Win Rate */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-2 text-center hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
      >
        <Trophy className="w-4 h-4 mx-auto mb-1 text-green-500" />
        <div className="text-sm font-bold text-foreground">{winRate.toFixed(1)}%</div>
        <div className="text-xs text-muted-foreground">Win Rate</div>
      </motion.div>
    </motion.div>
  )
}
