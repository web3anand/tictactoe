const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || 'https://basetok.fun';

export const minikitConfig = {
  // Account Association for Base verification
  accountAssociation: {
    header: process.env.MINIKIT_ACCOUNT_ASSOCIATION_HEADER || "",
    payload: process.env.MINIKIT_ACCOUNT_ASSOCIATION_PAYLOAD || "",
    signature: process.env.MINIKIT_ACCOUNT_ASSOCIATION_SIGNATURE || ""
  },
  
  // Base Builder Integration
  baseBuilder: {
    allowedAddresses: [process.env.MINIKIT_ALLOWED_ADDRESS || ""],
    projectId: process.env.NEXT_PUBLIC_MINIKIT_PROJECT_ID || ""
  },
  
  // Farcaster Integration
  farcaster: {
    enabled: true,
    castAction: {
      name: "Play TicTacToe",
      icon: "game",
      description: "Challenge someone to a strategic TicTacToe match!",
      aboutUrl: `${ROOT_URL}/about`,
      action: {
        type: "post"
      }
    },
    frame: {
      version: "next",
      buttons: [
        {
          label: "🎮 Play Now",
          action: "link",
          target: ROOT_URL
        },
        {
          label: "🏆 Leaderboard",
          action: "link", 
          target: `${ROOT_URL}/leaderboard`
        }
      ],
      image: `${ROOT_URL}/frame-image.png`,
      postUrl: `${ROOT_URL}/api/frame`
    }
  },
  
  // OnchainKit Configuration
  onchainKit: {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "8453"),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org",
    contractAddress: process.env.NEXT_PUBLIC_GAME_REGISTRY_CONTRACT || "",
    features: {
      transactions: true,
      identity: true,
      wallet: true,
      fund: true
    }
  },
  
  // Mini-app Configuration
  miniapp: {
    version: "2.0",
    name: "TicTacToe Pro",
    homeUrl: ROOT_URL,
    iconUrl: `${ROOT_URL}/icon.svg`,
    splashImageUrl: `${ROOT_URL}/splash.svg`, 
    splashBackgroundColor: "#0052ff",
    webhookUrl: `${ROOT_URL}/api/webhook`,
    subtitle: "Strategic XO with Blockchain Rewards",
    description: "Play multiplayer TicTacToe with real-time matchmaking, blockchain rewards, and verified leaderboards. Every game result is recorded on Base for complete transparency!",
    screenshotUrls: [
      `${ROOT_URL}/screenshot-portrait.svg`,
      `${ROOT_URL}/screenshot-landscape.svg`
    ],
    primaryCategory: "games",
    tags: ["gaming", "strategy", "multiplayer", "blockchain", "base", "onchain", "leaderboard"],
    heroImageUrl: `${ROOT_URL}/hero.svg`,
    tagline: "Master the grid, earn onchain rewards!",
    ogTitle: "TicTacToe Pro - Onchain Gaming on Base",
    ogDescription: "Experience the future of gaming with blockchain-verified results, real-time multiplayer, and transparent leaderboards on Base.",
    ogImageUrl: `${ROOT_URL}/og-image.svg`,
    noindex: false,
    
    // Advanced Mini-app Features
    features: {
      realTimeMultiplayer: true,
      blockchainIntegration: true,
      socialFeatures: true,
      achievements: true,
      leaderboards: true,
      notifications: true
    },
    
    // Payment Integration
    payments: {
      enabled: true,
      currency: "USD",
      methods: ["coinbase", "wallet"]
    },
    
    // Analytics
    analytics: {
      enabled: true,
      events: ["game_start", "game_end", "match_found", "payment_complete"]
    }
  },
  
  // WebSocket Configuration for Real-time Features
  realtime: {
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
    namespace: "/game",
    events: {
      gameUpdate: "game:update",
      playerJoin: "player:join", 
      playerLeave: "player:leave",
      matchFound: "match:found",
      gameResult: "game:result"
    }
  }
} as const;

// Export types for TypeScript
export type MinikitConfig = typeof minikitConfig;
export type MinikitFeatures = typeof minikitConfig.miniapp.features;
