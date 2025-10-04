# Multiplayer TicTacToe Setup

## Features Added

✅ **Database Setup**: Prisma with PostgreSQL for storing game data, user profiles, and leaderboard
✅ **API Routes**: Complete REST API for game management, moves, and leaderboard
✅ **Multiplayer Game Logic**: Real-time game state management with room codes
✅ **Invite System**: X username-based invitation system
✅ **Multiplier System**: Enhanced multiplier concept with visual indicators
✅ **Data Persistence**: All game data, user stats, and leaderboard stored in database

## Database Setup

1. **Install PostgreSQL** on your system
2. **Create a database** named `tictactoe`
3. **Set up environment variables**:
   ```bash
   # Create .env file
   DATABASE_URL="postgresql://username:password@localhost:5432/tictactoe?schema=public"
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

## API Endpoints

### Games
- `POST /api/games` - Create a new game room
- `PUT /api/games` - Join an existing game room
- `GET /api/games/[gameId]` - Get game state
- `POST /api/games/[gameId]/moves` - Make a move

### Leaderboard
- `GET /api/leaderboard` - Get current leaderboard

## Multiplayer Features

### Room System
- **Room Codes**: 6-character codes for easy sharing
- **Player Management**: Automatic user creation and management
- **Game State**: Real-time game state synchronization
- **Turn Management**: Proper turn-based gameplay

### Invite System
- **X Username Integration**: Invite friends by X username
- **Clipboard Integration**: One-click room code copying
- **Share Messages**: Pre-formatted invite messages

### Multiplier System
- **Speed Bonuses**: Faster wins = higher multipliers
- **Streak Bonuses**: Consecutive wins increase multipliers
- **X Profile Bonuses**: Ethos score affects multipliers
- **Visual Indicators**: Real-time multiplier display

### Data Storage
- **User Profiles**: Wallet addresses, names, X profiles, stats
- **Game History**: Complete move history and game outcomes
- **Leaderboard**: Persistent ranking system
- **Statistics**: Games played, won, points, win rates

## Usage

1. **Single Player**: Play against AI with multiplier system
2. **Multiplayer**: Create or join rooms with friends
3. **Invite Friends**: Use X usernames to invite others
4. **Compete**: Climb the leaderboard with points and multipliers

## Next Steps

- **WebSocket Integration**: Real-time updates without polling
- **Push Notifications**: Notify players of their turn
- **Tournament Mode**: Bracket-style competitions
- **Spectator Mode**: Watch ongoing games
