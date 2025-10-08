import { PrivyClientConfig } from '@privy-io/react-auth'
import { base } from 'wagmi/chains'

export const privyConfig: PrivyClientConfig = {
  // Appearance customization
  appearance: {
    theme: 'dark',
    accentColor: '#3b82f6',
    logo: '/icon.svg',
    showWalletLoginFirst: false,
  },
  
  // Authentication methods
  loginMethods: ['email', 'wallet'],
  
  // Embedded wallet configuration
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: true,
  },
  
  // Supported chains
  supportedChains: [base],
  
  // Default chain
  defaultChain: base,
  
  // Legal terms (optional)
  legal: {
    termsAndConditionsUrl: 'https://basetok.fun/terms',
    privacyPolicyUrl: 'https://basetok.fun/privacy',
  },
}