'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Shield, User, Wallet, LogOut } from 'lucide-react'

interface PrivyAuthProps {
  onAuthenticated: (userData: {
    id: string
    email?: string
    wallet?: string
    farcaster?: any
    twitter?: any
    google?: any
  }) => void
  onLogout: () => void
}

export default function PrivyAuth({ onAuthenticated, onLogout }: PrivyAuthProps) {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()

  console.log('🔧 Privy state:', { ready, authenticated, user: user?.id })

  // Effect to handle authentication state changes
  React.useEffect(() => {
    console.log('🔄 Privy auth effect:', { authenticated, user: user?.id, wallets: wallets.length })
    if (authenticated && user) {
      const primaryWallet = wallets.find(wallet => wallet.walletClientType === 'privy')
      const userData = {
        id: user.id,
        email: user.email?.address,
        wallet: primaryWallet?.address || user.wallet?.address,
        farcaster: user.farcaster,
        twitter: user.twitter,
        google: user.google,
      }
      console.log('✅ Calling onAuthenticated with:', userData)
      onAuthenticated(userData)
    }
  }, [authenticated, user, wallets, onAuthenticated])

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/20 rounded mb-4"></div>
        <div className="h-4 bg-white/10 rounded mb-4"></div>
        <div className="h-12 bg-white/10 rounded mb-3"></div>
        <div className="h-12 bg-white/10 rounded"></div>
      </div>
    )
  }

  // If authenticated, show user info and logout option
  if (authenticated && user) {
    const primaryWallet = wallets.find(wallet => wallet.walletClientType === 'privy')
    const walletAddress = primaryWallet?.address || user.wallet?.address

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
              <div className="space-y-1">
                {user.email && (
                  <p className="text-green-300 text-xs">{user.email.address}</p>
                )}
                {user.farcaster && (
                  <p className="text-green-300 text-xs">@{user.farcaster.username}</p>
                )}
                {walletAddress && (
                  <p className="text-green-300 text-xs font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                console.log('🚪 PrivyAuth: Starting logout...')
                // Call our custom logout first
                onLogout()
                // Then logout from Privy
                await logout()
                console.log('✅ PrivyAuth: Logout completed')
              } catch (error) {
                console.error('❌ PrivyAuth: Logout error:', error)
                // Force logout even if there's an error
                onLogout()
              }
            }}
            className="flex items-center space-x-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-2 py-1 rounded-lg transition-all duration-300 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-3 h-3" />
            <span className="text-xs">Logout</span>
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Show login options
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={login}
      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
    >
      <Shield className="w-4 h-4" />
      <span>Play</span>
    </motion.button>
  )
}