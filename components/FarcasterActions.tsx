'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Share2, Plus, Cast } from 'lucide-react'
import { useProfile } from '@farcaster/auth-kit'

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
  const { isAuthenticated, profile } = useProfile()
  
  // For now, we'll disable Farcaster actions since we need Mini App SDK for composeCast
  // This will be re-enabled when we have proper Mini App environment detection
  const isInMiniApp = false

  if (!isInMiniApp || !isAuthenticated) {
    return null // Only show in Farcaster Mini App when authenticated
  }

  const handleShareGame = async () => {
    try {
      // This would use Mini App SDK composeCast in real Mini App environment
      console.log('Share game action (Mini App only)')
    } catch (error) {
      console.error('Failed to share game:', error)
    }
  }

  const handleAddToFarcaster = async () => {
    try {
      // This would use Mini App SDK addMiniApp in real Mini App environment
      console.log('Add to Farcaster action (Mini App only)')
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
  const { isAuthenticated, profile } = useProfile()

  // Auth is now handled by AuthKitProvider, so this button is not needed
  if (isAuthenticated && profile) {
    return null
  }

  return (
    <motion.div
      className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold ${className}`}
    >
      <Cast size={20} />
      <span className="text-sm">Sign in handled by Auth Kit</span>
    </motion.div>
  )
}