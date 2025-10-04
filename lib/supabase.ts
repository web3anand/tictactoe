import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if environment variables are set
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️  Supabase URL not configured - using placeholder mode')
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder_anon_key') {
  console.warn('⚠️  Supabase anon key not configured - using placeholder mode')
}

// Client-side Supabase client
export const supabase = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder_anon_key' 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// Server-side Supabase client with service role
export const supabaseAdmin = supabaseUrl && supabaseServiceKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseServiceKey !== 'placeholder_service_role_key'
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Server component client
export const createServerSupabaseClient = (request: NextRequest, response: NextResponse) => {
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseAnonKey === 'placeholder_anon_key') {
    throw new Error('Supabase configuration not properly set up')
  }
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        request.cookies.delete({ name, ...options })
        response.cookies.delete({ name, ...options })
      },
    },
  })
}

// Database types
export interface User {
  id: string
  wallet_address: string
  username?: string
  display_name?: string
  avatar_url?: string
  total_points: number
  games_played: number
  games_won: number
  win_streak: number
  max_win_streak: number
  multiplier_level: number
  last_active: string
  farcaster_fid?: number
  farcaster_username?: string
  farcaster_verified: boolean
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  room_code: string
  board: (string | null)[][]
  current_player: 'X' | 'O'
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  game_mode: 'quick' | 'ranked' | 'private' | 'tournament'
  winner_id?: string
  player_x_id?: string
  player_o_id?: string
  is_private: boolean
  base_points: number
  multiplier: number
  game_duration?: number
  total_moves: number
  points_earned: number
  blockchain_tx_hash?: string
  blockchain_confirmed: boolean
  blockchain_timestamp?: string
  started_at?: string
  finished_at?: string
  created_at: string
  updated_at: string
}

export interface GameMove {
  id: string
  game_id: string
  player_id: string
  position_row: number
  position_col: number
  player_symbol: 'X' | 'O'
  move_number: number
  timestamp_ms: number
  created_at: string
}

export interface MatchmakingQueue {
  id: string
  user_id: string
  skill_level: number
  game_mode: 'quick' | 'ranked'
  preferences: Record<string, any>
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  condition_type: 'wins' | 'streak' | 'points' | 'games' | 'special'
  condition_value?: number
  points_reward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

export interface Tournament {
  id: string
  name: string
  description?: string
  tournament_type: 'bracket' | 'round_robin' | 'swiss'
  status: 'upcoming' | 'active' | 'finished'
  entry_fee: number
  prize_pool: number
  max_participants: number
  current_participants: number
  start_time?: string
  end_time?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'match_found' | 'game_result' | 'achievement' | 'tournament' | 'system'
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

// Real-time subscription helpers
export const subscribeToGame = (gameId: string, callback: (game: Game) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured - real-time subscriptions disabled')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`
    }, (payload) => {
      callback(payload.new as Game)
    })
    .subscribe()
}

export const subscribeToGameMoves = (gameId: string, callback: (move: GameMove) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured - real-time subscriptions disabled')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel(`moves:${gameId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'game_moves',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      callback(payload.new as GameMove)
    })
    .subscribe()
}

export const subscribeToMatchmaking = (userId: string, callback: (data: any) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured - real-time subscriptions disabled')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel('matchmaking')
    .on('broadcast', { event: 'match_found' }, callback)
    .on('broadcast', { event: 'queue_update' }, callback)
    .subscribe()
}

export const subscribeToNotifications = (userId: string, callback: (notification: Notification) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured - real-time subscriptions disabled')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      callback(payload.new as Notification)
    })
    .subscribe()
}

// Utility functions
export const getUserByWallet = async (walletAddress: string): Promise<User | null> => {
  if (!supabase) {
    console.warn('Supabase not configured - returning null user')
    return null
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()
  
  if (error) return null
  return data
}

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  if (!supabase) {
    console.warn('Supabase not configured - cannot create user')
    return null
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating user:', error)
    return null
  }
  return data
}

export const updateUserStats = async (
  userId: string, 
  won: boolean, 
  pointsEarned: number
): Promise<void> => {
  if (!supabase) {
    console.warn('Supabase not configured - cannot update user stats')
    return
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) return

  const newStats = {
    total_points: user.total_points + pointsEarned,
    games_played: user.games_played + 1,
    games_won: won ? user.games_won + 1 : user.games_won,
    win_streak: won ? user.win_streak + 1 : 0,
    max_win_streak: won 
      ? Math.max(user.max_win_streak, user.win_streak + 1)
      : user.max_win_streak,
    multiplier_level: won 
      ? Math.min(user.multiplier_level + 0.1, 5.0)
      : Math.max(user.multiplier_level - 0.05, 1.0),
    last_active: new Date().toISOString()
  }

  await supabase
    .from('users')
    .update(newStats)
    .eq('id', userId)
}

export const getLeaderboard = async (limit: number = 50): Promise<any[]> => {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty leaderboard')
    return []
  }
  
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(limit)
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
  return data || []
}

export const checkAchievements = async (userId: string): Promise<UserAchievement[]> => {
  if (!supabase) {
    console.warn('Supabase not configured - cannot check achievements')
    return []
  }
  
  // Get user stats
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) return []

  // Get all achievements user doesn't have
  const { data: availableAchievements } = await supabase
    .from('achievements')
    .select('*')
    .not('id', 'in', `(SELECT achievement_id FROM user_achievements WHERE user_id = '${userId}')`)

  if (!availableAchievements) return []

  const newAchievements: UserAchievement[] = []

  for (const achievement of availableAchievements) {
    let unlocked = false

    switch (achievement.condition_type) {
      case 'wins':
        unlocked = user.games_won >= achievement.condition_value
        break
      case 'streak':
        unlocked = user.win_streak >= achievement.condition_value || user.max_win_streak >= achievement.condition_value
        break
      case 'points':
        unlocked = user.total_points >= achievement.condition_value
        break
      case 'games':
        unlocked = user.games_played >= achievement.condition_value
        break
    }

    if (unlocked) {
      const { data: userAchievement } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id
        })
        .select('*, achievement:achievements(*)')
        .single()

      if (userAchievement) {
        newAchievements.push(userAchievement)

        // Award points
        await supabase
          .from('users')
          .update({
            total_points: user.total_points + achievement.points_reward
          })
          .eq('id', userId)

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You unlocked "${achievement.name}" and earned ${achievement.points_reward} points!`,
            data: { achievement_id: achievement.id }
          })
      }
    }
  }

  return newAchievements
}