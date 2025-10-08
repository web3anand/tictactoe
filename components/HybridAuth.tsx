'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@farcaster/auth-kit';
import SimpleWalletConnect from './SimpleWalletConnect';
import FarcasterAuthKitLogin from './FarcasterAuthKitLogin';

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

  // Auto-trigger onAuthSuccess if user is already authenticated via Auth Kit
  useEffect(() => {
    if (isAuthenticated && profile && onAuthSuccess) {
      // Format profile data for the app
      const userData = {
        fid: profile.fid,
        username: profile.username,
        displayName: profile.displayName,
        pfpUrl: profile.pfpUrl,
        bio: profile.bio,
        verifications: profile.verifications || []
      };
      
      handleFarcasterSuccess(userData);
    }
  }, [isAuthenticated, profile, onAuthSuccess]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto space-y-4"
    >
      {/* Wallet Connect Buttons */}
      <SimpleWalletConnect onGuestLogin={onGuestLogin} />

      {/* Farcaster Login */}
      <FarcasterAuthKitLogin 
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