import { PrivyClientConfig } from '@privy-io/react-auth'
import { base } from 'wagmi/chains'

export const privyConfig: PrivyClientConfig = {
  // Appearance customization
  appearance: {
    theme: 'dark',
    accentColor: '#40d46dff', // Base green/blue
    logo: '/B T.svg',
    showWalletLoginFirst: false, // Show social logins first
  },
  
  // Authentication methods - Put farcaster first to enable Base app integration
  loginMethods: ['farcaster', 'twitter', 'telegram', 'email', 'wallet'],
  
  // Funding configuration
  fundingMethodConfig: {
    moonpay: {
      useSandbox: true
    }
  },
  
  // Embedded wallet configuration
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: true,
  },
  
  // Enable Coinbase Wallet for Base app integration
  externalWallets: {
    coinbaseWallet: {
      config: {
        appName: 'Basetok'
      }
    }
  },
  
  // MFA configuration
  mfa: {
    noPromptOnMfaRequired: false
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