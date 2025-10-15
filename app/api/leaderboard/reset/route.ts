import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { memoryDb } from '@/lib/memory-db'

// Reset leaderboard
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting leaderboard...')

    // Check if database is available
    if (!supabaseAdmin) {
      console.warn('Database not configured - resetting memory database')
      memoryDb.reset()
      return NextResponse.json({ success: true, message: 'Memory leaderboard reset successfully', mode: 'fallback' })
    }

    // Reset database leaderboard - delete all data in proper order (respecting foreign keys)
    
    // First delete game moves
    await supabaseAdmin.from('game_moves').delete().gt('created_at', '1900-01-01')
    
    // Then delete games
    await supabaseAdmin.from('games').delete().gt('created_at', '1900-01-01')
    
    // Then delete user achievements
    await supabaseAdmin.from('user_achievements').delete().gt('unlocked_at', '1900-01-01')
    
    // Then delete notifications
    await supabaseAdmin.from('notifications').delete().gt('created_at', '1900-01-01')
    
    // Then delete matchmaking queue
    await supabaseAdmin.from('matchmaking_queue').delete().gt('created_at', '1900-01-01')
    
    // Finally delete users
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .gt('created_at', '1900-01-01')

    if (error) {
      console.error('Error resetting leaderboard:', error)
      throw error
    }

    console.log('✅ Database leaderboard reset successfully')
    return NextResponse.json({ success: true, message: 'Leaderboard reset successfully', mode: 'database' })
  } catch (error) {
    console.error('Error resetting leaderboard:', error)
    return NextResponse.json({ error: 'Failed to reset leaderboard' }, { status: 500 })
  }
}