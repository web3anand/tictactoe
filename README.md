# TicTacToe Pro - Base Mini App

A strategic Tic Tac Toe game built as a Base/Farcaster mini app with multiplier mechanics, leaderboard, and X (Twitter) profile integration.

## Features

- 🎮 **Strategic Tic Tac Toe Gameplay** - Classic 3x3 grid with smooth animations
- ⚡ **Multiplier System** - Speed bonuses, win streaks, and X ethos score bonuses
- 🏆 **Leaderboard** - Compete with other players and track your ranking
- 📊 **Points System** - Earn points based on performance and multipliers
- 🐦 **X Profile Integration** - Connect your X (Twitter) profile for ethos score bonuses
- 🎨 **Aesthetic UI** - Modern design with smooth animations and gradients
- 📱 **Mobile Optimized** - Responsive design for all devices

## Multiplier System

The game features a sophisticated multiplier system that rewards:

1. **Speed Bonus** - Win in fewer moves for higher multipliers
   - 5 moves or less: +2.0x
   - 6-7 moves: +1.5x
   - 8-9 moves: +1.0x

2. **Win Streak** - Consecutive wins increase your multiplier
   - Each win streak: +0.5x per win
   - Max streak bonus: +5.0x

3. **X Ethos Score** - Your X profile's ethos score affects multipliers
   - Ethos score / 100 * 0.5x bonus
   - Higher ethos = better rewards

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom animations
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel
- **Platform**: Base Mini App / Farcaster

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account
- Base app account

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tictactoe-miniapp
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update the environment variables in `.env.local`:
```env
NEXT_PUBLIC_ROOT_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment to Vercel

1. **Deploy to Vercel**:
   - Click the "Deploy to Vercel" button below
   - Connect your GitHub account
   - Deploy the project

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/tictactoe-miniapp)

2. **Update Base Mini App Configuration**:
   - Go to your Vercel dashboard
   - Navigate to Settings -> Deployment Protection
   - Turn off "Vercel Authentication"
   - Copy your deployed URL

3. **Associate with Base Account**:
   - Navigate to [Base Build Account association tool](https://base.org/build/account-association)
   - Paste your Vercel URL in the "App URL" field
   - Click "Submit" and follow the verification steps
   - Copy the generated `accountAssociation` object

4. **Update Manifest**:
   - Update `minikit.config.ts` with your `accountAssociation` credentials
   - Update `app/.well-known/farcaster.json` with your domain
   - Push changes to trigger a new deployment

5. **Preview Your App**:
   - Go to [base.dev/preview](https://base.dev/preview)
   - Add your app URL to test the integration
   - Verify the manifest and account association

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and Tailwind config
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Main game page
│   ├── api/webhook/         # Base Mini App webhook endpoint
│   └── .well-known/         # Farcaster manifest
├── components/
│   ├── GameBoard.tsx        # Game board component
│   ├── PointsDisplay.tsx    # Points and stats display
│   ├── Leaderboard.tsx      # Leaderboard modal
│   ├── XProfileConnect.tsx  # X profile connection
│   └── MultiplierInfo.tsx   # Multiplier system info
├── minikit.config.ts        # Base Mini App configuration
├── vercel.json             # Vercel deployment config
└── package.json            # Dependencies and scripts
```

## Game Rules

1. Players take turns placing X and O marks on a 3x3 grid
2. First player to get 3 marks in a row (horizontally, vertically, or diagonally) wins
3. If all 9 squares are filled without a winner, it's a draw
4. Points are awarded based on:
   - Win: 100 points × multiplier
   - Draw: 20 points × multiplier
   - Multiplier factors: speed, streak, and X ethos score

## Customization

### Adding New Multiplier Factors

Edit the `calculateMultiplier` function in `app/page.tsx`:

```typescript
const calculateMultiplier = (moves: number, streak: number): number => {
  let multiplier = 1
  
  // Add your custom multiplier logic here
  
  return Math.round(multiplier * 10) / 10
}
```

### Styling

The app uses Tailwind CSS with custom components. Main styles are in:
- `app/globals.css` - Global styles and component classes
- `tailwind.config.js` - Tailwind configuration and custom colors

### X Profile Integration

Currently uses mock data. To integrate with real X API:

1. Set up Twitter API credentials in environment variables
2. Update `components/XProfileConnect.tsx` to use real API calls
3. Implement proper OAuth flow for X profile connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the [Base Mini Apps documentation](https://docs.base.org/mini-apps/)
- Join the Base community Discord

---

Built with ❤️ for the Base ecosystem
