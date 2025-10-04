'use client'

import { motion } from 'framer-motion'
import { Wallet, Shield, User, Plus } from 'lucide-react'
import { useConnect } from 'wagmi'
import { useState } from 'react'

interface SimpleWalletConnectProps {
  onGuestLogin?: (name: string) => void
}

export default function SimpleWalletConnect({ onGuestLogin }: SimpleWalletConnectProps) {
  const { connect, connectors, isPending } = useConnect()
  const [showNewPlayer, setShowNewPlayer] = useState(false)

  const baseAccountConnector = connectors.find(connector => connector.id === 'baseAccount')
  const injectedConnector = connectors.find(connector => connector.id === 'injected')

  const handleGuestLogin = () => {
    const randomNames = [
      'Player_Alpha', 'Player_Beta', 'Player_Gamma', 'Player_Delta', 
      'Player_Echo', 'Player_Foxtrot', 'Player_Golf', 'Player_Hotel'
    ]
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]
    onGuestLogin?.(randomName)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Get Started</h3>
      </div>
      
      <p className="text-primary-200 text-sm mb-4">
        Connect your wallet to earn points on Base, or play as guest!
      </p>

      <div className="space-y-3">
        {/* Guest Play Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGuestLogin}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Play as Guest</span>
        </motion.button>

        <div className="text-center text-sm text-primary-300 my-2">or</div>

        {baseAccountConnector && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => connect({ connector: baseAccountConnector })}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Sign in with Base</span>
          </motion.button>
        )}

        {injectedConnector && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => connect({ connector: injectedConnector })}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Wallet className="w-4 h-4" />
            <span>MetaMask & Other Wallets</span>
          </motion.button>
        )}
      </div>

      <div className="mt-4 text-sm text-primary-300">
        <p>🎮 Guest: Your progress is saved locally</p>
        <p>🔗 Wallet: Earn real points on Base network</p>
        <p>⚡ Choose your adventure!</p>
      </div>
    </motion.div>
  )
}