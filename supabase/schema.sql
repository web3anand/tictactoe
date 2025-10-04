-- Complete Supabase Database Schema for TicTacToe Pro Mini-App

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table with comprehensive player data
CREATE TABLE users (
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

-- Removed legacy users table to avoid conflicts

-- Games table with comprehensive game data
CREATE TABLE games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  board JSONB DEFAULT '[[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]]',
  current_player TEXT DEFAULT 'X' CHECK (current_player IN ('X', 'O')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  game_mode TEXT DEFAULT 'quick' CHECK (game_mode IN ('quick', 'ranked', 'private', 'tournament')),
  winner_id UUID REFERENCES users(id),
  player_x_id UUID REFERENCES users(id),
  player_o_id UUID REFERENCES users(id),
  is_private BOOLEAN DEFAULT FALSE,
  base_points INTEGER DEFAULT 25,
  multiplier DECIMAL DEFAULT 1.0,
  game_duration INTEGER, -- seconds
  total_moves INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Blockchain integration
  blockchain_tx_hash TEXT,
  blockchain_confirmed BOOLEAN DEFAULT FALSE,
  blockchain_timestamp TIMESTAMP WITH TIME ZONE,
  blockchain_error TEXT,
  blockchain_retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game moves table for replay functionality
CREATE TABLE game_moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  position_row INTEGER NOT NULL CHECK (position_row >= 0 AND position_row < 6),
  position_col INTEGER NOT NULL CHECK (position_col >= 0 AND position_col < 6),
  player_symbol TEXT NOT NULL CHECK (player_symbol IN ('X', 'O')),
  move_number INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL, -- milliseconds from game start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matchmaking queue for real-time matching
CREATE TABLE matchmaking_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_level INTEGER NOT NULL,
  game_mode TEXT DEFAULT 'quick' CHECK (game_mode IN ('quick', 'ranked')),
  preferences JSONB DEFAULT '{}', -- Region, language, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements system
CREATE TABLE achievements (
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

-- User achievements junction table
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Tournaments system
CREATE TABLE tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tournament_type TEXT DEFAULT 'bracket' CHECK (tournament_type IN ('bracket', 'round_robin', 'swiss')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  entry_fee INTEGER DEFAULT 0, -- in points
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 64,
  current_participants INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE tournament_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER,
  current_round INTEGER DEFAULT 1,
  eliminated BOOLEAN DEFAULT FALSE,
  final_position INTEGER,
  points_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Real-time notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_found', 'game_result', 'achievement', 'tournament', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game statistics for analytics
CREATE TABLE game_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stats JSONB NOT NULL, -- JSON with various statistics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_users_active ON users(last_active DESC);
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_status ON games(status, created_at);
CREATE INDEX idx_games_players ON games(player_x_id, player_o_id);
CREATE INDEX idx_games_blockchain ON games(blockchain_confirmed, blockchain_retry_count);
CREATE INDEX idx_matchmaking_skill ON matchmaking_queue(skill_level, game_mode, created_at);
CREATE INDEX idx_game_moves_game ON game_moves(game_id, move_number);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_tournament_participants ON tournament_participants(tournament_id, user_id);

-- Views for common queries
CREATE VIEW leaderboard AS
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
WHERE u.games_played > 0
ORDER BY u.total_points DESC, 
CASE 
  WHEN u.games_played > 0 
  THEN ROUND((u.games_won::DECIMAL / u.games_played::DECIMAL) * 100, 1)
  ELSE 0.0
END DESC;

-- Active games view
CREATE VIEW active_games AS
SELECT 
  g.*,
  px.username as player_x_username,
  px.avatar_url as player_x_avatar,
  po.username as player_o_username,
  po.avatar_url as player_o_avatar
FROM games g
LEFT JOIN users px ON g.player_x_id = px.id
LEFT JOIN users po ON g.player_o_id = po.id
WHERE g.status IN ('waiting', 'playing');

-- Functions for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate skill level
CREATE OR REPLACE FUNCTION calculate_skill_level(user_points INTEGER, games_played INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF games_played = 0 THEN
    RETURN 1000; -- Default skill level for new players
  END IF;
  
  RETURN GREATEST(100, LEAST(5000, user_points + (games_played * 10)));
END;
$$ LANGUAGE plpgsql;

-- Function to clean old matchmaking queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue 
  WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Games are visible to participants
CREATE POLICY "Games visible to participants" ON games FOR SELECT USING (
  player_x_id::text = current_setting('request.jwt.claims', true)::json->>'user_id' OR
  player_o_id::text = current_setting('request.jwt.claims', true)::json->>'user_id' OR
  status = 'finished'
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value, points_reward, rarity) VALUES
('First Victory', 'Win your first game', '🎉', 'wins', 1, 50, 'common'),
('Hat Trick', 'Win 3 games in a row', '🎩', 'streak', 3, 150, 'rare'),
('Century Club', 'Earn 100 total points', '💯', 'points', 100, 100, 'common'),
('Speed Demon', 'Win a game in under 30 seconds', '⚡', 'special', 30, 200, 'epic'),
('Perfectionist', 'Win 10 games without losing', '👑', 'streak', 10, 500, 'legendary'),
('Marathon Runner', 'Play 50 games', '🏃', 'games', 50, 200, 'rare'),
('Point Collector', 'Earn 1000 total points', '💎', 'points', 1000, 300, 'epic'),
('Unstoppable', 'Win 25 games in a row', '🔥', 'streak', 25, 1000, 'legendary');

-- Create scheduled job to cleanup old queue entries (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-queue', '*/5 * * * *', 'SELECT cleanup_old_queue_entries();');

-- Installation note: Install Supabase CLI with: npm install -g supabase
-- Usage: supabase start (for local dev) and supabase db push (to deploy schema)

-- Added foreign key constraints for better data integrity
ALTER TABLE games ADD CONSTRAINT fk_player_x FOREIGN KEY (player_x_id) REFERENCES users(id);
ALTER TABLE games ADD CONSTRAINT fk_player_o FOREIGN KEY (player_o_id) REFERENCES users(id);
ALTER TABLE game_moves ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES games(id);
ALTER TABLE game_moves ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES users(id);
ALTER TABLE matchmaking_queue ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievement FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_achievements ADD CONSTRAINT fk_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id);
ALTER TABLE tournament_participants ADD CONSTRAINT fk_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
ALTER TABLE tournament_participants ADD CONSTRAINT fk_user_tournament FOREIGN KEY (user_id) REFERENCES users(id);