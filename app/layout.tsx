import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TicTacToe Pro - Strategic XO with Multipliers',
  description: 'Play Tic Tac Toe with multiplier mechanics, earn points, and climb the leaderboard. Connect your X profile to get your ethos score!',
  manifest: '/.well-known/farcaster.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
          {children}
        </div>
      </body>
    </html>
  )
}
