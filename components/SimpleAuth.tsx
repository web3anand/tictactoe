'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, User, Mail, Wallet, LogOut } from 'lucide-react'

interface SimpleAuthProps {
  onAuthenticated: (userData: {
    id: string
    email?: string
    wallet?: string
    name: string
  }) => void
  onLogout: () => void
}

export default function SimpleAuth({ onAuthenticated, onLogout }: SimpleAuthProps) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [userData, setUserData] = React.useState<any>(null)

  const handleEmailLogin = () => {
    if (!email) return
    
    const mockUser = {
      id: Math.random().toString(36).substring(2, 15),
      email,
      name: email.split('@')[0],
    }
    
    setUserData(mockUser)
    setIsLoggedIn(true)
    onAuthenticated(mockUser)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    setEmail('')
    onLogout()
  }

  if (isLoggedIn && userData) {
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
              <p className="text-green-300 text-xs">{userData.email}</p>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Simple Authentication</h3>
      </div>
      
      <p className="text-primary-200 text-sm mb-4">
        Enter your email to create an account and start playing
      </p>

      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEmailLogin()
              }
            }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmailLogin}
            disabled={!email}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Mail className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="mt-4 text-sm text-primary-300">
        <p>📧 Simple email authentication</p>
        <p>🎮 Start playing immediately</p>
        <p>⚡ No complex setup required</p>
      </div>
    </motion.div>
  )
}