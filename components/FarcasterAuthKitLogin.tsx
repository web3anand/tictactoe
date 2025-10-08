'use client'

import { useSignIn, useProfile, SignInButton } from '@farcaster/auth-kit'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, User, Cast, Loader2 } from 'lucide-react'

interface FarcasterAuthKitLoginProps {
  onSuccess: (userData: any) => void
  onError?: (error: string) => void
}

export default function FarcasterAuthKitLogin({ onSuccess, onError }: FarcasterAuthKitLoginProps) {
  const [hasCallbackFired, setHasCallbackFired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useBuiltInButton, setUseBuiltInButton] = useState(false)
  
  const {
    signIn,
    signOut,
    isSuccess,
    isError,
    error,
    data: signInData
  } = useSignIn({
    onSuccess: () => {
      setIsLoading(false)
    },
    onError: (error) => {
      onError?.(error?.message || 'Authentication failed')
      setIsLoading(false)
    }
  })

  const {
    isAuthenticated,
    profile
  } = useProfile()

  // Handle successful authentication
  useEffect(() => {
    if (isSuccess && isAuthenticated && profile && profile.fid && signInData && !hasCallbackFired) {
      // Format the profile data for our app
      const userData = {
        fid: profile.fid,
        username: profile.username,
        displayName: profile.displayName,
        pfpUrl: profile.pfpUrl,
        bio: profile.bio,
        custody: signInData.custody,
        verifications: profile.verifications || [],
        message: signInData.message,
        signature: signInData.signature,
        nonce: signInData.nonce
      }

      // Only proceed if we have proper authentication data
      if (userData.fid && (userData.username || userData.displayName)) {
        console.log('✅ Farcaster authentication successful:', userData);
        setHasCallbackFired(true)
        onSuccess(userData)
      } else {
        console.log('❌ Incomplete Farcaster data, not proceeding with login');
      }
    }
  }, [isSuccess, isAuthenticated, profile, signInData, onSuccess, hasCallbackFired])

  const handleSignOut = () => {
    signOut()
    setHasCallbackFired(false)
  }

  const handleSignIn = async () => {
    setIsLoading(true)
    console.log('🔗 Starting Farcaster sign-in...')
    
    try {
      await signIn()
      console.log('📱 Farcaster sign-in initiated')
    } catch (err) {
      console.error('❌ Sign-in error:', err)
      setIsLoading(false)
      onError?.('Failed to start authentication')
    }
    
    // Add timeout protection
    setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Sign-in timeout, resetting loading state')
        setIsLoading(false)
      }
    }, 30000) // 30 second timeout
  }

  // If user is already authenticated, show profile
  if (isAuthenticated && profile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
            {profile.pfpUrl ? (
              <img 
                src={profile.pfpUrl} 
                alt={profile.displayName || profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">
              {profile.displayName || profile.username}
            </p>
            <p className="text-gray-400 text-sm">FID: {profile.fid}</p>
            {profile.bio && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{profile.bio}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {!useBuiltInButton ? (
        <>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Cast className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Connecting...' : 'Farcaster'}</span>
          </motion.button>
          
          {isLoading && (
            <div className="text-center">
              <button
                onClick={() => {
                  setIsLoading(false)
                  setUseBuiltInButton(true)
                }}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                Try built-in button if stuck
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <SignInButton 
            onSuccess={({ fid, username, bio, displayName, pfpUrl, custody, verifications }) => {
              console.log('✅ Built-in SignInButton Success')
              onSuccess({
                fid,
                username,
                displayName,
                pfpUrl,
                bio,
                custody,
                verifications
              })
            }}
            onError={(error) => {
              console.error('❌ Built-in SignInButton Error:', error)
              onError?.(error?.message || 'Authentication failed')
            }}
          />
          <div className="text-center">
            <button
              onClick={() => setUseBuiltInButton(false)}
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              ← Back to custom button
            </button>
          </div>
        </div>
      )}

      {isError && error && (
        <div className="text-center">
          <p className="text-sm text-red-400">
            Authentication failed
          </p>
        </div>
      )}
    </div>
  )
}