'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Trophy, 
  Zap, 
  Users, 
  Crown, 
  Settings, 
  X, 
  Search, 
  RefreshCw, 
  Copy,
  User,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import PrivyAuth from '@/components/PrivyAuth'

// Mobile performance optimization utilities
const getMobileOptimizedTransition = (duration = 0.3) => ({
  duration: typeof window !== 'undefined' && window.innerWidth < 768 ? duration * 0.5 : duration,
  ease: "easeOut"
});

const getMobileOptimizedClasses = (defaultClasses: string, mobileClasses?: string) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile && mobileClasses) {
    return defaultClasses.replace(/backdrop-blur-md/g, '').replace(/backdrop-blur-sm/g, '') + ' ' + mobileClasses;
  }
  return defaultClasses;
};
import Leaderboard from '@/components/Leaderboard'
import PointsDisplay from '@/components/PointsDisplay'
import MultiplierInfo from '@/components/MultiplierInfo'
import SettingsModal from '@/components/SettingsModal'
import { createBotPlayer, getBotMove } from '@/lib/bot-player'
import { Player, GameState } from '@/types/game'

interface Game {
  id: string
  roomCode: string
  player1: Player
  player2?: Player
  currentPlayer: string
  board: string[]
  gameOver: boolean
  winner?: string | null
  moves: number
  multiplier: number
  streak: number
}

export default function Home() {
  // Authentication state
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  
  // Privy authentication state
  const [isPrivyAuthenticated, setIsPrivyAuthenticated] = useState(false)
  const [privyUserData, setPrivyUserData] = useState<any>(null)

  // Game state
  const [gameMode, setGameMode] = useState<'menu' | 'multiplayer' | 'singleplayer'>('menu')
  const [player, setPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [botPlayer, setBotPlayer] = useState<Player | null>(null)
  const [isBotGame, setIsBotGame] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [error, setError] = useState('')

  // Game state for 6x6 board
  const [gameState, setGameState] = useState<GameState>({
    board: Array(36).fill(null), // 6x6 = 36 cells
    currentPlayer: 'X',
    winner: null,
    gameOver: false,
    moves: 0,
    multiplier: 1.5, // Default multiplier mode
    streak: 0
  })

  // UI state
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showMultiplierInfo, setShowMultiplierInfo] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showUsernameSetup, setShowUsernameSetup] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [hasManuallyLoggedOut, setHasManuallyLoggedOut] = useState(false)
  const [showVictoryPopup, setShowVictoryPopup] = useState(false)
  const [victoryData, setVictoryData] = useState<{
    winner: string
    loser: string
    winnerProfile: Player
    loserProfile: Player
    multiplier: number
    moves: number
    pointsEarned: number
    isDraw: boolean
  } | null>(null)

  // Load player from localStorage
  useEffect(() => {
    const savedPlayer = localStorage.getItem('tictactoe-player')
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer))
    }
    // Load leaderboard on component mount
    updateLeaderboard()
  }, [])

  // Reset logout flag when wallet connects
  useEffect(() => {
    if (isConnected && hasManuallyLoggedOut) {
      console.log('🔗 Wallet connected after logout - resetting logout flag')
      setHasManuallyLoggedOut(false)
    }
  }, [isConnected, hasManuallyLoggedOut])

  // Auto-login if wallet is connected (but not if user manually logged out)
  useEffect(() => {
    if (isConnected && address && !player && !hasManuallyLoggedOut) {
      // Only auto-create if there's an existing saved player for this address
      const savedPlayer = localStorage.getItem('tictactoe-player')
      if (savedPlayer) {
        const parsedPlayer = JSON.parse(savedPlayer)
        if (parsedPlayer.walletAddress === address) {
          setPlayer(parsedPlayer)
          return
        }
      }
      // Do not auto-create new players - wait for explicit user action
    }
  }, [isConnected, address, player, hasManuallyLoggedOut])

  // Reset logout flag when wallet disconnects completely
  useEffect(() => {
    if (!isConnected && !address && hasManuallyLoggedOut) {
      // Only reset after a delay to ensure logout is complete
      const timer = setTimeout(() => {
        console.log('🔄 Wallet fully disconnected - resetting logout flag')
        setHasManuallyLoggedOut(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected, address, hasManuallyLoggedOut])

  // Removed problematic auto-login to prevent FC_undefined issues

  const createPlayer = async (name: string, privyData?: any) => {
    console.log('👤 Creating/loading player:', name, privyData)
    
    // Reset the manual logout flag when creating a player
    setHasManuallyLoggedOut(false)
    
    let newPlayer: Player
    const walletAddr = privyData?.wallet || address
    
    // If wallet is connected, try to load/create from leaderboard API first
    if (walletAddr) {
      try {
        // First, try to get existing player data from leaderboard
        const leaderboardResponse = await fetch('/api/leaderboard')
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json()
          if (leaderboardData.success && leaderboardData.leaderboard) {
            // Look for existing player by wallet address
            const existingPlayer = leaderboardData.leaderboard.find((p: any) => 
              p.wallet_address === walletAddr
            )
            
            if (existingPlayer) {
              // Use existing player data
              newPlayer = {
                id: existingPlayer.id,
                name: existingPlayer.display_name || existingPlayer.username || name,
                points: existingPlayer.total_points || 0,
                gamesPlayed: existingPlayer.games_played || 0,
                gamesWon: existingPlayer.games_won || 0,
                walletAddress: walletAddr,
                privyUserId: privyData?.id,
                privyProfile: privyData || null
              }
              setPlayer(newPlayer)
              localStorage.setItem('tictactoe-player', JSON.stringify(newPlayer))
              updateLeaderboard()
              console.log('✅ Existing player loaded from database:', newPlayer)
              return
            }
          }
        }
        
        // If no existing player found, create new one via leaderboard API
        const createResponse = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: walletAddr,
            name: name,
            username: name, // Save the chosen username
            points: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            winStreak: 0
          })
        })
        
        if (createResponse.ok) {
          const createData = await createResponse.json()
          if (createData.success && createData.player) {
            // Use player data from API
            newPlayer = {
              id: createData.player.id,
              name: createData.player.name || name,
              points: createData.player.points || 0,
              gamesPlayed: createData.player.gamesPlayed || 0,
              gamesWon: createData.player.gamesWon || 0,
              walletAddress: walletAddr,
              privyUserId: privyData?.id,
              privyProfile: privyData || null
            }
            setPlayer(newPlayer)
            localStorage.setItem('tictactoe-player', JSON.stringify(newPlayer))
            updateLeaderboard()
            console.log('✅ New player created in database:', newPlayer)
            return
          }
        }
      } catch (error) {
        console.warn('⚠️  API player creation failed, using localStorage fallback:', error)
      }
    }
    
    // Fallback to localStorage logic
    const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
    const existingPlayer = allSavedPlayers[name]
    
    if (existingPlayer) {
      // Restore existing player
      newPlayer = {
        ...existingPlayer,
        privyUserId: privyData?.id || existingPlayer.privyUserId,
        privyProfile: privyData || existingPlayer.privyProfile
      }
    } else {
      // Create new player
      newPlayer = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        walletAddress: walletAddr,
        privyUserId: privyData?.id,
        privyProfile: privyData || null
      }
      // Save to all players
      allSavedPlayers[name] = newPlayer
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))
    }
    
    setPlayer(newPlayer)
    localStorage.setItem('tictactoe-player', JSON.stringify(newPlayer))
    
    // Update leaderboard
    updateLeaderboard()
  }

  // Handle Privy authentication
  const handlePrivyAuthenticated = (userData: any) => {
    console.log('🔐 Privy authentication successful:', userData)
    
    // Don't proceed with authentication if user manually logged out
    if (hasManuallyLoggedOut) {
      console.log('🚫 Ignoring Privy authentication - user manually logged out')
      return
    }
    
    setIsPrivyAuthenticated(true)
    setPrivyUserData(userData)
    
    // Check if user has a saved username using multiple keys for reliability
    const walletAddr = userData.wallet
    const privyUserId = userData.id
    
    // Try multiple storage keys to find existing username
    let savedUsername = null
    
    if (walletAddr) {
      savedUsername = localStorage.getItem(`username-${walletAddr}`) || 
                     localStorage.getItem(`username-wallet-${walletAddr}`)
    }
    
    if (!savedUsername && privyUserId) {
      savedUsername = localStorage.getItem(`username-privy-${privyUserId}`)
    }
    
    // Also check if there's a player already created for this wallet/user
    if (!savedUsername) {
      const existingPlayer = localStorage.getItem('tictactoe-player')
      if (existingPlayer) {
        try {
          const parsedPlayer = JSON.parse(existingPlayer)
          if (parsedPlayer.walletAddress === walletAddr || parsedPlayer.privyUserId === privyUserId) {
            savedUsername = parsedPlayer.name
            // Save username to all relevant keys for future use
            if (walletAddr) {
              localStorage.setItem(`username-${walletAddr}`, savedUsername)
              localStorage.setItem(`username-wallet-${walletAddr}`, savedUsername)
            }
            if (privyUserId) {
              localStorage.setItem(`username-privy-${privyUserId}`, savedUsername)
            }
          }
        } catch (error) {
          console.warn('Error parsing existing player:', error)
        }
      }
    }
    
    console.log('🔍 Username check:', { walletAddr, privyUserId, savedUsername })
    
    if (savedUsername) {
      // Use saved username - no need to ask again
      console.log('✅ Found existing username:', savedUsername)
      createPlayer(savedUsername, userData)
    } else {
      // Show username setup for new users only
      console.log('🆕 New user - showing username setup')
      setShowUsernameSetup(true)
      setUsernameInput('')
      setUsernameError('')
    }
  }

  const handlePrivyLogout = () => {
    console.log('🚪 Privy logout initiated')
    setIsPrivyAuthenticated(false)
    setPrivyUserData(null)
    handleLogout()
  }

  // Username validation functions
  const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    const trimmed = username.trim()
    
    if (!trimmed) {
      return { isValid: false, error: 'Username cannot be empty' }
    }
    
    if (trimmed.length < 4) {
      return { isValid: false, error: 'Username must be at least 4 characters' }
    }
    
    if (trimmed.length > 20) {
      return { isValid: false, error: 'Username must be 20 characters or less' }
    }
    
    // Check for invalid characters
    const validPattern = /^[a-zA-Z0-9_@.-]+$/
    if (!validPattern.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, _, @, ., and -' }
    }
    
    return { isValid: true }
  }

  const checkUsernameAvailability = async (username: string): Promise<{ isAvailable: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase() // Case-insensitive check
    
    try {
      // Check API first
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.leaderboard) {
          const existingPlayer = data.leaderboard.find((p: any) => 
            (p.username || p.display_name || '').toLowerCase() === trimmed
          )
          if (existingPlayer) {
            return { isAvailable: false, error: 'Username is already taken' }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  API username check failed, checking localStorage:', error)
    }
    
    // Check localStorage as fallback
    const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
    const playerList = Object.values(allSavedPlayers) as Player[]
    
    const existingPlayer = playerList.find(p => p.name.toLowerCase() === trimmed)
    if (existingPlayer) {
      return { isAvailable: false, error: 'Username is already taken' }
    }
    
    // Check saved usernames
    const allKeys = Object.keys(localStorage)
    const usernameKeys = allKeys.filter(key => key.startsWith('username-'))
    
    for (const key of usernameKeys) {
      const savedUsername = localStorage.getItem(key)
      if (savedUsername && savedUsername.toLowerCase() === trimmed) {
        return { isAvailable: false, error: 'Username is already taken' }
      }
    }
    
    // Check username registry
    const usernameRegistry = JSON.parse(localStorage.getItem('username-registry') || '{}')
    if (usernameRegistry[trimmed]) {
      return { isAvailable: false, error: 'Username is already taken' }
    }
    
    return { isAvailable: true }
  }

  const handleUsernameInput = async (value: string) => {
    setUsernameInput(value)
    setUsernameError('')
    
    if (!value.trim()) {
      return
    }
    
    // Validate format first
    const validation = validateUsername(value)
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Invalid username')
      return
    }
    
    // Check availability with debouncing
    setIsCheckingUsername(true)
    
    // Simple debouncing
    setTimeout(async () => {
      const availability = await checkUsernameAvailability(value)
      if (!availability.isAvailable) {
        setUsernameError(availability.error || 'Username not available')
      }
      setIsCheckingUsername(false)
    }, 500)
  }

  const handleUsernameSetup = async () => {
    if (!usernameInput.trim() || !privyUserData) return
    
    setUsernameError('')
    setIsCheckingUsername(true)
    
    // Validate username
    const validation = validateUsername(usernameInput)
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Invalid username')
      setIsCheckingUsername(false)
      return
    }
    
    // Check availability
    const availability = await checkUsernameAvailability(usernameInput)
    if (!availability.isAvailable) {
      setUsernameError(availability.error || 'Username not available')
      setIsCheckingUsername(false)
      return
    }
    
    const walletAddr = privyUserData.wallet
    const privyUserId = privyUserData.id
    const trimmedUsername = usernameInput.trim()
    
    // Save username to multiple keys for reliability
    if (walletAddr) {
      localStorage.setItem(`username-${walletAddr}`, trimmedUsername)
      localStorage.setItem(`username-wallet-${walletAddr}`, trimmedUsername)
    }
    
    if (privyUserId) {
      localStorage.setItem(`username-privy-${privyUserId}`, trimmedUsername)
    }
    
    // Also save to a general username registry
    const usernameRegistry = JSON.parse(localStorage.getItem('username-registry') || '{}')
    usernameRegistry[trimmedUsername] = {
      walletAddr,
      privyUserId,
      timestamp: Date.now()
    }
    localStorage.setItem('username-registry', JSON.stringify(usernameRegistry))
    
    console.log('💾 Username saved to all keys:', { walletAddr, privyUserId, username: trimmedUsername })
    
    // Create player
    createPlayer(trimmedUsername, privyUserData)
    
    // Close modal
    setShowUsernameSetup(false)
    setUsernameInput('')
    setUsernameError('')
    setIsCheckingUsername(false)
    setUsernameError('')
    setIsCheckingUsername(false)
  }

  const handleSkipUsernameSetup = () => {
    if (!privyUserData) return
    
    // Use default name
    let defaultName = 'Anonymous Player'
    if (privyUserData.farcaster?.username) {
      defaultName = `@${privyUserData.farcaster.username}`
    } else if (privyUserData.email) {
      defaultName = privyUserData.email.split('@')[0]
    } else if (privyUserData.wallet) {
      defaultName = `Player_${privyUserData.wallet.slice(0, 6)}`
    }
    
    createPlayer(defaultName, privyUserData)
    setShowUsernameSetup(false)
    setUsernameInput('')
  }

  const handleGuestLogin = (name: string) => {
    console.log('🎮 Guest login initiated for:', name)
    setHasManuallyLoggedOut(false)
    createPlayer(name)
  }

  // Update player data and persist it
  const updatePlayerData = async (updatedPlayer: Player) => {
    console.log('💾 Updating player data:', updatedPlayer)
    
    // Update state first
    setPlayer(updatedPlayer)
    
    // Try to save to API first (if wallet connected)
    if (updatedPlayer.walletAddress) {
      try {
        const response = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: updatedPlayer.walletAddress,
            name: updatedPlayer.name,
            points: updatedPlayer.points,
            gamesPlayed: updatedPlayer.gamesPlayed,
            gamesWon: updatedPlayer.gamesWon,
            winStreak: 0 // You can track this if needed
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Player data saved to database via leaderboard API:', data)
          updateLeaderboard()
          return
        } else {
          const errorData = await response.json()
          console.warn('⚠️  Leaderboard API error:', errorData)
        }
      } catch (error) {
        console.warn('⚠️  API save failed, using localStorage fallback:', error)
      }
    }

    // Fallback to localStorage with error handling
    try {
      localStorage.setItem('tictactoe-player', JSON.stringify(updatedPlayer))
      
      // Also update in all players storage
      const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
      allSavedPlayers[updatedPlayer.name] = updatedPlayer
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))
      console.log('📋 All players updated:', allSavedPlayers)
      
      // Update leaderboard
      updateLeaderboard()
    } catch (error) {
      console.error('❌ Failed to save player data:', error)
    }
  }

  // Load and update leaderboard from API (with localStorage fallback)
  const updateLeaderboard = async () => {
    try {
      // Try to fetch from API first
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.leaderboard) {
          // Transform API data to match our Player interface
          const apiPlayers = data.leaderboard.map((entry: any) => ({
            id: entry.id,
            name: entry.username || entry.display_name || `Player_${entry.wallet_address.slice(-4)}`,
            points: entry.total_points,
            gamesPlayed: entry.games_played,
            gamesWon: entry.games_won,
            walletAddress: entry.wallet_address
          }))
          setLeaderboard(apiPlayers)
          return
        }
      }
    } catch (error) {
      console.warn('⚠️  API leaderboard failed, using localStorage fallback:', error)
    }

    // Fallback to localStorage if API fails
    const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
    const playerList = Object.values(allSavedPlayers) as Player[]
    // Sort by points (descending), then by win rate
    const sortedPlayers = playerList.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      const aWinRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0
      const bWinRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0
      return bWinRate - aWinRate
    })
    setLeaderboard(sortedPlayers)
  }

  // Logout function
  const handleLogout = () => {
    try {
      console.log('🚪 Starting logout process...')
      
      // Set manual logout flag first to prevent auto-login
      setHasManuallyLoggedOut(true)
      
      // Close username setup modal if open
      setShowUsernameSetup(false)
      setUsernameInput('')
      setUsernameError('')
      setIsCheckingUsername(false)
      
      // Clear Privy state
      setIsPrivyAuthenticated(false)
      setPrivyUserData(null)
      
      // Disconnect wallet
      if (isConnected) {
        disconnect()
      }
      
      // Clear player state
      setPlayer(null)
      
      // Clear localStorage
      localStorage.removeItem('tictactoe-player')
      
      // Reset game mode to menu
      setGameMode('menu')
      
      // Clear any active game
      setGame(null)
      setIsBotGame(false)
      setBotPlayer(null)
      
      // Reset UI states
      setShowLeaderboard(false)
      setShowMultiplierInfo(false)
      setShowSettings(false)
      setError('')
      
      console.log('✅ Logout completed successfully')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force logout even if there's an error
      setHasManuallyLoggedOut(true)
      setShowUsernameSetup(false)
      setPlayer(null)
      setGameMode('menu')
      setIsPrivyAuthenticated(false)
      setPrivyUserData(null)
      if (isConnected) {
        disconnect()
      }
    }
  }

  // Private room functions
  const createPrivateRoom = async (code: string) => {
    try {
      console.log('🚀 Creating private room with code:', code)
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1: player,
          roomCode: code,
          isPrivate: true
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create room')
      }
      
      const responseData = await response.json()
      console.log('✅ Room creation response:', responseData)
      
      if (responseData.success && responseData.game) {
        console.log('✅ Room creation response data:', responseData)
        console.log('✅ Game object:', responseData.game)
        console.log('✅ Board length:', responseData.game.board?.length)
        console.log('✅ Board content:', responseData.game.board)
        setGame(responseData.game)
        setGameMode('multiplayer')
        setError('')
        console.log('✅ Room created successfully:', responseData.game.roomCode)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('❌ Error creating private room:', err)
      setError('Failed to create room. Please try again.')
    }
  }

  const joinPrivateRoom = async (code: string) => {
    try {
      console.log('🔗 Joining private room with code:', code)
      const response = await fetch(`/api/games/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player2: player
        })
      })
      
      if (!response.ok) {
        throw new Error('Room not found or already full')
      }
      
      const responseData = await response.json()
      console.log('✅ Join room response:', responseData)
      
      if (responseData.success && responseData.game) {
        setGame(responseData.game)
        setGameMode('multiplayer')
        setError('')
        console.log('✅ Joined room successfully:', responseData.game.roomCode)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('❌ Error joining private room:', err)
      setError('Failed to join room. Check the code and try again.')
    }
  }

  // Single player game functions
  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return

    const newBoard = [...gameState.board]
    newBoard[index] = gameState.currentPlayer

    // Generate winning combinations for 6x6 board with 4-in-a-row
    const winningCombinations = []
    
    // Rows (6 rows, 3 possible 4-in-a-row per row)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col <= 2; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 1, start + 2, start + 3])
      }
    }
    
    // Columns (6 columns, 3 possible 4-in-a-row per column)
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row <= 2; row++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 6, start + 12, start + 18])
      }
    }
    
    // Diagonals (top-left to bottom-right)
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 2; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 7, start + 14, start + 21])
      }
    }
    
    // Diagonals (top-right to bottom-left)
    for (let row = 0; row <= 2; row++) {
      for (let col = 3; col < 6; col++) {
        const start = row * 6 + col
        winningCombinations.push([start, start + 5, start + 10, start + 15])
      }
    }

    let winner = null
    let gameOver = false
    const newMoves = gameState.moves + 1

    for (const [a, b, c, d] of winningCombinations) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c] && newBoard[a] === newBoard[d]) {
        winner = newBoard[a]
        gameOver = true
        console.log('🎯 Winner found:', winner, 'at positions:', [a, b, c, d])
        break
      }
    }

    if (!gameOver && newMoves === 36) {
      winner = 'Draw'
      gameOver = true
      console.log('🤝 Game ended in draw after 36 moves')
    }

    console.log('🎮 Game state:', { gameOver, winner, newMoves, currentPlayer: gameState.currentPlayer })

    // Calculate multiplier
    let multiplier = gameState.multiplier
    if (gameOver && winner && winner !== 'Draw') {
      // Speed bonus
      if (newMoves <= 5) multiplier += 2.0
      else if (newMoves <= 7) multiplier += 1.5
      else if (newMoves <= 9) multiplier += 1.0

      // Streak bonus
      if (gameState.streak > 0) multiplier += gameState.streak * 0.5
    }

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver,
      moves: newMoves,
      multiplier: gameOver ? multiplier : gameState.multiplier,
      streak: gameOver && winner && winner !== 'Draw' ? gameState.streak + 1 : 0
    })

    // Update player stats
    if (gameOver && winner && winner !== 'Draw' && player) {
      const pointsEarned = Math.floor(100 * multiplier)
      console.log('🏆 Player won! Awarding', pointsEarned, 'points to', player.name)
      const updatedPlayer = {
        ...player,
        points: player.points + pointsEarned,
        gamesPlayed: player.gamesPlayed + 1,
        gamesWon: player.gamesWon + 1
      }
      console.log('📊 Updated player:', updatedPlayer)
      updatePlayerData(updatedPlayer)
    } else if (gameOver && winner === 'Draw' && player) {
      console.log('🤝 Game ended in draw for', player.name)
      const updatedPlayer = {
        ...player,
        gamesPlayed: player.gamesPlayed + 1
      }
      updatePlayerData(updatedPlayer)
      
      // Show draw popup for single player
      setVictoryData({
        winner: 'Draw',
        loser: 'Draw',
        winnerProfile: player,
        loserProfile: player,
        multiplier: 1,
        moves: newMoves,
        pointsEarned: 0,
        isDraw: true
      })
      setShowVictoryPopup(true)
    }
  }

  const resetSingleGame = () => {
    setGameState({
      board: Array(36).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false,
      moves: 0,
      multiplier: 1.5,
      streak: gameState.streak
    })
  }

  // Multiplayer functions
  const createOnlineGame = async () => {
    if (!player) return

    setIsSearching(true)
    setError('')

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          playerName: player.name,
          walletAddress: player.walletAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        // Ensure the game has a properly initialized 6x6 board
        const gameWithBoard = {
          ...data.game,
          board: data.game.board && data.game.board.length === 36 ? data.game.board : Array(36).fill('')
        }
        
        // Immediately add bot player since we're removing the wait time
        const bot = createBotPlayer()
        setBotPlayer(bot)
        setIsBotGame(true)
        
        const gameWithBot = {
          ...gameWithBoard,
          player2: bot
        }
        
        setGame(gameWithBot)
        setGameMode('multiplayer')
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to create game')
    } finally {
      setIsSearching(false)
    }
  }

  const joinGame = async () => {
    if (!player || !roomCode.trim()) return

    setIsSearching(true)
    setError('')

    try {
      const response = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.trim(),
          playerId: player.id,
          playerName: player.name,
          walletAddress: player.walletAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        // Ensure the game has a properly initialized 6x6 board
        const gameWithBoard = {
          ...data.game,
          board: data.game.board && data.game.board.length === 36 ? data.game.board : Array(36).fill('')
        }
        setGame(gameWithBoard)
        setGameMode('multiplayer')
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to join game')
    } finally {
      setIsSearching(false)
    }
  }

  const createBotGame = () => {
    if (!player) return

    // Create a harder bot by default (expert or master level)
    const difficulties: ('expert' | 'master')[] = ['expert', 'master']
    const selectedDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
    const bot = createBotPlayer(selectedDifficulty)
    setBotPlayer(bot)
    setIsBotGame(true)
    
    const mockGame: Game = {
      id: Math.random().toString(36).substring(2, 15),
      roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      player1: player,
      player2: bot,
      currentPlayer: 'X',
      board: Array(36).fill(''),
      gameOver: false,
      moves: 0,
      multiplier: 1.5,
      streak: 0
    }
    
    setGame(mockGame)
    setGameMode('multiplayer')
  }

  const makeMove = async (position: number) => {
    if (!game || !player) return

    if (isBotGame) {
      // Handle bot game locally
      const newBoard = [...game.board]
      newBoard[position] = game.currentPlayer
      
      // Check for win - 6x6 board with 4-in-a-row
      const winningCombinations = []
      
      // Rows (6 rows, 3 possible 4-in-a-row per row)
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col <= 2; col++) {
          const start = row * 6 + col
          winningCombinations.push([start, start + 1, start + 2, start + 3])
        }
      }
      
      // Columns (6 columns, 3 possible 4-in-a-row per column)
      for (let col = 0; col < 6; col++) {
        for (let row = 0; row <= 2; row++) {
          const start = row * 6 + col
          winningCombinations.push([start, start + 6, start + 12, start + 18])
        }
      }
      
      // Diagonals (top-left to bottom-right)
      for (let row = 0; row <= 2; row++) {
        for (let col = 0; col <= 2; col++) {
          const start = row * 6 + col
          winningCombinations.push([start, start + 7, start + 14, start + 21])
        }
      }
      
      // Diagonals (top-right to bottom-left)
      for (let row = 0; row <= 2; row++) {
        for (let col = 3; col < 6; col++) {
          const start = row * 6 + col
          winningCombinations.push([start, start + 5, start + 10, start + 15])
        }
      }

      let winner = null
      let gameOver = false
      const newMoves = game.moves + 1

      for (const [a, b, c, d] of winningCombinations) {
        if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c] && newBoard[a] === newBoard[d]) {
          winner = newBoard[a]
          gameOver = true
          break
        }
      }

      if (!gameOver && newMoves === 36) {
        winner = 'Draw'
        gameOver = true
      }

      // Calculate multiplier
      let multiplier = game.multiplier
      if (gameOver && winner && winner !== 'Draw') {
        // Speed bonus
        if (newMoves <= 5) multiplier += 2.0
        else if (newMoves <= 7) multiplier += 1.5
        else if (newMoves <= 9) multiplier += 1.0

        // Streak bonus
        if (game.streak > 0) multiplier += game.streak * 0.5
      }

      const updatedGame = {
        ...game,
        board: newBoard,
        currentPlayer: game.currentPlayer === 'X' ? 'O' : 'X',
        moves: newMoves,
        winner,
        gameOver,
        multiplier: gameOver ? multiplier : game.multiplier,
        streak: gameOver && winner && winner !== 'Draw' ? game.streak + 1 : 0
      }

      setGame(updatedGame)

      // Update player stats when game ends and show victory popup regardless of winner
      if (gameOver && winner && winner !== 'Draw' && player && botPlayer) {
        const pointsEarned = Math.floor(100 * multiplier)
        const isPlayerWinner = (winner === 'X')
        
        const updatedPlayer = {
          ...player,
          points: isPlayerWinner ? player.points + pointsEarned : player.points,
          gamesPlayed: player.gamesPlayed + 1,
          gamesWon: isPlayerWinner ? player.gamesWon + 1 : player.gamesWon
        }
        updatePlayerData(updatedPlayer)
        
        // Show victory popup for both win and loss
        setVictoryData({
          winner: winner,
          loser: winner === 'X' ? 'O' : 'X',
          winnerProfile: winner === 'X' ? player : botPlayer,
          loserProfile: winner === 'X' ? botPlayer : player,
          multiplier: multiplier,
          moves: newMoves,
          pointsEarned: isPlayerWinner ? pointsEarned : 0,
          isDraw: false
        })
        setShowVictoryPopup(true)
      } else if (gameOver && winner === 'Draw' && player) {
        const updatedPlayer = {
          ...player,
          gamesPlayed: player.gamesPlayed + 1
        }
        updatePlayerData(updatedPlayer)
        
        // Show draw popup
        setVictoryData({
          winner: 'Draw',
          loser: 'Draw',
          winnerProfile: player,
          loserProfile: player,
          multiplier: 1,
          moves: newMoves,
          pointsEarned: 0,
          isDraw: true
        })
        setShowVictoryPopup(true)
      }

      // Bot makes move immediately
      if (!gameOver && updatedGame.currentPlayer === 'O') {
        const botMove = getBotMove({
          board: updatedGame.board,
          currentPlayer: updatedGame.currentPlayer,
          gameOver: updatedGame.gameOver,
          winner: updatedGame.winner,
          moves: updatedGame.moves
        }, 'O', botPlayer?.difficulty || 'medium')

        if (botMove !== -1) {
          // Make bot move immediately
          const botBoard = [...updatedGame.board]
          botBoard[botMove] = 'O'
          
          // Check for win again
          let botWinner = null
          let botGameOver = false
          const botMoves = updatedGame.moves + 1

          for (const [a, b, c, d] of winningCombinations) {
            if (botBoard[a] && botBoard[a] === botBoard[b] && botBoard[a] === botBoard[c] && botBoard[a] === botBoard[d]) {
              botWinner = botBoard[a]
              botGameOver = true
              break
            }
          }

          if (!botGameOver && botMoves === 36) {
            botWinner = 'Draw'
            botGameOver = true
          }

          // Calculate bot multiplier
          let botMultiplier = updatedGame.multiplier
          if (botGameOver && botWinner && botWinner !== 'Draw') {
            if (botMoves <= 5) botMultiplier += 2.0
            else if (botMoves <= 7) botMultiplier += 1.5
            else if (botMoves <= 9) botMultiplier += 1.0

            if (updatedGame.streak > 0) botMultiplier += updatedGame.streak * 0.5
          }

          const finalGame = {
            ...updatedGame,
            board: botBoard,
            currentPlayer: 'X',
            moves: botMoves,
            winner: botWinner,
            gameOver: botGameOver,
            multiplier: botGameOver ? botMultiplier : updatedGame.multiplier,
            streak: botGameOver && botWinner && botWinner !== 'Draw' ? updatedGame.streak + 1 : 0
          }

          setGame(finalGame)
          
          // Show victory popup when bot wins too
          if (botGameOver && botWinner && botWinner !== 'Draw' && player && botPlayer) {
            const isPlayerWinner = (botWinner === 'X')
            const pointsEarned = isPlayerWinner ? Math.floor(100 * botMultiplier) : 0
            
            // Update player stats for bot win
            const updatedPlayer = {
              ...player,
              points: isPlayerWinner ? player.points + pointsEarned : player.points,
              gamesPlayed: player.gamesPlayed + 1,
              gamesWon: isPlayerWinner ? player.gamesWon + 1 : player.gamesWon
            }
            updatePlayerData(updatedPlayer)
            
            // Show victory popup for both win and loss
            setVictoryData({
              winner: botWinner,
              loser: botWinner === 'X' ? 'O' : 'X',
              winnerProfile: botWinner === 'X' ? player : botPlayer,
              loserProfile: botWinner === 'X' ? botPlayer : player,
              multiplier: botMultiplier,
              moves: botMoves,
              pointsEarned: pointsEarned,
              isDraw: false
            })
            setShowVictoryPopup(true)
          }
        }
      }
    } else {
      // Handle online game
      try {
        const response = await fetch(`/api/games/${game.id}/moves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position,
            playerId: player.id,
            symbol: game.currentPlayer
          })
        })

        const data = await response.json()

        if (data.success) {
          setGame(data.game)
        } else {
          setError(data.error)
        }
      } catch (error) {
        setError('Failed to make move')
      }
    }
  }

  const resetMultiplayerGame = () => {
    if (isBotGame && botPlayer) {
      const newGame: Game = {
        id: Math.random().toString(36).substring(2, 15),
        roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        player1: player!,
        player2: botPlayer,
        currentPlayer: 'X',
        board: Array(36).fill(''),
        gameOver: false,
        moves: 0,
        multiplier: 1.5,
        streak: 0
      }
      setGame(newGame)
    } else {
      setGame(null)
      setGameMode('menu')
    }
  }

  const calculateMultiplier = (moves: number, streak: number) => {
    let multiplier = 1.5 // Base multiplier
    if (moves <= 5) multiplier += 2.0
    else if (moves <= 7) multiplier += 1.5
    else if (moves <= 9) multiplier += 1.0
    if (streak > 0) multiplier += streak * 0.5
    return multiplier
  }

  // If no player, show login (now with Privy integration)
  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full space-y-6"
        >
          <div className="text-center">
            <Crown className="w-16 h-16 text-brand mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-6">Basetok</h1>
          </div>

          {/* Only Privy Authentication with "Play" button */}
          <PrivyAuth 
            onAuthenticated={handlePrivyAuthenticated}
            onLogout={handlePrivyLogout}
          />

          {/* Username Setup Modal */}
          <AnimatePresence>
            {showUsernameSetup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-card/90 backdrop-blur-md border border-border rounded-xl p-6 w-full max-w-sm"
                >
                  <div className="text-center mb-4">
                    <User className="w-12 h-12 text-brand mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-foreground">Choose Your Username</h3>
                    <p className="text-sm text-muted-foreground mb-2">This will be displayed on the leaderboard</p>
                    <p className="text-xs text-muted-foreground">4-20 characters, letters, numbers, _, @, ., - only</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => handleUsernameInput(e.target.value)}
                        placeholder="Enter your username"
                        autoFocus
                        className={`w-full px-3 py-3 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                          usernameError 
                            ? 'border-red-500 focus:ring-red-500/50' 
                            : 'border-border focus:ring-brand'
                        }`}
                        maxLength={20}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !usernameError && !isCheckingUsername) {
                            handleUsernameSetup()
                          }
                        }}
                      />
                      {/* Username validation feedback */}
                      <div className="mt-2 min-h-[1.25rem]">
                        {isCheckingUsername && (
                          <div className="flex items-center space-x-1 text-xs text-yellow-500">
                            <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Checking availability...</span>
                          </div>
                        )}
                        {usernameError && !isCheckingUsername && (
                          <p className="text-xs text-red-500">{usernameError}</p>
                        )}
                        {!usernameError && !isCheckingUsername && usernameInput.trim() && (
                          <p className="text-xs text-green-500">Username is available!</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSkipUsernameSetup}
                        className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleUsernameSetup}
                        disabled={!usernameInput.trim() || !!usernameError || isCheckingUsername}
                        className="flex-1 bg-brand hover:bg-brand/90 disabled:bg-muted disabled:text-muted-foreground text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        {isCheckingUsername ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Checking</span>
                          </>
                        ) : (
                          <span>Save</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    )
  }

  // Main menu
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={getMobileOptimizedTransition(0.3)}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <h1 className="text-lg font-bold text-foreground">Basetok</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="p-2 bg-card hover:bg-accent rounded-lg transition-colors duration-200 border border-border"
                  title="Leaderboard"
                >
                  <Trophy className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setShowMultiplierInfo(true)}
                  className="p-2 bg-card hover:bg-accent rounded-lg transition-colors duration-200 border border-border"
                  title="Multipliers"
                >
                  <Zap className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 bg-card hover:bg-accent rounded-lg transition-colors duration-200 border border-border"
                >
                  <Settings className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Welcome, {player.name}!</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded transition-all duration-300"
                  >
                    Settings
                  </button>
                </div>
              </div>
              {/* Show authentication status */}
              {isPrivyAuthenticated && privyUserData && (
                <div className="flex items-center space-x-2 mt-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-400">Privy Connected</span>
                  {privyUserData.farcaster && (
                    <span className="text-xs text-purple-400">@{privyUserData.farcaster.username}</span>
                  )}
                </div>
              )}
              {player.walletAddress && (
                <div className="flex items-center space-x-2 mt-1">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">
                    {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </motion.header>

          {/* Player Stats */}
          <PointsDisplay
            player={player}
            currentMultiplier={calculateMultiplier(gameState.moves, gameState.streak)}
            streak={gameState.streak}
          />

          {/* Game Mode Selection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={getMobileOptimizedTransition(0.3)}
            className="space-y-4 mb-6"
          >
            <h2 className="text-lg font-semibold text-foreground text-center">Choose Game Mode</h2>
            
            <button
              onClick={() => setGameMode('multiplayer')}
              className={getMobileOptimizedClasses(
                "w-full bg-card/60 backdrop-blur-md hover:bg-card/80 border border-border text-foreground font-bold py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2",
                "bg-card/80"
              )}
            >
              <Users className="w-5 h-5" />
              <span>Random Multiplayer (6x6)</span>
            </button>
            
            <button
              onClick={() => setGameMode('singleplayer')}
              className={getMobileOptimizedClasses(
                "w-full bg-card/60 backdrop-blur-md hover:bg-card/80 border border-border text-foreground font-bold py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2",
                "bg-card/80"
              )}
            >
              <User className="w-5 h-5" />
              <span>Play with Friends (Code)</span>
            </button>
          </motion.div>

          {/* Removed Farcaster Actions - will add Privy social features later */}

          {/* Modals */}
          <AnimatePresence>
            {showLeaderboard && (
              <Leaderboard
                leaderboard={leaderboard}
                onClose={() => setShowLeaderboard(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showMultiplierInfo && (
              <MultiplierInfo
                onClose={() => setShowMultiplierInfo(false)}
                player={player}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSettings && (
              <SettingsModal
                onClose={() => setShowSettings(false)}
                player={player}
                onPlayerUpdate={(updatedPlayer) => {
                  setPlayer(updatedPlayer)
                  updateLeaderboard()
                }}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Single Player Mode - Friend Code
  if (gameMode === 'singleplayer') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <h1 className="text-lg font-bold text-foreground">Play with Friends</h1>
              </div>
              <button
                onClick={() => setGameMode('menu')}
                className="p-3 bg-card hover:bg-accent rounded-lg transition-all duration-200 border border-border flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
                <span className="text-sm font-medium text-foreground">Back</span>
              </button>
            </div>
          </motion.header>

          {/* Player Stats */}
          <PointsDisplay
            player={player}
            currentMultiplier={calculateMultiplier(gameState.moves, gameState.streak)}
            streak={gameState.streak}
          />

          {/* Friend Code Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-6"
          >
            <h2 className="text-lg font-semibold text-foreground text-center">Choose Option</h2>
            
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full bg-card/60 backdrop-blur-md hover:bg-card/80 border border-border text-foreground font-bold py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Create Room & Get Code</span>
            </button>
            
            <button
              onClick={() => setShowJoinRoom(true)}
              className="w-full bg-card/60 backdrop-blur-md hover:bg-card/80 border border-border text-foreground font-bold py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Join with Friend Code</span>
            </button>
          </motion.div>

          {/* Create Room Modal */}
          <AnimatePresence>
            {showCreateRoom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 w-full max-w-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Create Room</h3>
                    <button
                      onClick={() => setShowCreateRoom(false)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Your Room Code</p>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-bold text-foreground font-mono">
                          {friendCode || 'GAME' + Math.random().toString(36).substr(2, 4).toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            const code = 'GAME' + Math.random().toString(36).substr(2, 4).toUpperCase()
                            setFriendCode(code)
                            navigator.clipboard.writeText(code)
                          }}
                          className="p-1 hover:bg-accent rounded transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Create room logic here
                        const code = friendCode || 'GAME' + Math.random().toString(36).substr(2, 4).toUpperCase()
                        setFriendCode(code)
                        createPrivateRoom(code)
                        setShowCreateRoom(false)
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Create Room
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Room Modal */}
          <AnimatePresence>
            {showJoinRoom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 w-full max-w-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Join Room</h3>
                    <button
                      onClick={() => setShowJoinRoom(false)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Enter Friend's Room Code
                      </label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="GAMEXXXX"
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-lg"
                        maxLength={8}
                      />
                    </div>
                    
                    {error && (
                      <p className="text-destructive text-sm text-center">{error}</p>
                    )}
                    
                    <button
                      onClick={() => {
                        if (joinCode.length >= 4) {
                          joinPrivateRoom(joinCode)
                          setShowJoinRoom(false)
                        } else {
                          setError('Please enter a valid room code')
                        }
                      }}
                      disabled={!joinCode}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Join Room
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }


  // Multiplayer game
  if (gameMode === 'multiplayer' && game) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h1 className="text-lg font-bold text-foreground">
                {isBotGame ? 'Bot Game' : 'Multiplayer Game'}
              </h1>
            </div>
            <button
              onClick={() => setGameMode('menu')}
              className="p-3 bg-card hover:bg-accent rounded-lg transition-all duration-200 border border-border flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">Back</span>
            </button>
          </div>

          {/* Room Code Container */}
          <div className="mb-4 flex justify-center">
            <div className="w-[380px] h-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-between p-4 shadow-lg">
              <div className="flex items-center space-x-4">
                <Users className="w-6 h-6 text-brand" />
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Room Code</p>
                  <p className="text-xl font-bold text-foreground">{game.roomCode}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">Players</p>
                  <p className="text-sm font-bold text-foreground">{game.player2 ? '2/2' : '1/2'}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(game.roomCode)}
                  className="p-3 bg-card hover:bg-accent rounded-lg transition-colors border border-border"
                >
                  <Copy className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Player Stats Containers */}
          <div className="mb-4 flex justify-center">
            <div className="w-[380px] flex gap-2">
              {/* Player 1 Card */}
              <div className="w-1/2 h-auto rounded-xl p-3 shadow-lg relative overflow-hidden flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500">
                  <span className="text-white font-bold text-sm">X</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-cyan-500 font-medium">Player 1</p>
                  <p className="text-sm font-bold text-foreground truncate">{game.player1.name}</p>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="w-1/2 h-auto rounded-xl p-3 shadow-lg relative overflow-hidden flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10">
                {game.player2 ? (
                  <>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-500">
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-pink-500 font-medium">Player 2</p>
                      <p className="text-sm font-bold text-foreground truncate">{game.player2.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <div className="text-center">
                      <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <p className="text-xs text-pink-500 font-medium">Waiting...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Board - 6x6 */}
          <div className="mb-4 flex justify-center">
            <div 
              className="grid mx-auto bg-black/20 p-2 rounded-xl border border-white/30"
              style={{
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: '4px',
                width: '380px',
                height: '380px'
              }}
            >
              {game.board.map((cell, index) => (
                <motion.button
                  key={index}
                  onClick={() => makeMove(index)}
                  disabled={!!cell || game.gameOver || (!isBotGame && !game.player2)}
                  className={getMobileOptimizedClasses(
                    `relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-2xl font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed aspect-square hover:bg-white/20 ${
                      cell ? 'pixel-reveal pixel-grid-effect' : ''
                    }`,
                    "bg-white/15"
                  )}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { duration: 0.05 }
                  }}
                >
                  {cell === 'X' && (
                    <motion.div
                      initial={{ 
                        opacity: 0,
                        scale: 0.8
                      }}
                      animate={{ 
                        opacity: 1,
                        scale: 1
                      }}
                      transition={getMobileOptimizedTransition(0.15)}
                      className="w-12 h-12 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 relative">
                        <Image
                          src="/b.png"
                          alt="X"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </motion.div>
                  )}
                  {cell === 'O' && (
                    <motion.div
                      initial={{ 
                        opacity: 0,
                        scale: 0.8
                      }}
                      animate={{ 
                        opacity: 1,
                        scale: 1
                      }}
                      transition={getMobileOptimizedTransition(0.15)}
                      className="w-12 h-12 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 relative">
                        <Image
                          src="/cb.png"
                          alt="O"
                          fill
                          className="object-contain rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center mb-4">
            {game.gameOver ? (
              <div className="text-lg font-bold">
                {game.winner === 'Draw' ? (
                  <span className="text-yellow-400">It&apos;s a Draw!</span>
                ) : (
                  <span className="text-green-400">
                    {game.winner} Wins! 🎉
                  </span>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Current Player: <span className={`font-bold ${game.currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
                    {game.currentPlayer}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Multiplier Info */}
          {game.multiplier > 1 && (
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">Multiplier: {game.multiplier}x</span>
              </div>
            </div>
          )}

          {/* Victory Popup */}
          <AnimatePresence>
            {showVictoryPopup && victoryData && (
              <VictoryPopup
                victoryData={victoryData}
                currentPlayer={player}
                onClose={() => {
                  setShowVictoryPopup(false)
                  setVictoryData(null)
                  // Auto-restart game after victory
                  setTimeout(() => {
                    resetMultiplayerGame()
                  }, 500)
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Multiplayer menu
  if (gameMode === 'multiplayer') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6">
          {/* Back Button */}
          <div className="flex justify-start">
            <button
              onClick={() => setGameMode('menu')}
              className="p-3 bg-card hover:bg-accent rounded-lg transition-all duration-200 border border-border flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">Back</span>
            </button>
          </div>
          
          <div className="text-center">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Multiplayer</h1>
            <p className="text-muted-foreground">Play with friends or find opponents!</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createOnlineGame}
              disabled={isSearching}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Match</span>
                </>
              )}
            </button>

            <div className="text-center text-muted-foreground">or</div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    joinGame()
                  }
                }}
              />
              <button
                onClick={joinGame}
                disabled={isSearching || !roomCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                {isSearching ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setGameMode('menu')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }


  return null
}

// Victory Popup Component
function VictoryPopup({ 
  victoryData, 
  currentPlayer, 
  onClose 
}: { 
  victoryData: {
    winner: string
    loser: string
    winnerProfile: Player
    loserProfile: Player
    multiplier: number
    moves: number
    pointsEarned: number
    isDraw: boolean
  }
  currentPlayer: Player | null
  onClose: () => void 
}) {
  // Removed useProfile - will replace with Privy
  const isInMiniApp = false // We'll handle Mini App detection differently
  const isWinner = !victoryData.isDraw && currentPlayer?.id === victoryData.winnerProfile.id
  
  const getBackgroundImage = () => {
    if (victoryData.isDraw) return 'url(/draw-bg.png)'
    return isWinner ? 'url(/victory-bg.png)' : 'url(/defeat-bg.png)'
  }

  const getTitle = () => {
    if (victoryData.isDraw) return 'IT&apos;S A DRAW'
    return isWinner ? 'VICTORY!' : 'DEFEAT'
  }

  const getTitleColor = () => {
    if (victoryData.isDraw) return 'text-gray-200'
    return isWinner ? 'text-yellow-300' : 'text-red-400'
  }

  // Detect mobile device for optimized animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isMobile ? 0.2 : 0.3 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ 
          duration: isMobile ? 0.2 : 0.3,
          ease: "easeOut"
        }}
        className="relative w-full max-w-md h-[600px] bg-cover bg-center rounded-2xl shadow-2xl overflow-hidden border-2 border-white/10"
        style={{ backgroundImage: getBackgroundImage() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
          <h1 
            className={`text-5xl font-black mb-4 tracking-tighter text-center ${getTitleColor()}`}
            style={{ textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
          >
            {getTitle()}
          </h1>

          {/* Player Profiles */}
          <div className="flex items-center justify-around mb-4">
            <PlayerAvatar player={victoryData.winnerProfile} isWinner={!victoryData.isDraw} />
            <div className="text-2xl font-black text-gray-400 px-2">VS</div>
            <PlayerAvatar player={victoryData.loserProfile} isWinner={false} />
          </div>

          {!victoryData.isDraw && (
            <p className="text-center text-lg font-semibold mb-4">
              <span className="font-bold text-yellow-300">{victoryData.winnerProfile.name}</span> defeated <span className="opacity-80">{victoryData.loserProfile.name}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-3xl font-bold">{victoryData.multiplier}x</div>
              <div className="text-sm opacity-75">Multiplier</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-3xl font-bold">
                {isWinner ? `+${victoryData.pointsEarned}` : '0'}
              </div>
              <div className="text-sm opacity-75">Points Earned</div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Removed Farcaster Share - will add Privy social sharing later */}
            
            <button
              onClick={onClose}
              className="w-full py-4 bg-white/90 hover:bg-white text-black rounded-xl font-bold text-lg transition-colors duration-200 shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PlayerAvatar({ player, isWinner }: { player: Player, isWinner: boolean }) {
  const avatarUrl = player.farcasterProfile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.id}`
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <img 
          src={avatarUrl} 
          alt={player.name} 
          className={`w-24 h-24 rounded-full object-cover border-4 ${isWinner ? 'border-yellow-400' : 'border-gray-500'}`}
        />
        {isWinner && (
          <div className="absolute -top-2 -right-2 text-3xl animate-pulse">
            👑
          </div>
        )}
      </div>
      <p className="mt-2 font-bold text-sm w-28 truncate">{player.name}</p>
    </div>
  )
}