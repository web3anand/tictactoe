'use client'

import { useEffect } from 'react'

export default function ErrorSuppression() {
  useEffect(() => {
    // Suppress Coinbase analytics errors that are blocked by ad blockers
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      
      // Filter out Coinbase analytics errors
      if (
        message.includes('cca-lite.coinbase.com') ||
        message.includes('Analytics SDK') ||
        message.includes('ERR_BLOCKED_BY_CLIENT') ||
        (message.includes('Failed to fetch') && message.includes('injected.js')) ||
        message.includes('keys.coinbase.com')
      ) {
        return // Suppress these specific errors
      }
      
      // Log other errors normally
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args[0]?.toString() || ''
      
      // Filter out Coinbase analytics warnings
      if (
        message.includes('cca-lite.coinbase.com') ||
        message.includes('Analytics SDK') ||
        message.includes('keys.coinbase.com')
      ) {
        return // Suppress these specific warnings
      }
      
      // Log other warnings normally
      originalWarn.apply(console, args)
    }

    // Suppress unhandled promise rejections for analytics
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || ''
      
      if (
        reason.includes('cca-lite.coinbase.com') ||
        reason.includes('Analytics SDK') ||
        reason.includes('ERR_BLOCKED_BY_CLIENT') ||
        reason.includes('keys.coinbase.com')
      ) {
        event.preventDefault() // Suppress these specific rejections
      }
    }

    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup function
    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null // This component doesn't render anything
}