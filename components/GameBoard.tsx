'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameState {
  board: (string | null)[]
  currentPlayer: 'X' | 'O'
  gameOver: boolean
  winner: 'X' | 'O' | 'Draw' | null
  moves: number
  multiplier: number
  streak: number
}

interface GameBoardProps {
  gameState: GameState
  onMove: (index: number) => void
  onGameEnd: (winner: 'X' | 'O' | 'Draw', multiplier: number) => void
  disabled?: boolean
}

// Generate all possible winning combinations for 6x6 grid with 4-in-a-row
const generateWinningCombinations = (): number[][] => {
  const combinations: number[][] = []
  
  // Rows (6 rows, 3 possible 4-in-a-row per row)
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col <= 2; col++) {
      const start = row * 6 + col
      combinations.push([start, start + 1, start + 2, start + 3])
    }
  }
  
  // Columns (6 columns, 3 possible 4-in-a-row per column)
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row <= 2; row++) {
      const start = row * 6 + col
      combinations.push([start, start + 6, start + 12, start + 18])
    }
  }
  
  // Diagonals (top-left to bottom-right)
  for (let row = 0; row <= 2; row++) {
    for (let col = 0; col <= 2; col++) {
      const start = row * 6 + col
      combinations.push([start, start + 7, start + 14, start + 21])
    }
  }
  
  // Diagonals (top-right to bottom-left)
  for (let row = 0; row <= 2; row++) {
    for (let col = 3; col < 6; col++) {
      const start = row * 6 + col
      combinations.push([start, start + 5, start + 10, start + 15])
    }
  }
  
  return combinations
}

const WINNING_COMBINATIONS = generateWinningCombinations()

const checkWinner = (board: (string | null)[]): 'X' | 'O' | 'Draw' | null => {
  for (const [a, b, c, d] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c] && board[c] === board[d]) {
      return board[a] as 'X' | 'O'
    }
  }
  
  // Check for draw
  const newMoves = board.filter(cell => cell !== null).length
  if (newMoves === 36) {
    return 'Draw'
  }
  
  return null
}

const getWinningCells = (board: (string | null)[]): number[] => {
  for (const [a, b, c, d] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c] && board[c] === board[d]) {
      return [a, b, c, d]
    }
  }
  return []
}

export default function GameBoard({ gameState, onMove, onGameEnd, disabled = false }: GameBoardProps) {
  const [winningCells, setWinningCells] = useState<number[]>([])

  useEffect(() => {
    const winner = checkWinner(gameState.board)
    const cells = getWinningCells(gameState.board)
    setWinningCells(cells)
    
    if (winner && !gameState.gameOver) {
      onGameEnd(winner, gameState.multiplier)
    }
  }, [gameState.board, gameState.gameOver, gameState.multiplier, onGameEnd])

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver || disabled) return
    onMove(index)
  }

  return (
    <div className="relative">
      {/* Multiplier Badge */}
      {gameState.multiplier > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce z-10"
        >
          {gameState.multiplier}x
        </motion.div>
      )}

      {/* Game Board - 6x6 */}
      <div className="flex justify-center p-3 bg-black/20 rounded-xl shadow-lg"
          style={{
            background: 'radial-gradient(circle, rgba(25, 30, 50, 0.8) 0%, rgba(15, 20, 40, 0.9) 100%)',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
          }}
        >
        <div 
          className="grid mx-auto"
          style={{
            gridTemplateColumns: 'repeat(6, 60px)',
            gridTemplateRows: 'repeat(6, 60px)',
            gap: '6px',
            width: '380px'
          }}
        >
          {gameState.board.map((cell, index) => (
            <motion.button
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: gameState.board[index] ? 1 : 1.05, zIndex: 1 }}
              whileTap={{ scale: gameState.board[index] ? 1 : 0.95 }}
              onClick={() => handleCellClick(index)}
              className={`relative bg-blue-900/50 rounded-lg flex items-center justify-center text-2xl font-semibold transition-all duration-200 shadow-inner-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                winningCells.includes(index) ? 'animate-pulse bg-yellow-500/30' : ''
              }`}
              style={{
                width: '60px',
                height: '60px',
                transformStyle: 'preserve-3d',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                background: 'linear-gradient(145deg, #1f2937, #111827)',
              }}
              disabled={!!gameState.board[index] || gameState.gameOver || disabled}
            >
              <div 
                className="absolute inset-0 rounded-lg opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)'
                }}
              />
              
              {cell === 'X' && (
                <motion.div
                  initial={{ rotateY: 180, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260,
                    damping: 20
                  }}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="w-8 h-8 rounded-md shadow-lg"
                    style={{
                      background: 'linear-gradient(45deg, #22d3ee, #06b6d4)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </motion.div>
              )}
              {cell === 'O' && (
                <motion.div
                  initial={{ rotateY: -180, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260,
                    damping: 20
                  }}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="w-8 h-8 rounded-full shadow-lg"
                    style={{
                      background: 'linear-gradient(45deg, #ec4899, #d946ef)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Status */}
      <AnimatePresence>
        {gameState.gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 text-center"
          >
            <div className="text-lg font-bold">
              {gameState.winner === 'Draw' ? (
                <span className="text-yellow-400">It's a Draw!</span>
              ) : (
                <span className={gameState.winner === 'X' ? 'text-blue-400' : 'text-red-400'}>
                  {gameState.winner} Wins!
                </span>
              )}
            </div>
            {gameState.multiplier > 1 && (
              <div className="text-sm text-gray-300 mt-1">
                Multiplier: {gameState.multiplier}x
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}