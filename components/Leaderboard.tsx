'use client'

import { motion } from 'framer-motion'
import { X, Trophy } from 'lucide-react'
import Image from 'next/image'

interface Player {
  id: string;
  name: string;
  points: number;
  gamesPlayed: number;
  gamesWon: number;
  walletAddress?: string;
  farcasterProfile?: {
    fid: number;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
  };
}

interface LeaderboardProps {
  leaderboard: Player[];
  onClose: () => void;
}

export default function Leaderboard({ leaderboard, onClose }: LeaderboardProps) {
  const topPlayers = leaderboard.slice(0, 3);
  const otherPlayers = leaderboard.slice(3);

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-800 w-full max-w-md rounded-t-2xl p-5 shadow-2xl border-t border-gray-700"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Top 3 Players */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          {topPlayers.map((player, index) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <Image
                  src={getProfilePicture(player)}
                  alt={player.name}
                  width={index === 0 ? 72 : 64}
                  height={index === 0 ? 72 : 64}
                  className="rounded-full border-2"
                  style={{ borderColor: getRankColor(index + 1) }}
                />
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: getRankColor(index + 1),
                    color: index === 0 ? '#000' : '#fff'
                  }}
                >
                  {index + 1}
                </div>
              </div>
              <p className="font-semibold text-white truncate w-full text-sm">{player.name}</p>
              <p className="text-base font-bold text-blue-400">{player.points.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Other Players List */}
        <div className="space-y-2 overflow-y-auto max-h-[45vh] no-scrollbar">
          {otherPlayers.map((player, index) => (
            <div key={player.id} className="flex items-center bg-gray-900/50 p-2.5 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-medium text-gray-400 w-5 text-center">{index + 4}</span>
                <Image
                  src={getProfilePicture(player)}
                  alt={player.name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-white text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">
                    {player.gamesPlayed} games • {player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}% win rate
                  </p>
                </div>
              </div>
              <p className="text-base font-bold text-blue-400">{player.points.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    default: return '#4A5568'; // gray-600
  }
};

function getProfilePicture(player: Player) {
  if (player.farcasterProfile?.avatar) {
    return player.farcasterProfile.avatar;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&backgroundColor=transparent`;
}
