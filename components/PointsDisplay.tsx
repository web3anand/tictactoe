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

  const stats = [
    {
      icon: Star,
      value: player.points.toLocaleString(),
      label: 'Points',
      color: 'text-base-yellow',
      bgColor: 'bg-base-yellow/10',
    },
    {
      icon: Zap,
      value: `${currentMultiplier.toFixed(1)}x`,
      label: 'Multiplier',
      color: 'text-base-cerulean',
      bgColor: 'bg-base-cerulean/10',
    },
    {
      icon: Target,
      value: streak,
      label: 'Streak',
      color: 'text-base-red',
      bgColor: 'bg-base-red/10',
    },
    {
      icon: Trophy,
      value: `${winRate.toFixed(0)}%`,
      label: 'Win Rate',
      color: 'text-base-green',
      bgColor: 'bg-base-green/10',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      className="grid grid-cols-2 gap-4 mb-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
          className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-3 ${stat.bgColor} rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
