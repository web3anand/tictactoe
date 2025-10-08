'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cast, Loader2 } from 'lucide-react'

interface SimpleFarcasterAuthProps {
  onSuccess: (userData: any) => void
  onError?: (error: string) => void
}

export default function SimpleFarcasterAuth({ onSuccess, onError }: SimpleFarcasterAuthProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSimpleAuth = async () => {
    setIsLoading(true)
    
    // Simple guest login with Farcaster-style name for now
    // This bypasses all the Auth Kit complexity
    setTimeout(() => {
      const userData = {
        fid: Math.floor(Math.random() * 100000),
        username: `fc_player_${Math.floor(Math.random() * 1000)}`,
        displayName: `Farcaster Player ${Math.floor(Math.random() * 1000)}`,
        pfpUrl: null,
        bio: 'Farcaster User',
        verifications: []
      }
      
      console.log('✅ Simple Farcaster auth success:', userData)
      setIsLoading(false)
      onSuccess(userData)
    }, 1000)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSimpleAuth}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Cast className="w-5 h-5" />
      )}
      <span>{isLoading ? 'Connecting...' : 'Farcaster'}</span>
    </motion.button>
  )
}