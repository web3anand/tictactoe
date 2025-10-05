'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Share2, Plus, Cast } from 'lucide-react'
import { useFarcaster } from './FarcasterProvider'

interface FarcasterActionsProps {
  gameData?: {
    gameId: string
    won: boolean
    score: number
    opponent?: string
  }
  className?: string
}

export function FarcasterActions({ gameData, className = '' }: FarcasterActionsProps) {
  const { isInMiniApp, composeCast, addMiniApp } = useFarcaster()

  if (!isInMiniApp) {
    return null // Only show in Farcaster Mini App
  }

  const handleShareGame = async () => {
    try {
      let text = "Just played TicTacToe Pro! 🎮"
      let embeds: [string] = ["https://tictactoe-pro-vercel.app"]

      if (gameData) {
        if (gameData.won) {
          text = `Just won a game of TicTacToe Pro! 🏆 Scored ${gameData.score} points`
        } else {
          text = `Just finished an epic TicTacToe Pro match! 🎯 Scored ${gameData.score} points`
        }
        
        if (gameData.gameId) {
          embeds = [`https://tictactoe-pro-vercel.app/game/${gameData.gameId}`]
        }
      }

      await composeCast({
        text,
        embeds,
        channelKey: "gaming"
      })
    } catch (error) {
      console.error('Failed to share game:', error)
    }
  }

  const handleAddToFarcaster = async () => {
    try {
      await addMiniApp()
    } catch (error) {
      console.error('Failed to add Mini App:', error)
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <motion.button
        onClick={handleShareGame}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 size={16} />
        Share Game
      </motion.button>

      <motion.button
        onClick={handleAddToFarcaster}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={16} />
        Add to Farcaster
      </motion.button>
    </div>
  )
}

interface FarcasterAuthButtonProps {
  onSuccess?: (result: any) => void
  className?: string
}

export function FarcasterAuthButton({ onSuccess, className = '' }: FarcasterAuthButtonProps) {
  const { isInMiniApp, signIn, user } = useFarcaster()

  if (!isInMiniApp || user) {
    return null
  }

  const handleSignIn = async () => {
    try {
      const result = await signIn()
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('Farcaster sign in failed:', error)
    }
  }

  return (
    <motion.button
      onClick={handleSignIn}
      className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Cast size={20} />
      Sign In with Farcaster
    </motion.button>
  )
}