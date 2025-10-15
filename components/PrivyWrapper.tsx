'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { privyConfig } from '@/config/privy'
import { base } from 'wagmi/chains'

interface PrivyWrapperProps {
  children: React.ReactNode
}

export default function PrivyWrapper({ children }: PrivyWrapperProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  console.log('🔧 Privy App ID:', appId)

  if (!appId) {
    console.error('❌ NEXT_PUBLIC_PRIVY_APP_ID is not set')
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          <h3 className="font-bold">Privy Configuration Error</h3>
          <p>NEXT_PUBLIC_PRIVY_APP_ID environment variable is not set.</p>
          <p className="text-sm mt-2">Please check your .env.local file.</p>
        </div>
      </div>
    )
  }

  return (
    <PrivyProvider 
      appId={appId}
      config={privyConfig}
    >
      {children}
    </PrivyProvider>
  )
}