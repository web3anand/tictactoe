'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface FarcasterContextType {
  isInMiniApp: boolean
  user: any
  client: any
  location: any
  features: any
  isReady: boolean
  signIn: () => Promise<any>
  composeCast: (options: any) => Promise<any>
  addMiniApp: () => Promise<void>
}

const FarcasterContext = createContext<FarcasterContextType | null>(null)

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isInMiniApp, setIsInMiniApp] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Check if we're in a Mini App environment
        const inMiniApp = await sdk.isInMiniApp()
        setIsInMiniApp(inMiniApp)

        if (inMiniApp) {
          console.log('🎯 Farcaster Mini App detected!')
          
          // Get context information
          const contextData = await sdk.context
          setContext(contextData)
          
          console.log('📍 User context:', contextData.user)
          console.log('📱 Client context:', contextData.client)
          console.log('🚀 Launch context:', contextData.location)
          
          // Handle different launch contexts
          handleLaunchContext(contextData.location)
          
          // Call ready to hide splash screen
          await sdk.actions.ready()
          setIsReady(true)
          
          console.log('✅ Farcaster Mini App initialized')
        } else {
          console.log('🌐 Running as regular web app')
          setIsReady(true)
        }
      } catch (error) {
        console.error('❌ Farcaster initialization error:', error)
        setIsReady(true) // Still set ready to avoid blocking
      }
    }

    initFarcaster()
  }, [])

  const handleLaunchContext = (location: any) => {
    if (!location) return

    switch (location.type) {
      case 'cast_embed':
        console.log('📝 Launched from cast embed:', location.embed)
        // Could extract game ID from embed URL and auto-join game
        break
      case 'cast_share':
        console.log('📤 Launched from shared cast:', location.cast)
        // Handle shared cast context
        break
      case 'notification':
        console.log('🔔 Launched from notification:', location.notification)
        // Handle notification context
        break
      case 'launcher':
        console.log('🏠 Launched from app launcher')
        // Default launch - show main menu
        break
      case 'open_miniapp':
        console.log('🔗 Launched from another Mini App:', location.referrerDomain)
        // Handle referral from another app
        break
      default:
        console.log('❓ Unknown launch context:', location.type)
    }
  }

  const signIn = async () => {
    // Development mode: allow testing without Mini App environment
    const isDevelopment = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost'
    
    if (!isInMiniApp && !isDevelopment) {
      throw new Error('Quick Auth only available in Mini App')
    }

    try {
      if (isInMiniApp) {
        // Production: Use Quick Auth to get a session token
        const { token } = await sdk.quickAuth.getToken()
        
        if (!token) {
          throw new Error('Failed to get authentication token')
        }

        console.log('✅ Quick Auth token obtained')
        
        // Make an authenticated request to get user data
        const response = await sdk.quickAuth.fetch('/api/auth/me')
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`)
        }
        
        const userData = await response.json()
        console.log('✅ Authenticated user data:', userData)
        
        return userData
      } else if (isDevelopment) {
        // Development fallback: allow testing with real user data
        console.log('🔧 Development mode: testing Farcaster authentication')
        
        // Check if there are dev environment variables for real user testing
        const devFid = process.env.NEXT_PUBLIC_DEV_FARCASTER_FID
        const devUsername = process.env.NEXT_PUBLIC_DEV_FARCASTER_USERNAME
        
        if (devFid && devUsername) {
          // Use real Farcaster user data from environment variables
          try {
            // Fetch real user data from Farcaster API
            const userResponse = await fetch(
              `https://api.farcaster.xyz/fc/user-by-fid?fid=${devFid}`
            )
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              const user = userData.result?.user
              
              const realUserData = {
                fid: parseInt(devFid),
                username: user?.username || devUsername,
                displayName: user?.displayName || devUsername,
                pfpUrl: user?.pfp?.url,
                bio: user?.profile?.bio?.text,
                verifications: user?.verifications || [],
                followerCount: user?.followerCount || 0,
                followingCount: user?.followingCount || 0,
                primaryAddress: undefined // Would need separate API call
              }
              
              console.log('✅ Development authentication with real user data:', realUserData)
              return realUserData
            }
          } catch (error) {
            console.warn('Failed to fetch real user data, using mock data:', error)
          }
        }
        
        // Fallback to mock data if no real user credentials provided
        const mockUserData = {
          fid: 12345,
          username: 'dev_user',
          displayName: 'Development User',
          pfpUrl: 'https://i.imgur.com/placeholder.png',
          bio: 'Development test user',
          verifications: [],
          followerCount: 100,
          followingCount: 50,
          primaryAddress: '0x1234567890123456789012345678901234567890'
        }
        
        console.log('✅ Development authentication with mock data:', mockUserData)
        return mockUserData
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      throw error
    }
  }

  const composeCast = async (options: {
    text?: string
    embeds?: [] | [string] | [string, string]
    channelKey?: string
    close?: boolean
  }) => {
    if (!isInMiniApp) {
      throw new Error('Compose cast only available in Mini App')
    }

    try {
      const result = await sdk.actions.composeCast(options)
      console.log('✅ Cast composed:', result)
      return result
    } catch (error) {
      console.error('❌ Cast composition failed:', error)
      throw error
    }
  }

  const addMiniApp = async () => {
    if (!isInMiniApp) {
      throw new Error('Add Mini App only available in Mini App')
    }

    try {
      await sdk.actions.addMiniApp()
      console.log('✅ Mini App added to user\'s collection')
    } catch (error) {
      console.error('❌ Failed to add Mini App:', error)
      throw error
    }
  }

  const value: FarcasterContextType = {
    isInMiniApp,
    user: context?.user,
    client: context?.client,
    location: context?.location,
    features: context?.features,
    isReady,
    signIn,
    composeCast,
    addMiniApp
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider')
  }
  return context
}