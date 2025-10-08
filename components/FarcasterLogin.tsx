'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cast, Check, Loader2 } from 'lucide-react'

interface FarcasterLoginProps {
  onSuccess: (userData: any) => void
  onError?: (error: string) => void
}

interface AuthData {
  message: string
  signature: string
  nonce: string
  domain: string
  custody?: string
  verifications?: string[]
  fid?: number
  username?: string
  displayName?: string
  pfpUrl?: string
  bio?: string
}

export default function FarcasterLogin({ onSuccess, onError }: FarcasterLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)

  // Generate auth URL when component mounts
  useEffect(() => {
    generateAuthUrl()
  }, [])

  const generateAuthUrl = async () => {
    try {
      const response = await fetch('/api/auth/farcaster/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      if (data.success && data.authUrl) {
        setAuthUrl(data.authUrl)
      }
    } catch (error) {
      console.error('Failed to generate auth URL:', error)
      onError?.('Failed to initialize Farcaster authentication')
    }
  }

  const handleLogin = async () => {
    if (!authUrl) {
      onError?.('Authentication URL not ready')
      return
    }

    setIsLoading(true)
    
    try {
      // Open Farcaster auth in new window
      const authWindow = window.open(
        authUrl,
        'farcaster-auth',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      )

      if (!authWindow) {
        throw new Error('Failed to open authentication window')
      }

      // Start polling for auth completion
      setIsPolling(true)
      await pollForAuth()
      
    } catch (error) {
      console.error('Farcaster login failed:', error)
      onError?.(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
      setIsPolling(false)
    }
  }

  const pollForAuth = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/auth/farcaster/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          
          const data = await response.json()
          
          if (data.success && data.userData) {
            clearInterval(interval)
            setAuthData(data.userData)
            onSuccess(data.userData)
            resolve()
          } else if (data.error) {
            clearInterval(interval)
            reject(new Error(data.error))
          }
          // Continue polling if not complete yet
        } catch (error) {
          clearInterval(interval)
          reject(error)
        }
      }, 2000) // Poll every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(interval)
        reject(new Error('Authentication timeout'))
      }, 300000)
    })
  }

  const handleDirectAuth = async () => {
    setIsLoading(true)
    
    try {
      // For users already in Farcaster context
      const response = await fetch('/api/auth/farcaster/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (data.success && data.userData) {
        setAuthData(data.userData)
        onSuccess(data.userData)
      } else {
        throw new Error(data.error || 'Direct authentication failed')
      }
    } catch (error) {
      console.error('Direct Farcaster auth failed:', error)
      // Fallback to regular auth flow
      handleLogin()
      return
    } finally {
      setIsLoading(false)
    }
  }

  // Check if we're in Farcaster context
  const isInFarcaster = typeof window !== 'undefined' && 
    (window.location.href.includes('warpcast.com') || 
     window.navigator.userAgent.includes('Farcaster'))

  if (authData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20 rounded-xl p-4 flex items-center space-x-3"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">
            Connected as {authData.displayName || authData.username || 'Farcaster User'}
          </p>
          <p className="text-gray-400 text-sm">FID: {authData.fid}</p>
        </div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={isInFarcaster ? handleDirectAuth : handleLogin}
        disabled={isLoading || !authUrl}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Cast className="w-5 h-5" />
        )}
        <span>
          {isLoading
            ? isPolling
              ? 'Waiting for authentication...'
              : 'Connecting to Farcaster...'
            : isInFarcaster
            ? 'Sign in with Farcaster'
            : 'Login with Farcaster'
          }
        </span>
      </motion.button>

      {!authUrl && !isLoading && (
        <div className="text-center">
          <button
            onClick={generateAuthUrl}
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Retry authentication setup
          </button>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔐 Secure authentication via Farcaster
        </p>
      </div>
    </div>
  )
}