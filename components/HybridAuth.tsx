'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  Shield, 
  User as UserIcon, 
  Mail,
  Twitter,
  Cast,
  Chrome,
  ChevronRight,
  ArrowLeft,
  Zap
} from 'lucide-react'
import { useConnect } from 'wagmi'
// Temporarily disable Privy import due to React context issues
// import { usePrivy } from '@privy-io/react-auth'
import { useFarcaster } from './FarcasterProvider'
import SimpleWalletConnect from './SimpleWalletConnect'

interface HybridAuthProps {
  onGuestLogin?: (name: string) => void
  onAuthSuccess?: (user: any) => void
}

type AuthMethod = 'overview' | 'quick' | 'base' | 'social' | 'farcaster'

export default function HybridAuth({ onGuestLogin, onAuthSuccess }: HybridAuthProps) {
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('overview')
  const [isLoading, setIsLoading] = useState(false)
  
  const { connect, connectors, isPending } = useConnect()
  // Temporarily mock Privy hooks due to compatibility issues
  const login = async () => {
    console.log('Privy login temporarily disabled')
    // Show user that social login will be available soon
    alert('Social login coming soon! Use Base Account or Guest mode for now.')
  }
  const logout = async () => console.log('Logout')
  const ready = true
  const authenticated = false
  const user = null
  
  // TODO: Re-enable when Privy compatibility is resolved
  // const { login, logout, ready, authenticated, user } = usePrivy()
  
  const { isInMiniApp, signIn: farcasterSignIn, user: farcasterUser } = useFarcaster()

  const baseAccountConnector = connectors.find(connector => connector.id === 'baseAccount')
  const injectedConnector = connectors.find(connector => connector.id === 'injected')

  const handleGuestLogin = () => {
    const guestNames = [
      'CyberNinja', 'PixelWarrior', 'GameMaster', 'TacToeAce', 'StrategyKing',
      'BoardLegend', 'XOChampion', 'TacticalPro', 'GridMaster', 'PlayMaster'
    ]
    const randomName = guestNames[Math.floor(Math.random() * guestNames.length)]
    onGuestLogin?.(randomName)
  }

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      await login()
      if (user && onAuthSuccess) {
        onAuthSuccess(user)
      }
    } catch (error) {
      console.error(`${provider} login failed:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFarcasterLogin = async () => {
    if (!isInMiniApp) return
    
    setIsLoading(true)
    try {
      const result = await farcasterSignIn()
      console.log('Farcaster login result:', result)
      onAuthSuccess?.(result)
    } catch (error) {
      console.error('Farcaster login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const AuthOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Login Method</h2>
        <p className="text-gray-300">Multiple secure ways to join the game</p>
      </div>
      
      {/* Quick Start */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedMethod('quick')}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6" />
          <div className="text-left">
            <div className="font-semibold">Quick Start</div>
            <div className="text-sm opacity-90">Guest mode - Play instantly</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Base App */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedMethod('base')}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6" />
          <div className="text-left">
            <div className="font-semibold">Base Account & Wallets</div>
            <div className="text-sm opacity-90">Crypto wallets, earn real points</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Social Login */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedMethod('social')}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          <Chrome className="w-6 h-6" />
          <div className="text-left">
            <div className="font-semibold">Social Media</div>
            <div className="text-sm opacity-90">Google, Twitter, Email</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Farcaster (only show if in Mini App) */}
      {isInMiniApp && !farcasterUser && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMethod('farcaster')}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <Cast className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Farcaster Native</div>
              <div className="text-sm opacity-90">Mini App integration</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      )}

      <div className="text-center text-sm text-gray-400 mt-6">
        🔒 All methods are secure and private
      </div>
    </motion.div>
  )

  const QuickStartView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 mb-6">
        <button 
          onClick={() => setSelectedMethod('overview')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h3 className="text-xl font-semibold text-white">Quick Start</h3>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGuestLogin}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
      >
        <UserIcon className="w-5 h-5" />
        <span>Play as Guest</span>
      </motion.button>

      <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
        <h4 className="font-semibold text-white mb-2">🎮 Guest Mode Benefits:</h4>
        <ul className="space-y-1">
          <li>• Start playing immediately</li>
          <li>• No account setup required</li>
          <li>• Progress saved locally</li>
          <li>• Perfect for quick matches</li>
        </ul>
      </div>
    </motion.div>
  )

  const BaseView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 mb-6">
        <button 
          onClick={() => setSelectedMethod('overview')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h3 className="text-xl font-semibold text-white">Base Account & Wallets</h3>
      </div>

      {/* Use existing SimpleWalletConnect component */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4">
        <SimpleWalletConnect onGuestLogin={onGuestLogin} />
      </div>

      <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
        <h4 className="font-semibold text-white mb-2">🔗 Base Benefits:</h4>
        <ul className="space-y-1">
          <li>• Earn real points on Base network</li>
          <li>• Secure blockchain authentication</li>
          <li>• Cross-device profile sync</li>
          <li>• NFT achievements</li>
        </ul>
      </div>
    </motion.div>
  )

  const SocialView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 mb-6">
        <button 
          onClick={() => setSelectedMethod('overview')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h3 className="text-xl font-semibold text-white">Social Login</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Chrome className="w-4 h-4" />
          <span>Continue with Google</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSocialLogin('twitter')}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Twitter className="w-4 h-4" />
          <span>Continue with Twitter</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSocialLogin('email')}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Mail className="w-4 h-4" />
          <span>Continue with Email</span>
        </motion.button>
      </div>

      <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
        <h4 className="font-semibold text-white mb-2">📱 Social Benefits:</h4>
        <ul className="space-y-1">
          <li>• One-click authentication</li>
          <li>• Profile picture & username</li>
          <li>• Share achievements easily</li>
          <li>• Cross-platform compatibility</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">
          Powered by Privy for secure social authentication
        </p>
      </div>
    </motion.div>
  )

  const FarcasterView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 mb-6">
        <button 
          onClick={() => setSelectedMethod('overview')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h3 className="text-xl font-semibold text-white">Farcaster Native</h3>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleFarcasterLogin}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
      >
        <Cast className="w-5 h-5" />
        <span>Sign in with Farcaster</span>
      </motion.button>

      <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
        <h4 className="font-semibold text-white mb-2">🚀 Farcaster Benefits:</h4>
        <ul className="space-y-1">
          <li>• Native Mini App experience</li>
          <li>• Share games to your feed</li>
          <li>• Connect with Farcaster friends</li>
          <li>• Frame-based interactions</li>
        </ul>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-400/30 rounded-2xl p-6 backdrop-blur-sm relative"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">TicTacToe Pro Authentication</h2>
      </div>
      
      <AnimatePresence mode="wait">
        {selectedMethod === 'overview' && (
          <motion.div key="overview" exit={{ opacity: 0, x: -20 }}>
            <AuthOverview />
          </motion.div>
        )}
        {selectedMethod === 'quick' && (
          <motion.div key="quick" exit={{ opacity: 0, x: -20 }}>
            <QuickStartView />
          </motion.div>
        )}
        {selectedMethod === 'base' && (
          <motion.div key="base" exit={{ opacity: 0, x: -20 }}>
            <BaseView />
          </motion.div>
        )}
        {selectedMethod === 'social' && (
          <motion.div key="social" exit={{ opacity: 0, x: -20 }}>
            <SocialView />
          </motion.div>
        )}
        {selectedMethod === 'farcaster' && (
          <motion.div key="farcaster" exit={{ opacity: 0, x: -20 }}>
            <FarcasterView />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl backdrop-blur-sm"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-white font-medium">Connecting...</p>
            <p className="text-gray-300 text-sm">Setting up your authentication</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}