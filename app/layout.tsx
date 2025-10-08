import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import PrivyWrapper from '@/components/PrivyWrapper'
import ErrorSuppression from '@/components/ErrorSuppression'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Basetok - Strategic Tic Tac Toe Game',
  description: 'Play Tic Tac Toe with multiplier mechanics, earn points, and climb the leaderboard. Connect your wallet and Farcaster to compete!',
  manifest: '/manifest.json',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:manifest': '/.well-known/farcaster.json',
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://basetok.fun/og-image.svg",
      button: {
        title: "🎮 Play Basetok",
        action: {
          type: "launch_miniapp",
          name: "Basetok",
          url: "https://basetok.fun",
          splashImageUrl: "https://basetok.fun/splash.svg",
          splashBackgroundColor: "#000000"
        }
      }
    })
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Removed Farcaster preconnect - will add Privy links when ready */}
      </head>
      <body className={`${inter.className} overflow-x-hidden dark`}>
        <ErrorSuppression />
        <ErrorBoundary>
          <PrivyWrapper>
            <WalletProvider>
              <div className="min-h-screen">
                {children}
              </div>
            </WalletProvider>
          </PrivyWrapper>
        </ErrorBoundary>
      </body>
    </html>
  )
}
