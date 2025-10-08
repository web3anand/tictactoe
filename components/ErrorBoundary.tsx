'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if this is a Coinbase analytics error that we want to ignore
    const errorMessage = error.message || error.toString()
    
    if (
      errorMessage.includes('cca-lite.coinbase.com') ||
      errorMessage.includes('Analytics SDK') ||
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('keys.coinbase.com')
    ) {
      // Don't treat these as errors, just ignore them
      return { hasError: false }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log real errors (not Coinbase analytics errors)
    const errorMessage = error.message || error.toString()
    
    if (
      !errorMessage.includes('cca-lite.coinbase.com') &&
      !errorMessage.includes('Analytics SDK') &&
      !errorMessage.includes('ERR_BLOCKED_BY_CLIENT') &&
      !errorMessage.includes('keys.coinbase.com')
    ) {
      console.error('React Error Boundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary