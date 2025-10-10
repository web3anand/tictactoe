'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, User, LogOut } from 'lucide-react'
import Image from 'next/image'

// New pixel art avatar generation system - BLACK & WHITE ONLY
const generatePixelArtAvatar = (seed: string, size: number = 64): string => {
  // Remove timestamp for consistent avatars, use only black and white, zoomed out a bit
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=000000&primaryColor=ffffff&size=${size}&radius=0&scale=100&randomizeIds=false`
}

const getProfilePicture = (player: Player): string => {
  if (player.farcasterProfile?.avatar) {
    return player.farcasterProfile.avatar;
  }
  // Use new pixel art generation system - black & white with minimal blue
  const seed = player.walletAddress || player.name || player.id
  return generatePixelArtAvatar(seed, 48);
}

interface Player {
  id: string
  name: string
  points: number
  gamesPlayed: number
  gamesWon: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'human'
  walletAddress?: string
  farcasterProfile?: {
    fid: number;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
  };
}

interface SettingsModalProps {
  onClose: () => void
  player: Player | null
  onPlayerUpdate?: (updatedPlayer: Player) => void
  onLogout?: () => void
}

export default function SettingsModal({ onClose, player, onPlayerUpdate, onLogout }: SettingsModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto mx-2 shadow-xl border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Player Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Player Profile</h3>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-600">
                  {player && (
                    <Image
                      src={getProfilePicture(player)}
                      alt={`${player.name}'s avatar`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{player?.name}</p>
                  <p className="text-sm text-gray-400">
                    {player?.points.toLocaleString()} points • {player?.gamesWon}/{player?.gamesPlayed} wins
                  </p>
                </div>
              </div>
              
              {/* Wallet Address */}
              {player?.walletAddress && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {player.walletAddress}
                  </p>
                </div>
              )}
              
              {/* Player Stats */}
              <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Win Rate</p>
                  <p className="text-sm font-semibold text-white">
                    {player?.gamesPlayed ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Player ID</p>
                  <p className="text-sm font-mono text-gray-300">
                    {player?.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Game Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Sound Effects</span>
                <button className="w-12 h-6 bg-gray-700 rounded-full relative">
                  <div className="w-5 h-5 bg-gray-400 rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Animations</span>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout()
                  onClose()
                }
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout & Disconnect</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will disconnect your wallet and clear your session
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}