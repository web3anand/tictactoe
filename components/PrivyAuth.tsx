'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'
import { Shield, User, LogOut } from 'lucide-react'

interface PrivyAuthProps {
  onAuthenticated: (userData: any) => void
  onLogout: () => void
}

export default function PrivyAuth({ onAuthenticated, onLogout }: PrivyAuthProps) {
  const { ready, authenticated, user, login, logout } = usePrivy()

  React.useEffect(() => {
    if (authenticated && user) {
      onAuthenticated({
        id: user.id,
        email: user.email?.address,
        farcaster: user.farcaster,
        twitter: user.twitter,
        name: user.farcaster?.displayName || user.twitter?.name || 'Player'
      })
    }
  }, [authenticated, user, onAuthenticated])

  const handleLogout = async () => {
    try {
      onLogout()
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      onLogout()
    }
  }

  if (!ready) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/20 rounded mb-4"></div>
        <div className="h-12 bg-white/10 rounded"></div>
      </div>
    )
  }

  if (authenticated && user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connected</h3>
              {user.email && <p className="text-green-300 text-xs">{user.email.address}</p>}
              {user.farcaster && <p className="text-green-300 text-xs">@{user.farcaster.username}</p>}
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-2 py-1 rounded-lg transition-all duration-300 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-3 h-3" />
            <span className="text-xs">Logout</span>
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex justify-center">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={login}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 w-48"
      >
        <Shield className="w-4 h-4" />
        <span>Play</span>
      </motion.button>
    </div>
  )
}