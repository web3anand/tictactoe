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
    if (!isInMiniApp) {
      throw new Error('Sign In with Farcaster only available in Mini App')
    }

    try {
      // Generate a secure nonce (in production, get this from your backend)
      const nonce = `nonce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const result = await sdk.actions.signIn({ 
        nonce,
        acceptAuthAddress: true 
      })
      
      console.log('✅ Farcaster sign in successful:', result)
      return result
    } catch (error) {
      console.error('❌ Farcaster sign in failed:', error)
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