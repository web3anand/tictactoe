'use client'

import { motion } from 'framer-motion'
import { Wallet, LogOut, User, ExternalLink } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'

interface WalletConnectProps {
  onWalletConnect: (address: string) => void
  onWalletDisconnect: () => void
}

export default function WalletConnect({ onWalletConnect, onWalletDisconnect }: WalletConnectProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Get the Base Account connector
  const baseAccountConnector = connectors.find(connector => connector.id === 'baseAccount')

  // Handle wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      onWalletConnect(address)
    } else if (!isConnected) {
      onWalletDisconnect()
    }
  }, [isConnected, address, onWalletConnect, onWalletDisconnect])

  const handleConnect = () => {
    if (baseAccountConnector) {
      connect({ connector: baseAccountConnector })
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Base Account Connected</h3>
              <p className="text-green-300 text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDisconnect}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 rounded-lg transition-all duration-300 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Wallet className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Sign in with Base</h3>
      </div>
      
      <p className="text-primary-200 mb-4">
        Connect your Base Account to play TicTacToe Pro and earn points on Base!
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConnect}
        disabled={isPending || !baseAccountConnector}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
      >
        {isPending ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span>Sign in with Base</span>
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </motion.button>

      <div className="mt-4 text-sm text-primary-300">
        <p>🔗 Connect with Base Account for seamless experience</p>
        <p>⚡ Powered by Base network</p>
        <p>🎮 Start playing and earning points!</p>
      </div>
    </motion.div>
  )
}
