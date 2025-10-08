'use client'

import { motion } from 'framer-motion'
import { Wallet, Shield } from 'lucide-react'
import { useConnect } from 'wagmi'

interface SimpleWalletConnectProps {
  onGuestLogin?: (name: string) => void
}

export default function SimpleWalletConnect({ onGuestLogin }: SimpleWalletConnectProps) {
  const { connect, connectors, isPending } = useConnect()

  const baseAccountConnector = connectors.find(connector => connector.id === 'baseAccount')
  const injectedConnector = connectors.find(connector => connector.id === 'injected')

  return (
    <div className="space-y-3">
      {baseAccountConnector && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => connect({ connector: baseAccountConnector })}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
        >
          <Shield className="w-5 h-5" />
          <span>Base Account</span>
        </motion.button>
      )}

      {injectedConnector && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => connect({ connector: injectedConnector })}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
        >
          <Wallet className="w-5 h-5" />
          <span>MetaMask & Others</span>
        </motion.button>
      )}
    </div>
  )
}