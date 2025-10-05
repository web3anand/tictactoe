import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, createUser, getUserByWallet } from '@/lib/supabase'

// Helper function to create fallback game when database is not available
function createFallbackGame(body: any) {
  const player1Data = body.player1 || {
    wallet_address: body.walletAddress || `guest_${body.playerId}`,
    name: body.playerName,
    points: 0,
    gamesPlayed: 0,
    gamesWon: 0
  }

  const walletAddress = player1Data.wallet_address || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  const finalRoomCode = body.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()

  const mockGame = {
    id: Math.random().toString(36).substring(2, 15),
    room_code: finalRoomCode,
    player_x_id: player1Data.id || Math.random().toString(36).substring(2, 15),
    board: Array(36).fill(null), // 6x6 board
    current_player: 'X',
    status: 'waiting',
    game_mode: body.gameMode || (body.isPrivate ? 'private' : 'quick'),
    is_private: body.isPrivate || false,
    base_points: body.gameMode === 'ranked' ? 50 : 25,
    multiplier: body.gameMode === 'ranked' ? 2.0 : 1.5,
    total_moves: 0,
    created_at: new Date().toISOString()
  }

  const mockUser = {
    id: player1Data.id || Math.random().toString(36).substring(2, 15),
    wallet_address: walletAddress,
    username: player1Data.name,
    display_name: player1Data.name,
    total_points: player1Data.points || 0,
    games_played: player1Data.gamesPlayed || 0,
    games_won: player1Data.gamesWon || 0
  }

  return NextResponse.json({ 
    success: true, 
    mode: 'fallback',
    game: {
      id: mockGame.id,
      roomCode: mockGame.room_code,
      player1: mockUser,
      player2: null,
      currentPlayer: mockGame.current_player,
      board: mockGame.board,
      gameOver: mockGame.status === 'finished',
      status: mockGame.status,
      moves: mockGame.total_moves,
      multiplier: mockGame.multiplier,
      streak: 0
    }
  })
}

// Helper function to create game with database
async function createDatabaseGame(body: any, player1Data: any) {
  try {
    // Find or create user
    let user = await getUserByWallet(player1Data.wallet_address)
    
    if (!user) {
      user = await createUser({
        wallet_address: player1Data.wallet_address,
        username: player1Data.name,
        display_name: player1Data.name,
        total_points: player1Data.points || 0,
        games_played: player1Data.gamesPlayed || 0,
        games_won: player1Data.gamesWon || 0
      })
    }

    if (!user) {
      throw new Error('Failed to create or find user')
    }

    // Generate room code
    const roomCode = body.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create game in database
    const { data: newGame, error } = await supabaseAdmin!
      .from('games')
      .insert({
        room_code: roomCode,
        player_x_id: user.id,
        status: 'waiting',
        game_mode: body.gameMode || (body.isPrivate ? 'private' : 'quick'),
        is_private: body.isPrivate || false,
        base_points: body.gameMode === 'ranked' ? 50 : 25,
        multiplier: body.gameMode === 'ranked' ? 2.0 : 1.5
      })
      .select(`
        *,
        player_x:users!games_player_x_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error('Database error creating game:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      mode: 'database',
      game: {
        id: newGame.id,
        roomCode: newGame.room_code,
        player1: newGame.player_x,
        player2: null,
        currentPlayer: newGame.current_player,
        board: newGame.board,
        gameOver: newGame.status === 'finished',
        status: newGame.status,
        moves: newGame.total_moves,
        multiplier: newGame.multiplier,
        streak: 0
      }
    })
  } catch (error) {
    console.error('Error creating database game:', error)
    // Fallback to mock game if database fails
    return createFallbackGame(body)
  }
}

// Create a new game room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received request body:', body)

    // Handle different request formats
    let player1Data
    if (body.player1) {
      player1Data = body.player1
    } else if (body.playerId && body.playerName) {
      player1Data = {
        wallet_address: body.walletAddress || `guest_${body.playerId}`,
        name: body.playerName,
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0
      }
    } else {
      return NextResponse.json({ error: 'Player data required' }, { status: 400 })
    }

    if (!player1Data || (!player1Data.wallet_address && !player1Data.name)) {
      return NextResponse.json({ error: 'Valid player data required' }, { status: 400 })
    }

    // Check if database is available
    if (!supabaseAdmin) {
      console.warn('Database not configured - using fallback mode')
      return createFallbackGame(body)
    }

    // Use database for real multiplayer
    return await createDatabaseGame(body, player1Data)

  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get all active games (for admin/monitoring)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Return mock data for development
    const mockGames: any[] = []
    
    return NextResponse.json({ 
      success: true, 
      games: mockGames
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
