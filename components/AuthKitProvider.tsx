'use client'

import '@farcaster/auth-kit/styles.css'
import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'

const config = {
  // For development
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
  domain: process.env.HOSTNAME || 'localhost:3001',
  siweUri: process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3001',
  relay: 'https://relay.farcaster.xyz',
}

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}