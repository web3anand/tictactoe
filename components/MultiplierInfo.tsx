'use client'

import { motion } from 'framer-motion'
import { X, Zap, Target, Clock, Star, TrendingUp } from 'lucide-react'

interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'human'
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
      icon: <Clock className="w-5 h-5 text-green-400" />,
      title: "Speed Bonus",
      description: "Win in fewer moves for higher multipliers.",
      details: [
        "5 moves or less: +2.0x",
        "6-7 moves: +1.5x", 
        "8-9 moves: +1.0x"
      ],
      color: "border-green-500/50"
    },
    {
      icon: <Target className="w-5 h-5 text-red-400" />,
      title: "Win Streak",
      description: "Consecutive wins increase your multiplier.",
      details: [
        "Each win streak: +0.5x per win",
        "Max streak bonus: +5.0x"
      ],
      color: "border-red-500/50"
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      title: "Pro Tips",
      description: "Maximize your score with these tips.",
      details: [
        "Focus on winning quickly to maximize speed multipliers.",
        "Build win streaks to compound your multiplier effects.",
        "Connect your wallet for enhanced rewards on Base network."
      ],
      color: "border-yellow-500/50"
    }
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-800 w-full max-w-md rounded-t-2xl p-5 shadow-2xl border-t border-gray-700"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Multiplier System</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Current Stats */}
        <div className="bg-gray-900/50 rounded-lg p-3 mb-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
            Your Current Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-white">{player.gamesPlayed}</p>
              <p className="text-xs text-gray-400">Games</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-gray-400">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Multiplier Factors */}
        <div className="space-y-3">
          {multiplierFactors.map((factor, index) => (
            <div key={index} className={`bg-gray-900/50 rounded-lg p-3 border ${factor.color}`}>
              <div className="flex items-center space-x-2.5 mb-1.5">
                {factor.icon}
                <h3 className="font-bold text-white">{factor.title}</h3>
              </div>
              <p className="text-xs text-gray-400 ml-1 mb-2">{factor.description}</p>
              <ul className="space-y-1">
                {factor.details.map((detail, i) => (
                  <li key={i} className="flex items-center text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2.5"></span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
