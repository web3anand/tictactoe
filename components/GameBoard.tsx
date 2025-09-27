'use client'

import { motion } from 'framer-motion'
import { X, Circle } from 'lucide-react'
import { GameState } from '@/app/page'

interface GameBoardProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  onGameEnd: (winner: string | null, moves: number) => void
  multiplier: number
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
]

export default function GameBoard({ gameState, setGameState, onGameEnd, multiplier }: GameBoardProps) {
  const checkWinner = (board: (string | null)[]) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return

    const newBoard = [...gameState.board]
    newBoard[index] = gameState.currentPlayer

    const newMoves = gameState.moves + 1
    const winner = checkWinner(newBoard)
    const isDraw = newMoves === 9 && !winner

    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      moves: newMoves,
      winner: winner || (isDraw ? 'Draw' : null),
      gameOver: !!winner || isDraw
    }

    setGameState(newGameState)

    if (winner || isDraw) {
      setTimeout(() => onGameEnd(winner, newMoves), 500)
    }
  }

  const getWinningCells = () => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
        return [a, b, c]
      }
    }
    return []
  }

  const winningCells = getWinningCells()

  return (
    <div className="relative">
      {/* Multiplier Badge */}
      {multiplier > 1 && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="multiplier-badge"
        >
          {multiplier}x
        </motion.div>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
        {gameState.board.map((cell, index) => (
          <motion.button
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: gameState.board[index] ? 1 : 1.05 }}
            whileTap={{ scale: gameState.board[index] ? 1 : 0.95 }}
            onClick={() => handleCellClick(index)}
            className={`game-cell ${
              gameState.board[index] === 'X' ? 'x' : 
              gameState.board[index] === 'O' ? 'o' : ''
            } ${winningCells.includes(index) ? 'winning' : ''}`}
            disabled={!!gameState.board[index] || gameState.gameOver}
          >
            {cell === 'X' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <X className="w-8 h-8" />
              </motion.div>
            )}
            {cell === 'O' && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Circle className="w-8 h-8" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Game Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center"
      >
        {gameState.gameOver ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
          >
            {gameState.winner === 'Draw' ? (
              <span className="text-yellow-400">It's a Draw!</span>
            ) : (
              <span className="text-green-400">
                {gameState.winner} Wins! 🎉
              </span>
            )}
          </motion.div>
        ) : (
          <div className="text-xl">
            <span className="text-primary-200">Current Player: </span>
            <span className={`font-bold ${gameState.currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
              {gameState.currentPlayer}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
