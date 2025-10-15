'use client'

import React from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface PrivyAuthProps {
  onAuthenticated: (userData: any) => void
  onLogout: () => void
}

export default function PrivyAuth({ onAuthenticated, onLogout }: PrivyAuthProps) {
  const { ready, authenticated, user, login, logout, linkWallet } = usePrivy()

  React.useEffect(() => {
    if (authenticated && user) {
      // Get the wallet address from the user's linked accounts
      const walletAccount = user.linkedAccounts?.find((account: any) => account.type === 'wallet') as any
      const walletAddress = user.wallet?.address || walletAccount?.address
      
      onAuthenticated({
        id: user.id,
        email: user.email?.address,
        farcaster: user.farcaster,
        twitter: user.twitter,
        walletAddress: walletAddress,
        name: user.farcaster?.displayName || user.twitter?.name || 'Player'
      })
    }
  }, [authenticated, user, user?.wallet?.address, user?.linkedAccounts, onAuthenticated])

  const handleLogout = async () => {
    try {
      console.log('🚪 PrivyAuth logout starting...')
      await logout()
      console.log('✅ PrivyAuth logout completed')
      onLogout()
    } catch (error) {
      console.error('❌ Privy logout error:', error)
      onLogout()
    }
  }

  if (!ready) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="h-4 bg-gray-700 rounded mb-3 animate-pulse"></div>
        <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
      </div>
    )
  }

  if (authenticated && user) {
    const walletAccount = user.linkedAccounts?.find((account: any) => account.type === 'wallet') as any
    const walletAddress = user.wallet?.address || walletAccount?.address
    
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${walletAddress ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
              <span className="text-white text-sm font-medium">{walletAddress ? '✓' : '!'}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {walletAddress ? 'Connected' : 'Wallet Required'}
              </p>
              {user.email && <p className="text-xs text-gray-400">{user.email.address}</p>}
              {user.farcaster && <p className="text-xs text-gray-400">@{user.farcaster.username}</p>}
              {user.twitter && <p className="text-xs text-gray-400">@{user.twitter.username}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!walletAddress && (
              <button
                onClick={linkWallet}
                className="px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
              >
                Connect Wallet
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={login}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
      >
        Connect & Play
      </button>
    </div>
  )
}