import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import WalletProvider from '@/components/WalletProvider'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TicTacToe Pro - Strategic XO with Multipliers',
  description: 'Play Tic Tac Toe with multiplier mechanics, earn points, and climb the leaderboard. Connect your X profile to get your ethos score!',
  manifest: '/.well-known/farcaster.json',
  other: {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://tictactoe-three-eta.vercel.app/og-image.svg",
      button: {
        title: "🎮 Play Now",
        action: {
          type: "launch_miniapp",
          name: "TicTacToe Pro",
          url: "https://tictactoe-three-eta.vercel.app",
          splashImageUrl: "https://tictactoe-three-eta.vercel.app/splash.svg",
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
      <body className={`${inter.className} overflow-x-hidden dark`}>
        <AuthProvider>
          <FarcasterProvider>
            <WalletProvider>
              <div className="min-h-screen">
                {children}
              </div>
            </WalletProvider>
          </FarcasterProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
