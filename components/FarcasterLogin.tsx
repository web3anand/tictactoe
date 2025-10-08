'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cast, Check, Loader2 } from 'lucide-react'
import { useFarcaster } from './FarcasterProvider'

interface FarcasterLoginProps {
  onSuccess: (userData: any) => void
  onError?: (error: string) => void
}

export default function FarcasterLogin({ onSuccess, onError }: FarcasterLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { isInMiniApp, user: farcasterUser, signIn, isReady } = useFarcaster()
  
  const isDevelopment = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'

  const handleFarcasterAuth = async () => {
    const isDevelopment = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost'
    
    if (!isInMiniApp && !isDevelopment) {
      // If not in Mini App and not in development, redirect to Farcaster
      window.open('https://warpcast.com/~/developer', '_blank')
      onError?.('Please open this app in Farcaster to authenticate')
      return
    }

    if (!isReady && !isDevelopment) {
      onError?.('Farcaster SDK is not ready yet')
      return
    }

    setIsLoading(true)
    
    try {
      // Use the SDK's signIn method (with development fallback)
      const authResult = await signIn()
      
      if (authResult) {
        console.log('🎯 Farcaster authentication successful:', authResult)
        
        // Format the auth result for our app
        const userData = {
          fid: authResult.fid,
          username: authResult.username,
          displayName: authResult.displayName,
          pfpUrl: authResult.pfpUrl,
          bio: authResult.bio,
          custody: authResult.custody,
          verifications: authResult.verifications || [],
          primaryAddress: authResult.primaryAddress,
          // Keep these for backward compatibility if they exist
          message: authResult.message,
          signature: authResult.signature,
          nonce: authResult.nonce
        }
        
        onSuccess(userData)
      } else {
        throw new Error('Authentication failed - no result returned')
      }
    } catch (error) {
      console.error('❌ Farcaster authentication failed:', error)
      onError?.(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  // If user is already authenticated via Farcaster context
  if (farcasterUser) {
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
            Connected as {farcasterUser.displayName || farcasterUser.username || 'Farcaster User'}
          </p>
          <p className="text-gray-400 text-sm">FID: {farcasterUser.fid}</p>
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
        onClick={handleFarcasterAuth}
        disabled={isLoading || (!isReady && !isDevelopment)}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Cast className="w-5 h-5" />
        )}
        <span>
          {isLoading
            ? 'Authenticating...'
            : isInMiniApp
            ? 'Sign in with Farcaster'
            : isDevelopment 
            ? 'Test Farcaster Auth (Dev)'
            : 'Open in Farcaster'
          }
        </span>
      </motion.button>

      {!isReady && !isDevelopment && (
        <div className="text-center">
          <p className="text-sm text-yellow-400">
            Initializing Farcaster SDK...
          </p>
        </div>
      )}

      {isDevelopment && (
        <div className="text-center">
          <p className="text-xs text-yellow-500">
            🔧 Development Mode: {process.env.NEXT_PUBLIC_DEV_FARCASTER_FID ? 'Using your real Farcaster account' : 'Using mock test data'}
          </p>
          {!process.env.NEXT_PUBLIC_DEV_FARCASTER_FID && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Add NEXT_PUBLIC_DEV_FARCASTER_FID to .env.local to test with your real account
            </p>
          )}
        </div>
      )}

      {!isInMiniApp && !isDevelopment && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🚀 For authentication, please open this app in Farcaster
          </p>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔐 Secure authentication via Farcaster SDK
        </p>
      </div>
    </div>
  )
}