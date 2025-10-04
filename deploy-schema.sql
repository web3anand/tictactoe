-- TicTacToe Pro - Supabase Schema Deployment
-- Copy this entire script and paste it into Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  max_win_streak INTEGER DEFAULT 0,
  multiplier_level DECIMAL DEFAULT 1.0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  farcaster_fid INTEGER,
  farcaster_username TEXT,
  farcaster_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  board JSONB DEFAULT '[[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]]',
  current_player TEXT DEFAULT 'X' CHECK (current_player IN ('X', 'O')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  game_mode TEXT DEFAULT 'quick' CHECK (game_mode IN ('quick', 'ranked', 'private', 'tournament')),
  winner_id UUID,
  player_x_id UUID,
  player_o_id UUID,
  is_private BOOLEAN DEFAULT FALSE,
  base_points INTEGER DEFAULT 25,
  multiplier DECIMAL DEFAULT 1.0,
  game_duration INTEGER,
  total_moves INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  blockchain_tx_hash TEXT,
  blockchain_confirmed BOOLEAN DEFAULT FALSE,
  blockchain_timestamp TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game moves table
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID,
  player_id UUID,
  position_row INTEGER NOT NULL CHECK (position_row >= 0 AND position_row < 6),
  position_col INTEGER NOT NULL CHECK (position_col >= 0 AND position_col < 6),
  player_symbol TEXT NOT NULL CHECK (player_symbol IN ('X', 'O')),
  move_number INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('wins', 'streak', 'points', 'games', 'special')),
  condition_value INTEGER,
  points_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  achievement_id UUID,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('match_found', 'game_result', 'achievement', 'tournament', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE games ADD CONSTRAINT IF NOT EXISTS fk_games_winner FOREIGN KEY (winner_id) REFERENCES users(id);
ALTER TABLE games ADD CONSTRAINT IF NOT EXISTS fk_games_player_x FOREIGN KEY (player_x_id) REFERENCES users(id);
ALTER TABLE games ADD CONSTRAINT IF NOT EXISTS fk_games_player_o FOREIGN KEY (player_o_id) REFERENCES users(id);
ALTER TABLE game_moves ADD CONSTRAINT IF NOT EXISTS fk_moves_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE game_moves ADD CONSTRAINT IF NOT EXISTS fk_moves_player FOREIGN KEY (player_id) REFERENCES users(id);
ALTER TABLE user_achievements ADD CONSTRAINT IF NOT EXISTS fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_achievements ADD CONSTRAINT IF NOT EXISTS fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id);
ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status, created_at);
CREATE INDEX IF NOT EXISTS idx_game_moves_game ON game_moves(game_id, move_number);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.wallet_address,
  u.username,
  u.display_name,
  u.avatar_url,
  u.total_points,
  u.games_played,
  u.games_won,
  u.win_streak,
  u.max_win_streak,
  u.multiplier_level,
  CASE 
    WHEN u.games_played > 0 
    THEN ROUND((u.games_won::DECIMAL / u.games_played::DECIMAL) * 100, 1)
    ELSE 0.0
  END as win_percentage,
  ROW_NUMBER() OVER (
    ORDER BY u.total_points DESC, 
    CASE 
      WHEN u.games_played > 0 
      THEN ROUND((u.games_won::DECIMAL / u.games_played::DECIMAL) * 100, 1)
      ELSE 0.0
    END DESC
  ) as rank
FROM users u
WHERE u.games_played >= 0
ORDER BY u.total_points DESC;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value, points_reward, rarity) 
VALUES
('First Victory', 'Win your first game', '🎉', 'wins', 1, 50, 'common'),
('Hat Trick', 'Win 3 games in a row', '🎩', 'streak', 3, 150, 'rare'),
('Century Club', 'Earn 100 total points', '💯', 'points', 100, 100, 'common'),
('Speed Demon', 'Win a game quickly', '⚡', 'special', 30, 200, 'epic'),
('Marathon Runner', 'Play 50 games', '🏃', 'games', 50, 200, 'rare'),
('Point Collector', 'Earn 1000 total points', '💎', 'points', 1000, 300, 'epic')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'TicTacToe Pro database schema deployed successfully!' as message;