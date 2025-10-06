'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // If no Privy app ID is configured, just return children without Privy
  if (!appId || appId === 'your_privy_app_id_here') {
    console.warn('Privy app ID not configured. Social login features will be disabled.');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#0052FF',
          showWalletLoginFirst: false,
        },
        loginMethods: ['google', 'twitter', 'email', 'telegram'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base-mainnet',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://mainnet.base.org'] },
              public: { http: ['https://mainnet.base.org'] },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}