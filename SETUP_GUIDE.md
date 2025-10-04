# 🚀 Complete Setup Guide - TicTacToe Pro Base Mini-App

This guide will walk you through setting up the complete Base mini-app with all features from the Base documentation.

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Base wallet (Coinbase Wallet or compatible)
- [ ] Vercel account (for deployment)
- [ ] Basic understanding of TypeScript/React

## 🔧 Step-by-Step Setup

### 1. Project Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tictactoe-pro-miniapp.git
cd tictactoe-pro-miniapp

# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local
```

### 2. Supabase Database Setup

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Set database password (save this!)
5. Wait for project to be ready

#### 2.2 Deploy Database Schema
1. Open Supabase SQL Editor
2. Copy contents from `supabase/schema.sql`
3. Run the SQL script
4. Verify tables are created (should see 10+ tables)

#### 2.3 Get Supabase Keys
1. Go to Project Settings → API
2. Copy Project URL and Anon key
3. Go to Service Role and copy the key
4. Update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Base Mini-App Configuration

#### 3.1 Create Base Build Project
1. Visit [build.base.org](https://build.base.org)
2. Connect your wallet
3. Click "Create New App"
4. Fill in app details:
   - Name: "TicTacToe Pro"
   - Description: "Real-time multiplayer TicTacToe with blockchain features"
   - Category: "Games"

#### 3.2 Configure Account Association
1. In Base Build console, go to "Account Association"
2. Enter your domain (initially http://localhost:3001)
3. Click "Generate Association"
4. Copy the generated credentials
5. Update `minikit.config.ts`:

```typescript
export const config = {
  // ... existing config
  accountAssociation: {
    header: "your_generated_header",
    payload: "your_generated_payload", 
    signature: "your_generated_signature"
  },
  // ... rest of config
}
```

#### 3.3 Setup Webhook
1. In Base Build console, go to "Webhooks"
2. Add webhook URL: `https://yourdomain.com/api/webhook`
3. Select events: user.created, user.updated, wallet.connected
4. Copy webhook secret
5. Update `.env.local`:

```env
MINIKIT_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Development Environment

#### 4.1 Start Development Server
```bash
npm run dev
```

Your app should now be running at `http://localhost:3001`

#### 4.2 Test Core Features
- [ ] Game board loads correctly
- [ ] Can place X/O marks
- [ ] Win detection works
- [ ] Socket.IO connects (check browser console)
- [ ] Supabase connection works

#### 4.3 Test Real-time Features
Open two browser windows:
- [ ] Start a game in window 1
- [ ] Join the same game in window 2
- [ ] Moves should sync in real-time
- [ ] Game state persists on refresh

### 5. Farcaster Integration

#### 5.1 Update Farcaster Manifest
Edit `app/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "your_account_association_header",
    "payload": "your_account_association_payload",
    "signature": "your_account_association_signature"
  },
  "frame": {
    "name": "TicTacToe Pro",
    "url": "https://yourdomain.com",
    "iconUrl": "https://yourdomain.com/icon.png",
    "splashImageUrl": "https://yourdomain.com/splash.png",
    "splashBackgroundColor": "#1a1a1a",
    "homeUrl": "https://yourdomain.com"
  },
  "castActions": [
    {
      "type": "post",
      "name": "Challenge to TicTacToe",
      "url": "https://yourdomain.com/api/cast-action",
      "description": "Challenge friends to a game of TicTacToe Pro"
    }
  ]
}
```

#### 5.2 Test Frame Integration
1. Use [Farcaster Frame Debugger](https://warpcast.com/~/developers/frames)
2. Enter your domain URL
3. Verify frame metadata loads correctly
4. Test frame interactions

### 6. Blockchain Integration

#### 6.1 Deploy Smart Contracts
```bash
# Deploy to Base Sepolia (testnet) first
npx hardhat deploy --network base-sepolia

# Deploy to Base mainnet when ready
npx hardhat deploy --network base
```

#### 6.2 Update Contract Addresses
After deployment, update `.env.local`:

```env
NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=0x...
```

### 7. Production Deployment

#### 7.1 Deploy to Vercel
```bash
# Build and test locally first
npm run build
npm start

# Deploy to Vercel
vercel --prod
```

#### 7.2 Update Production URLs
After deployment, update:

1. **Environment Variables** in Vercel dashboard:
   - All the same variables from `.env.local`
   - Update URLs to production domain

2. **Base Build Console**:
   - Update app URL to production domain
   - Regenerate account association if needed

3. **Webhook URLs**:
   - Update webhook URL in Base console
   - Test webhook delivery

#### 7.3 Final Testing Checklist

- [ ] Production app loads correctly
- [ ] Wallet connection works
- [ ] Supabase integration works
- [ ] Real-time multiplayer functions
- [ ] Webhooks receive events
- [ ] Farcaster frame integration works
- [ ] Blockchain transactions work
- [ ] Leaderboard updates correctly
- [ ] Achievements unlock properly

## 🐛 Common Issues & Solutions

### Issue: Socket.IO Connection Fails
**Solution**: 
```bash
# Check if server is running
netstat -an | findstr :3001

# Enable debug mode
DEBUG=socket.io* npm run dev
```

### Issue: Supabase RLS Errors
**Solution**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'games';

-- Ensure user authentication is working
SELECT auth.uid();
```

### Issue: Base Webhook Not Receiving Events
**Solution**:
1. Check webhook URL is publicly accessible
2. Verify webhook secret matches
3. Check webhook event filters in Base console
4. Monitor webhook logs in Vercel

### Issue: Farcaster Frame Not Loading
**Solution**:
1. Verify `.well-known/farcaster.json` is accessible
2. Check account association credentials
3. Use Frame Debugger to test
4. Ensure all required meta tags are present

## 📞 Support & Resources

- **Base Documentation**: [docs.base.org](https://docs.base.org)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Socket.IO Docs**: [socket.io/docs](https://socket.io/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## 🎯 Next Steps

After basic setup:

1. **Customize Game Logic**: Modify win conditions, scoring
2. **Add More Features**: Tournament mode, private rooms
3. **Enhance UI**: Custom themes, animations
4. **Marketing**: Create promotional Farcaster frames
5. **Analytics**: Add user tracking and metrics
6. **Monetization**: Add paid tournaments or NFT prizes

## ✅ Verification Checklist

Use this to verify your setup is complete:

### Backend Infrastructure
- [ ] Supabase database deployed with all tables
- [ ] Socket.IO server running correctly
- [ ] API routes responding properly
- [ ] Real-time subscriptions working

### Base Mini-App Integration
- [ ] Account association configured
- [ ] Webhooks receiving events
- [ ] Minikit configuration complete
- [ ] Farcaster frame accessible

### Game Features
- [ ] 6x6 game board functional
- [ ] Real-time multiplayer working
- [ ] Win detection accurate
- [ ] Scoring system implemented
- [ ] Leaderboard updating

### Production Ready
- [ ] App deployed to production
- [ ] All environment variables set
- [ ] SSL certificate active
- [ ] Performance optimized
- [ ] Error monitoring setup

---

**Need help?** Create an issue in the repository or join the Base Discord community!