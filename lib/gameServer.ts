import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { supabaseAdmin, User, Game, GameMove } from './supabase'
import { minikitConfig } from '../minikit.config'

interface ExtendedSocket extends Socket {
  userId?: string
  gameId?: string
}

interface GameRoom {
  id: string
  players: Map<string, ExtendedSocket>
  spectators: Set<ExtendedSocket>
  gameData: Game | null
}

export class GameServer {
  private io: SocketIOServer
  private gameRooms: Map<string, GameRoom> = new Map()
  private userSockets: Map<string, ExtendedSocket> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_ROOT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
    this.setupCleanupTasks()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: ExtendedSocket) => {
      console.log(`👤 User connected: ${socket.id}`)

      // Authentication
      socket.on('authenticate', async (data: { userId: string, walletAddress: string }) => {
        try {
          if (!supabaseAdmin) {
            socket.emit('authentication_failed', { error: 'Database not configured' })
            return
          }
          
          // Verify user exists in database
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.userId)
            .eq('wallet_address', data.walletAddress)
            .single()

          if (user) {
            socket.userId = data.userId
            this.userSockets.set(data.userId, socket)
            
            // Update user's last active time
            await supabaseAdmin
              .from('users')
              .update({ last_active: new Date().toISOString() })
              .eq('id', data.userId)

            socket.emit('authenticated', { success: true, user })
            console.log(`✅ User authenticated: ${user.username || user.wallet_address}`)
          } else {
            socket.emit('authentication_failed', { error: 'User not found' })
          }
        } catch (error) {
          console.error('Authentication error:', error)
          socket.emit('authentication_failed', { error: 'Authentication failed' })
        }
      })

      // Join game room
      socket.on('join_game', async (data: { roomCode: string }) => {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        try {
          const { data: game } = await supabaseAdmin
            .from('games')
            .select('*')
            .eq('room_code', data.roomCode)
            .single()

          if (!game) {
            socket.emit('error', { message: 'Game not found' })
            return
          }

          socket.gameId = game.id
          socket.join(data.roomCode)

          // Get or create game room
          let gameRoom = this.gameRooms.get(game.id)
          if (!gameRoom) {
            gameRoom = {
              id: game.id,
              players: new Map(),
              spectators: new Set(),
              gameData: game
            }
            this.gameRooms.set(game.id, gameRoom)
          }

          // Add player to room
          const isPlayer = game.player_x_id === socket.userId || game.player_o_id === socket.userId
          if (isPlayer) {
            gameRoom.players.set(socket.userId, socket)
          } else {
            gameRoom.spectators.add(socket)
          }

          // Send current game state
          socket.emit('game_state', game)
          
          // Notify room about new participant
          this.io.to(data.roomCode).emit('player_joined', {
            userId: socket.userId,
            isPlayer,
            playerCount: gameRoom.players.size,
            spectatorCount: gameRoom.spectators.size
          })

          console.log(`🎮 User ${socket.userId} joined game ${data.roomCode}`)
        } catch (error) {
          console.error('Join game error:', error)
          socket.emit('error', { message: 'Failed to join game' })
        }
      })

      // Make a move
      socket.on('make_move', async (data: { 
        roomCode: string, 
        row: number, 
        col: number 
      }) => {
        if (!socket.userId || !socket.gameId) {
          socket.emit('error', { message: 'Not in a game' })
          return
        }

        try {
          const gameRoom = this.gameRooms.get(socket.gameId)
          if (!gameRoom) {
            socket.emit('error', { message: 'Game room not found' })
            return
          }

          // Get current game state
          const { data: game } = await supabaseAdmin
            .from('games')
            .select('*')
            .eq('id', socket.gameId)
            .single()

          if (!game || game.status !== 'playing') {
            socket.emit('error', { message: 'Game not active' })
            return
          }

          // Validate move
          const currentPlayerSymbol = game.current_player
          const expectedPlayerId = currentPlayerSymbol === 'X' ? game.player_x_id : game.player_o_id
          
          if (socket.userId !== expectedPlayerId) {
            socket.emit('error', { message: 'Not your turn' })
            return
          }

          if (game.board[data.row][data.col] !== null) {
            socket.emit('error', { message: 'Cell already occupied' })
            return
          }

          // Make the move
          const newBoard = [...game.board]
          newBoard[data.row][data.col] = currentPlayerSymbol
          
          const moveNumber = game.total_moves + 1
          const nextPlayer = currentPlayerSymbol === 'X' ? 'O' : 'X'

          // Check for win condition
          const winner = this.checkWinner(newBoard)
          const isDraw = !winner && moveNumber === 36
          
          const gameUpdate: Partial<Game> = {
            board: newBoard,
            current_player: nextPlayer,
            total_moves: moveNumber,
            updated_at: new Date().toISOString()
          }

          if (winner || isDraw) {
            gameUpdate.status = 'finished'
            gameUpdate.winner_id = winner ? socket.userId : undefined
            gameUpdate.finished_at = new Date().toISOString()
            gameUpdate.game_duration = Math.floor(
              (Date.now() - new Date(game.started_at || game.created_at).getTime()) / 1000
            )

            // Calculate points
            if (winner) {
              const pointsEarned = Math.floor(game.base_points * game.multiplier)
              gameUpdate.points_earned = pointsEarned

              // Update player stats
              await this.updatePlayerStats(socket.userId, true, pointsEarned)
              const loserId = currentPlayerSymbol === 'X' ? game.player_o_id : game.player_x_id
              if (loserId) {
                await this.updatePlayerStats(loserId, false, 0)
              }
            }
          }

          // Update game in database
          const { data: updatedGame } = await supabaseAdmin
            .from('games')
            .update(gameUpdate)
            .eq('id', socket.gameId)
            .select()
            .single()

          // Record the move
          await supabaseAdmin
            .from('game_moves')
            .insert({
              game_id: socket.gameId,
              player_id: socket.userId,
              position_row: data.row,
              position_col: data.col,
              player_symbol: currentPlayerSymbol,
              move_number: moveNumber,
              timestamp_ms: Math.floor((Date.now() - new Date(game.started_at || game.created_at).getTime()))
            })

          // Broadcast move to all players in room
          this.io.to(data.roomCode).emit('move_made', {
            row: data.row,
            col: data.col,
            player: currentPlayerSymbol,
            playerId: socket.userId,
            gameState: updatedGame,
            moveNumber
          })

          // Handle game end
          if (winner || isDraw) {
            this.io.to(data.roomCode).emit('game_ended', {
              winner: winner ? socket.userId : null,
              isDraw,
              gameState: updatedGame
            })

            // Check for achievements
            if (winner) {
              await this.checkAndAwardAchievements(socket.userId)
            }

            // Clean up room after delay
            setTimeout(() => {
              this.gameRooms.delete(socket.gameId!)
            }, 30000) // 30 seconds
          }

          console.log(`🎯 Move made: ${socket.userId} placed ${currentPlayerSymbol} at (${data.row}, ${data.col})`)
        } catch (error) {
          console.error('Make move error:', error)
          socket.emit('error', { message: 'Failed to make move' })
        }
      })

      // Join matchmaking queue
      socket.on('join_matchmaking', async (data: { gameMode: 'quick' | 'ranked' }) => {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        try {
          // Get user stats for skill calculation
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', socket.userId)
            .single()

          if (!user) {
            socket.emit('error', { message: 'User not found' })
            return
          }

          const skillLevel = this.calculateSkillLevel(user.total_points, user.games_played)

          // Add to matchmaking queue
          await supabaseAdmin
            .from('matchmaking_queue')
            .insert({
              user_id: socket.userId,
              skill_level: skillLevel,
              game_mode: data.gameMode
            })

          socket.emit('matchmaking_joined', { skillLevel, gameMode: data.gameMode })

          // Try to find a match
          await this.findMatch(socket.userId, skillLevel, data.gameMode)

          console.log(`🔍 User ${socket.userId} joined ${data.gameMode} matchmaking (skill: ${skillLevel})`)
        } catch (error) {
          console.error('Join matchmaking error:', error)
          socket.emit('error', { message: 'Failed to join matchmaking' })
        }
      })

      // Leave matchmaking queue
      socket.on('leave_matchmaking', async () => {
        if (!socket.userId) return

        try {
          await supabaseAdmin
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', socket.userId)

          socket.emit('matchmaking_left')
          console.log(`❌ User ${socket.userId} left matchmaking`)
        } catch (error) {
          console.error('Leave matchmaking error:', error)
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`👋 User disconnected: ${socket.id}`)
        
        if (socket.userId) {
          // Remove from user sockets
          this.userSockets.delete(socket.userId)

          // Remove from matchmaking queue
          await supabaseAdmin
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', socket.userId)

          // Handle game room cleanup
          if (socket.gameId) {
            const gameRoom = this.gameRooms.get(socket.gameId)
            if (gameRoom) {
              gameRoom.players.delete(socket.userId)
              gameRoom.spectators.delete(socket)

              // Notify remaining players
              if (gameRoom.gameData) {
                this.io.to(gameRoom.gameData.room_code).emit('player_left', {
                  userId: socket.userId,
                  playerCount: gameRoom.players.size,
                  spectatorCount: gameRoom.spectators.size
                })
              }
            }
          }

          // Update last active time
          await supabaseAdmin
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('id', socket.userId)
        }
      })
    })
  }

  private async findMatch(userId: string, skillLevel: number, gameMode: 'quick' | 'ranked'): Promise<void> {
    try {
      // Skill range based on game mode
      const skillRange = gameMode === 'quick' ? 1000 : 300

      // Find suitable opponent
      const { data: opponents } = await supabaseAdmin
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .eq('game_mode', gameMode)
        .gte('skill_level', skillLevel - skillRange)
        .lte('skill_level', skillLevel + skillRange)
        .order('created_at', { ascending: true })
        .limit(1)

      if (opponents && opponents.length > 0) {
        const opponent = opponents[0]

        // Create new game
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { data: newGame } = await supabaseAdmin
          .from('games')
          .insert({
            room_code: roomCode,
            player_x_id: userId,
            player_o_id: opponent.user_id,
            status: 'playing',
            game_mode: gameMode,
            base_points: gameMode === 'ranked' ? 50 : 25,
            multiplier: gameMode === 'ranked' ? 2.0 : 1.5,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (newGame) {
          // Remove both players from queue
          await supabaseAdmin
            .from('matchmaking_queue')
            .delete()
            .in('user_id', [userId, opponent.user_id])

          // Notify both players
          const userSocket = this.userSockets.get(userId)
          const opponentSocket = this.userSockets.get(opponent.user_id)

          if (userSocket) {
            userSocket.emit('match_found', { 
              roomCode, 
              gameId: newGame.id,
              opponent: opponent.user_id,
              symbol: 'X'
            })
          }

          if (opponentSocket) {
            opponentSocket.emit('match_found', { 
              roomCode, 
              gameId: newGame.id,
              opponent: userId,
              symbol: 'O'
            })
          }

          console.log(`🎮 Match created: ${userId} vs ${opponent.user_id} (${roomCode})`)
        }
      }
    } catch (error) {
      console.error('Find match error:', error)
    }
  }

  private checkWinner(board: (string | null)[][]): boolean {
    // Check for 4 in a row (horizontal, vertical, diagonal)
    const size = 6
    const winLength = 4

    // Check horizontal
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const first = board[row][col]
        if (first && 
            board[row][col + 1] === first &&
            board[row][col + 2] === first &&
            board[row][col + 3] === first) {
          return true
        }
      }
    }

    // Check vertical
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = 0; col < size; col++) {
        const first = board[row][col]
        if (first && 
            board[row + 1][col] === first &&
            board[row + 2][col] === first &&
            board[row + 3][col] === first) {
          return true
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const first = board[row][col]
        if (first && 
            board[row + 1][col + 1] === first &&
            board[row + 2][col + 2] === first &&
            board[row + 3][col + 3] === first) {
          return true
        }
      }
    }

    // Check diagonal (top-right to bottom-left)
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = winLength - 1; col < size; col++) {
        const first = board[row][col]
        if (first && 
            board[row + 1][col - 1] === first &&
            board[row + 2][col - 2] === first &&
            board[row + 3][col - 3] === first) {
          return true
        }
      }
    }

    return false
  }

  private calculateSkillLevel(totalPoints: number, gamesPlayed: number): number {
    if (gamesPlayed === 0) return 1000 // Default for new players
    
    const avgPointsPerGame = totalPoints / gamesPlayed
    return Math.floor(avgPointsPerGame * 10) + (gamesPlayed * 5)
  }

  private async updatePlayerStats(userId: string, won: boolean, pointsEarned: number): Promise<void> {
    const { data: user } = await supabaseAdmin
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
        : Math.max(user.multiplier_level - 0.05, 1.0)
    }

    await supabaseAdmin
      .from('users')
      .update(newStats)
      .eq('id', userId)
  }

  private async checkAndAwardAchievements(userId: string): Promise<void> {
    // This would call the achievement checking logic from supabase.ts
    // Implementation depends on your achievement system
  }

  private setupCleanupTasks(): void {
    // Clean up old matchmaking entries every 5 minutes
    setInterval(async () => {
      try {
        await supabaseAdmin
          .from('matchmaking_queue')
          .delete()
          .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // 10 minutes old
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }, 5 * 60 * 1000)

    // Clean up inactive game rooms every 15 minutes
    setInterval(() => {
      const now = Date.now()
      this.gameRooms.forEach((room, gameId) => {
        if (room.players.size === 0 && room.spectators.size === 0) {
          this.gameRooms.delete(gameId)
        }
      })
    }, 15 * 60 * 1000)
  }

  public getStats() {
    return {
      connectedUsers: this.userSockets.size,
      activeGames: this.gameRooms.size,
      totalRooms: this.gameRooms.size
    }
  }
}