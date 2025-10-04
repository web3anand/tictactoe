import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get game state
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId

    // Try to find by gameId first, then by roomCode
    let { data: game, error } = await supabaseAdmin
      .from('games')
      .select(`
        *,
        player_x:users!games_player_x_id_fkey(*),
        player_o:users!games_player_o_id_fkey(*)
      `)
      .eq('id', gameId)
      .single()

    if (error || !game) {
      // Try to find by room code
      const { data: gameByCode, error: codeError } = await supabaseAdmin
        .from('games')
        .select(`
          *,
          player_x:users!games_player_x_id_fkey(*),
          player_o:users!games_player_o_id_fkey(*)
        `)
        .eq('room_code', gameId)
        .single()

      if (codeError || !gameByCode) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      game = gameByCode
    }

    // Get game moves
    const { data: gameMoves } = await supabaseAdmin
      .from('game_moves')
      .select('*')
      .eq('game_id', game.id)
      .order('move_number', { ascending: true })

    return NextResponse.json({ 
      success: true, 
      game: {
        id: game.id,
        roomCode: game.room_code,
        player1: game.player_x,
        player2: game.player_o,
        currentPlayer: game.current_player,
        board: game.board,
        gameOver: game.status === 'finished',
        winner: game.winner_id,
        status: game.status,
        moves: game.total_moves,
        multiplier: game.multiplier,
        gameMode: game.game_mode,
        gameMoves: gameMoves || []
      }
    })
  } catch (error) {
    console.error('Error getting game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Join a game by room code
export async function PUT(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const roomCode = params.gameId
    const { player2 } = await request.json()

    if (!player2 || !player2.wallet_address) {
      return NextResponse.json({ error: 'Player data required' }, { status: 400 })
    }

    // Find the game by room code
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (game.player_o_id) {
      return NextResponse.json({ error: 'Room is already full' }, { status: 400 })
    }

    // Find or create user
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', player2.wallet_address)
      .single()

    if (userError || !user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          wallet_address: player2.wallet_address,
          username: player2.name,
          display_name: player2.name,
          total_points: player2.points || 0,
          games_played: player2.gamesPlayed || 0,
          games_won: player2.gamesWon || 0
        })
        .select()
        .single()

      if (createError || !newUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    }

    // Join the game
    const { data: updatedGame, error: updateError } = await supabaseAdmin
      .from('games')
      .update({ 
        player_o_id: user.id,
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', game.id)
      .select(`
        *,
        player_x:users!games_player_x_id_fkey(*),
        player_o:users!games_player_o_id_fkey(*)
      `)
      .single()

    if (updateError || !updatedGame) {
      return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      game: {
        id: updatedGame.id,
        roomCode: updatedGame.room_code,
        player1: updatedGame.player_x,
        player2: updatedGame.player_o,
        currentPlayer: updatedGame.current_player,
        board: updatedGame.board,
        gameOver: updatedGame.status === 'finished',
        status: updatedGame.status,
        moves: updatedGame.total_moves,
        multiplier: updatedGame.multiplier
      }
    })
  } catch (error) {
    console.error('Error joining game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
