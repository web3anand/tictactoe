'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useFarcaster } from './FarcasterProvider';
import SimpleWalletConnect from './SimpleWalletConnect';
import FarcasterLogin from './FarcasterLogin';

interface HybridAuthProps {
  onGuestLogin?: (name: string) => void;
  onAuthSuccess?: (user: any) => void;
}

interface HybridAuthProps {
  onGuestLogin?: (name: string) => void;
  onAuthSuccess?: (user: any) => void;
}

export default function HybridAuth({ onGuestLogin, onAuthSuccess }: HybridAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { isInMiniApp, user: farcasterUser } = useFarcaster();

  const handleFarcasterSuccess = (userData: any) => {
    console.log('🎯 Farcaster auth success:', userData);
    onAuthSuccess?.(userData);
  };

  const handleFarcasterError = (error: string) => {
    console.error('❌ Farcaster auth error:', error);
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-400/30 rounded-2xl p-6 backdrop-blur-sm relative max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Join Game</h2>
        </div>
        <p className="text-gray-300 text-sm">Choose how you want to play</p>
      </div>
      
      <div className="space-y-3">
        <div className="text-center py-2">
          <span className="text-gray-400 text-sm">Connect your account to play</span>
        </div>

        {/* Base Wallet */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-xl p-4">
          <SimpleWalletConnect onGuestLogin={onGuestLogin} />
        </div>

        {/* Farcaster Login */}
        <FarcasterLogin 
          onSuccess={handleFarcasterSuccess}
          onError={handleFarcasterError}
        />
      </div>

      <div className="text-center text-xs text-gray-500 mt-4">
        🔒 Secure • No data collection • Play instantly
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl backdrop-blur-sm"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-white font-medium">Connecting...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}