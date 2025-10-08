'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@farcaster/auth-kit';
import SimpleWalletConnect from './SimpleWalletConnect';
import SimpleFarcasterAuth from './SimpleFarcasterAuth';

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
  
  const { isAuthenticated, profile } = useProfile();

  const handleFarcasterSuccess = (userData: any) => {
    onAuthSuccess?.(userData);
  };

  const handleFarcasterError = (error: string) => {
    setIsLoading(false);
  };

  // Removed auto-authentication to prevent conflicts

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto space-y-4"
    >
      {/* Wallet Connect Buttons */}
      <SimpleWalletConnect onGuestLogin={onGuestLogin} />

      {/* Farcaster Login */}
      <SimpleFarcasterAuth 
        onSuccess={handleFarcasterSuccess}
        onError={handleFarcasterError}
      />

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-white font-medium">Connecting...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}