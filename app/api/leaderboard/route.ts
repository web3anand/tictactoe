import { NextRequest, NextResponse } from 'next/server'
import { memoryDb } from '@/lib/memory-db'

// Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const leaderboard = memoryDb.getLeaderboard()

    return NextResponse.json({ success: true, leaderboard })
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to get leaderboard' }, { status: 500 })
  }
}
