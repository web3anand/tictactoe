'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useGameSocket, UseGameSocketReturn } from '@/hooks/useGameSocket'

const GameSocketContext = createContext<UseGameSocketReturn | null>(null)

export function GameSocketProvider({ children }: { children: ReactNode }) {
  const gameSocket = useGameSocket()

  return (
    <GameSocketContext.Provider value={gameSocket}>
      {children}
    </GameSocketContext.Provider>
  )
}

export function useGameSocketContext(): UseGameSocketReturn {
  const context = useContext(GameSocketContext)
  if (!context) {
    throw new Error('useGameSocketContext must be used within a GameSocketProvider')
  }
  return context
}