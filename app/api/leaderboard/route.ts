import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getLeaderboard, createUser, getUserByWallet } from '@/lib/supabase'
import { memoryDb } from '@/lib/memory-db'

// Get leaderboard
export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!supabaseAdmin) {
      console.warn('Database not configured - using fallback leaderboard')
      const leaderboard = memoryDb.getLeaderboard()
      return NextResponse.json({ success: true, leaderboard, mode: 'fallback' })
    }

    // Get leaderboard from database
    const leaderboard = await getLeaderboard(50)
    return NextResponse.json({ success: true, leaderboard, mode: 'database' })
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    // Fallback to memory if database fails
    try {
      const leaderboard = memoryDb.getLeaderboard()
      return NextResponse.json({ success: true, leaderboard, mode: 'fallback' })
    } catch (fallbackError) {
      return NextResponse.json({ success: false, error: 'Failed to get leaderboard' }, { status: 500 })
    }
  }
}

// Update leaderboard (create or update player)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received leaderboard update:', body)

    const { walletAddress, name, points, gamesPlayed, gamesWon, winStreak } = body

    if (!walletAddress || !name) {
      return NextResponse.json({ error: 'Wallet address and name required' }, { status: 400 })
    }

    // Check if database is available
    if (!supabaseAdmin) {
      console.warn('Database not configured - using fallback mode')
      // Update memory database
      let user = memoryDb.findUserByWallet(walletAddress)
      
      if (!user) {
        user = memoryDb.createUser({
          name,
          points: points || 0,
          gamesPlayed: gamesPlayed || 0,
          gamesWon: gamesWon || 0,
          walletAddress
        })
      } else {
        const updatedUser = memoryDb.updateUser(user.id, {
          name,
          points: Math.max(user.points, points || 0),
          gamesPlayed: Math.max(user.gamesPlayed, gamesPlayed || 0),
          gamesWon: Math.max(user.gamesWon, gamesWon || 0)
        })
        if (updatedUser) user = updatedUser
      }
      
      return NextResponse.json({ 
        success: true, 
        player: user ? {
          id: user.id,
          wallet: user.walletAddress,
          name: user.name,
          points: user.points,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          winStreak: winStreak || 0
        } : null, 
        mode: 'fallback' 
      })
    }

    // Use database
    let user = await getUserByWallet(walletAddress)
    
    if (!user) {
      // Create new user
      user = await createUser({
        wallet_address: walletAddress,
        username: name,
        display_name: name,
        total_points: points || 0,
        games_played: gamesPlayed || 0,
        games_won: gamesWon || 0,
        win_streak: winStreak || 0,
        max_win_streak: winStreak || 0,
        multiplier_level: 1.0,
        last_active: new Date().toISOString()
      })

      if (!user) {
        throw new Error('Failed to create user')
      }
    } else {
      // Update existing user
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({
          display_name: name,
          total_points: Math.max(user.total_points, points || 0),
          games_played: Math.max(user.games_played, gamesPlayed || 0),
          games_won: Math.max(user.games_won, gamesWon || 0),
          win_streak: winStreak !== undefined ? winStreak : user.win_streak,
          max_win_streak: Math.max(user.max_win_streak, winStreak || 0),
          last_active: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      user = updatedUser
    }

    return NextResponse.json({ 
      success: true, 
      player: user ? {
        id: user.id,
        wallet: user.wallet_address,
        name: user.display_name,
        points: user.total_points,
        gamesPlayed: user.games_played,
        gamesWon: user.games_won,
        winStreak: user.win_streak
      } : null,
      mode: 'database'
    })
  } catch (error) {
    console.error('Error updating leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
