'use client'

import '@farcaster/auth-kit/styles.css'
import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'

const config = {
  // Simplified config for development
  rpcUrl: 'https://mainnet.optimism.io', // Use Optimism for better Auth Kit compatibility
  domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3002',
  siweUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
  relay: 'https://relay.farcaster.xyz',
  // Add these to reduce errors
  version: '1',
  chainId: 10, // Optimism mainnet
}

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}