const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || 'https://tictactoe-three-eta.vercel.app';

export const minikitConfig = {
  accountAssociation: {
    "header": "",
    "payload": "",
    "signature": ""
  },
  baseBuilder: {
    allowedAddresses: [""]
  },
  miniapp: {
    version: "1",
    name: "TicTacToe Pro",
    homeUrl: ROOT_URL,
    iconUrl: `${ROOT_URL}/icon.svg`,
    splashImageUrl: `${ROOT_URL}/splash.svg`,
    splashBackgroundColor: "#1e3a8a",
    webhookUrl: `${ROOT_URL}/api/webhook`,
    subtitle: "Strategic XO with Multipliers",
    description: "Play Tic Tac Toe with multiplier mechanics, earn points, and climb the leaderboard. Connect your X profile to get your ethos score!",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.svg`],
    primaryCategory: "games",
    tags: ["gaming", "strategy", "multiplayer", "leaderboard", "points"],
    heroImageUrl: `${ROOT_URL}/hero.svg`,
    tagline: "Master the grid, multiply your score!",
    ogTitle: "TicTacToe Pro - Strategic XO with Multipliers",
    ogDescription: "Play Tic Tac Toe with multiplier mechanics, earn points, and climb the leaderboard. Connect your X profile to get your ethos score!",
    ogImageUrl: `${ROOT_URL}/og-image.svg`,
    noindex: false
  }
} as const;
