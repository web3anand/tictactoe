import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { 
  baseAccount, 
  injected 
} from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    // Base Account (Primary)
    baseAccount({
      appName: 'TicTacToe Pro',
    }),
    // Injected (for other wallets including MetaMask)
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
})
