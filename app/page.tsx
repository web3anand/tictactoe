'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Trophy, 
  Zap, 
  Users, 
  Crown, 
  Settings, 
  Copy, 
  X, 
  Search, 
  RefreshCw, 
  User,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import PrivyAuth from '@/components/PrivyAuth'

// New pixel art avatar generation system - BLACK & WHITE ONLY
const generatePixelArtAvatar = (seed: string, size: number = 128): string => {
  // Remove timestamp for consistent avatars, use only black and white, zoomed out a bit
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=000000&primaryColor=ffffff&size=${size}&radius=0&scale=100&randomizeIds=false`
}

// Utility function to get profile picture - NEW METHOD
const getProfilePicture = (player: Player): string => {
  // Priority: Farcaster avatar > Generated pixel art avatar
  if (player.farcasterProfile?.avatar) {
    return player.farcasterProfile.avatar
  }
  
  // Use new pixel art generation
  const seed = player.walletAddress || player.name || player.id
  return generatePixelArtAvatar(seed, 128)
}

// Mobile performance optimization utilities
const getMobileOptimizedTransition = (duration = 0.3) => ({
  duration: typeof window !== 'undefined' && window.innerWidth < 768 ? duration * 0.5 : duration,
  ease: "easeOut"
});

const getMobileOptimizedClasses = (defaultClasses: string, mobileClasses?: string) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) {
    // Remove expensive effects on mobile for better performance
    const optimized = defaultClasses
      .replace(/backdrop-blur-md/g, '')
      .replace(/backdrop-blur-sm/g, '')
      .replace(/shadow-2xl/g, 'shadow-lg')
      .replace(/shadow-xl/g, 'shadow-md');
    return optimized + (mobileClasses ? ' ' + mobileClasses : '');
  }
  return defaultClasses;
};
import Leaderboard from '@/components/Leaderboard'
import PointsDisplay from '@/components/PointsDisplay'
import MultiplierInfo from '@/components/MultiplierInfo'
import SettingsModal from '@/components/SettingsModal'
import { createBotPlayer, getBotMove, getTotalBots } from '@/lib/bot-player'
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
  const [gameMode, setGameMode] = useState<'menu' | 'multiplayer' | 'singleplayer' | 'friend'>('menu')
  const [player, setPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [botPlayer, setBotPlayer] = useState<Player | null>(null)
  const [isBotGame, setIsBotGame] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [matchmakingCountdown, setMatchmakingCountdown] = useState(0)
  const [roomCode, setRoomCode] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [currentBotIndex, setCurrentBotIndex] = useState(0) // Track which bot we're playing against
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

  // Turn timer state
  const [turnTimeLeft, setTurnTimeLeft] = useState(5)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<'X' | 'O' | null>(null)
  const [consecutiveMissedTurns, setConsecutiveMissedTurns] = useState(0)
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null)

  // UI state
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showMultiplierInfo, setShowMultiplierInfo] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showUsernameSetup, setShowUsernameSetup] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hasManuallyLoggedOut, setHasManuallyLoggedOut] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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

  // Mobile touch optimization
  useEffect(() => {
    // Disable zoom on double tap for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now()
      if (now - (window as any).lastTouchEnd <= 300) {
        e.preventDefault()
      }
      ;(window as any).lastTouchEnd = now
    }
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Helper function to randomly determine starting player
  const getRandomStartingPlayer = (): 'X' | 'O' => {
    return Math.random() < 0.5 ? 'X' : 'O'
  }

  // Helper function to trigger bot move
  const triggerBotMove = (currentGame: Game) => {
    if (!currentGame || currentGame.gameOver || !botPlayer) {
      return
    }

    // Determine which symbol the bot is using and if it's the bot's turn
    const botSymbol = currentGame.player1.id.startsWith('bot_') ? 'X' : 'O'
    const isCurrentlyBotTurn = currentGame.currentPlayer === botSymbol

    if (!isCurrentlyBotTurn) {
      return
    }

    const randomDelay = Math.random() * 2000 + 1500 // Random delay between 1.5-3.5 seconds (more human-like)
    
    setTimeout(() => {
      // Check if game state is still valid
      if (!game || game.gameOver || game.currentPlayer !== botSymbol) {
        return
      }

      const botMove = getBotMove({
        board: game.board,
        currentPlayer: game.currentPlayer,
        gameOver: game.gameOver,
        winner: game.winner,
        moves: game.moves
      }, botSymbol, botPlayer?.difficulty || 'human')

      if (botMove !== -1) {
        // Directly call makeMove function instead of clicking buttons
        makeMove(botMove, true)
      }
    }, randomDelay)
  }

  // Load player from localStorage
  useEffect(() => {
    const savedPlayer = localStorage.getItem('tictactoe-player')
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer))
    }
    // Load leaderboard on component mount
    updateLeaderboard()
    // Initialize bots in leaderboard
    initializeBotsInLeaderboard()
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

  const createPlayer = useCallback(async (name: string, privyData?: any) => {
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
              const walletAvatar = walletAddr ? generatePixelArtAvatar(walletAddr, 128) : undefined
              newPlayer = {
                id: existingPlayer.id,
                name: existingPlayer.display_name || existingPlayer.username || name,
                points: existingPlayer.total_points || 0,
                gamesPlayed: existingPlayer.games_played || 0,
                gamesWon: existingPlayer.games_won || 0,
                walletAddress: walletAddr,
                walletAvatar,
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
            const walletAvatar = walletAddr ? generatePixelArtAvatar(walletAddr, 128) : undefined
            newPlayer = {
              id: createData.player.id,
              name: createData.player.name || name,
              points: createData.player.points || 0,
              gamesPlayed: createData.player.gamesPlayed || 0,
              gamesWon: createData.player.gamesWon || 0,
              walletAddress: walletAddr,
              walletAvatar,
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
      const walletAvatar = walletAddr ? generatePixelArtAvatar(walletAddr, 128) : undefined
      newPlayer = {
        ...existingPlayer,
        walletAvatar: walletAvatar || existingPlayer.walletAvatar,
        privyUserId: privyData?.id || existingPlayer.privyUserId,
        privyProfile: privyData || existingPlayer.privyProfile
      }
    } else {
      // Create new player
      const walletAvatar = walletAddr ? generatePixelArtAvatar(walletAddr, 128) : undefined
      newPlayer = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        walletAddress: walletAddr,
        walletAvatar,
        privyUserId: privyData?.id,
        privyProfile: privyData || null
      }
      // Save to all players
      allSavedPlayers[name] = newPlayer
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))
    }
    
    setPlayer(newPlayer)
    localStorage.setItem('tictactoe-player', JSON.stringify(newPlayer))
    
    // Update leaderboard (call the function directly instead of reference)
    // updateLeaderboard will be called later in useEffect
  }, [address])

  // Handle Privy authentication - memoized to prevent infinite loops
  const handlePrivyAuthenticated = useCallback((userData: any) => {
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
  }, [hasManuallyLoggedOut, createPlayer])

  const handlePrivyLogout = () => {
    console.log('🚪 Privy logout initiated from main page')
    
    // Set flag to prevent auto-login immediately
    setHasManuallyLoggedOut(true)
    
    // Call main logout handler which will handle all cleanup
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

  const handleUsernameInput = (value: string) => {
    // Always update the input immediately for better UX
    setUsernameInput(value)
    setUsernameError(null)
    
    if (!value.trim()) {
      setIsCheckingUsername(false)
      // Clear any previous timeout
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current)
        usernameTimeoutRef.current = null
      }
      return
    }
    
    // Validate format first
    const validation = validateUsername(value)
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Invalid username')
      setIsCheckingUsername(false)
      return
    }
    
    // Check availability with improved debouncing
    setIsCheckingUsername(true)
    
    // Clear any previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current)
    }
    
    // Set new timeout for availability check
    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const availability = await checkUsernameAvailability(value)
        if (!availability.isAvailable) {
          setUsernameError(availability.error || 'Username not available')
        }
      } catch (error) {
        console.error('Username check error:', error)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 300)
  }

  const handleUsernameSetup = async () => {
    // Username is mandatory - show error if empty
    if (!usernameInput.trim()) {
      setUsernameError('Username is required')
      setIsCheckingUsername(false)
      return
    }
    
    if (!privyUserData) {
      setUsernameError('Authentication data missing')
      setIsCheckingUsername(false)
      return
    }
    
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
    setUsernameError(null)
    setIsCheckingUsername(false)
    setUsernameError('')
    setIsCheckingUsername(false)
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

  // Update bot in leaderboard
  const updateBotInLeaderboard = async (updatedBot: any) => {
    console.log('🤖 Updating bot data in leaderboard:', updatedBot)
    
    try {
      // Try to save bot to API leaderboard
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: updatedBot.walletAddress || `bot_${updatedBot.name.toLowerCase()}`,
          name: updatedBot.name,
          points: updatedBot.points,
          gamesPlayed: updatedBot.gamesPlayed,
          gamesWon: updatedBot.gamesWon,
          winStreak: 0
        })
      })
      
      if (response.ok) {
        console.log('✅ Bot data saved to leaderboard API')
        updateLeaderboard()
        return
      }
    } catch (error) {
      console.warn('⚠️  Bot API save failed, using localStorage fallback:', error)
    }

    // Fallback to localStorage
    try {
      const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
      allSavedPlayers[updatedBot.name] = {
        id: updatedBot.id,
        name: updatedBot.name,
        points: updatedBot.points,
        gamesPlayed: updatedBot.gamesPlayed,
        gamesWon: updatedBot.gamesWon,
        walletAddress: updatedBot.walletAddress || `bot_${updatedBot.name.toLowerCase()}`
      }
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))
      console.log('🤖 Bot added to leaderboard:', updatedBot.name)
      
      // Update leaderboard display
      updateLeaderboard()
    } catch (error) {
      console.error('❌ Failed to save bot data:', error)
    }
  }

  // Initialize bots in leaderboard with their starting stats
  const initializeBotsInLeaderboard = async () => {
    console.log('🤖 Initializing bots in leaderboard...')
    
    try {
      const totalBots = getTotalBots()
      const allSavedPlayers = JSON.parse(localStorage.getItem('tictactoe-all-players') || '{}')
      
      // Create each bot and add to leaderboard if not already present
      for (let i = 0; i < totalBots; i++) {
        const bot = createBotPlayer(i)
        
        // Check if bot already exists in leaderboard
        if (!allSavedPlayers[bot.name]) {
          // Add bot to localStorage leaderboard
          allSavedPlayers[bot.name] = {
            id: bot.id,
            name: bot.name,
            points: bot.points,
            gamesPlayed: bot.gamesPlayed,
            gamesWon: bot.gamesWon,
            walletAddress: bot.walletAddress
          }
          
          console.log(`🤖 Added ${bot.name} to leaderboard with ${bot.points} points`)
        }
      }
      
      // Save updated player list
      localStorage.setItem('tictactoe-all-players', JSON.stringify(allSavedPlayers))
      
      // Update leaderboard display
      updateLeaderboard()
    } catch (error) {
      console.error('❌ Failed to initialize bots in leaderboard:', error)
    }
  }

  // Logout function
  const handleLogout = () => {
    // Prevent multiple simultaneous logout attempts
    if (isLoggingOut) {
      console.log('🚫 Logout already in progress, skipping...')
      return
    }
    
    setIsLoggingOut(true)
    
    try {
      console.log('🚪 Starting logout process...')
      
      // Set manual logout flag first to prevent auto-login
      setHasManuallyLoggedOut(true)
      
      // Clear any pending username validation immediately
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current)
        usernameTimeoutRef.current = null
      }
      
      // Close username setup modal if open
      setShowUsernameSetup(false)
      setUsernameInput('')
      setUsernameError(null)
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
    } finally {
      // Reset logout flag regardless of success or error
      setIsLoggingOut(false)
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

    // Reset bot index for new game session
    setCurrentBotIndex(0)
    setIsSearching(true)
    setError('')
    
    // Add a small natural delay before matchmaking (0.5-1.5 seconds)
    const matchmakingDelay = Math.random() * 1000 + 500
    
    setTimeout(async () => {
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
        
        setGame(gameWithBoard)
        setGameMode('multiplayer')
        
        // Immediately add a bot instead of waiting
        const bot = createBotPlayer(currentBotIndex)
        setBotPlayer(bot)
        setIsBotGame(true)
        setIsSearching(false)
        
        setGame(currentGame => ({
          ...gameWithBoard,
          player2: bot,
          board: gameWithBoard.board?.length === 36 ? gameWithBoard.board : Array(36).fill('')
        }))
        
      } else {
        // If API fails, create a bot game as fallback
        const bot = createBotPlayer(currentBotIndex)
        setBotPlayer(bot)
        setIsBotGame(true)
        setIsSearching(false)
        
        const randomStartingPlayer = getRandomStartingPlayer()
        const randomSides = Math.random() < 0.5
        
        const mockGame: Game = {
          id: Math.random().toString(36).substring(2, 15),
          roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          player1: randomSides ? player : bot,
          player2: randomSides ? bot : player,
          currentPlayer: randomStartingPlayer,
          board: Array(36).fill(''),
          gameOver: false,
          moves: 0,
          multiplier: 1.5,
          streak: 0
        }
        
        setGame(mockGame)
        setGameMode('multiplayer')
      }
    } catch (error) {
      // If there's an error, create a bot game as fallback
      const bot = createBotPlayer(currentBotIndex)
      setBotPlayer(bot)
      setIsBotGame(true)
      
      const randomStartingPlayer = getRandomStartingPlayer()
      const randomSides = Math.random() < 0.5
      
      const mockGame: Game = {
        id: Math.random().toString(36).substring(2, 15),
        roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        player1: randomSides ? player : bot,
        player2: randomSides ? bot : player,
        currentPlayer: randomStartingPlayer,
        board: Array(36).fill(''),
        gameOver: false,
        moves: 0,
        multiplier: 1.5,
        streak: 0
      }
      
      setGame(mockGame)
      setGameMode('multiplayer')
    } finally {
      setIsSearching(false)
    }
    }, matchmakingDelay)
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

    // Create a specific bot based on current index
    const bot = createBotPlayer(currentBotIndex)
    setBotPlayer(bot)
    setIsBotGame(true)
    
    const randomStartingPlayer = getRandomStartingPlayer()
    const randomSides = Math.random() < 0.5 // Random side assignment
    
    const mockGame: Game = {
      id: Math.random().toString(36).substring(2, 15),
      roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      player1: randomSides ? player : bot, // Randomly assign who is X
      player2: randomSides ? bot : player, // Randomly assign who is O
      currentPlayer: randomStartingPlayer,
      board: Array(36).fill(''),
      gameOver: false,
      moves: 0,
      multiplier: 1.5,
      streak: 0
    }
    
    setGame(mockGame)
    setGameMode('multiplayer')
  }

  // Turn timer functions
  const startTurnTimer = (currentPlayer: 'X' | 'O') => {
    // Clear any existing timer
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current)
    }
    
    setCurrentTurnPlayer(currentPlayer)
    setTurnTimeLeft(5)
    setIsTimerActive(true)
    
    turnTimerRef.current = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Switch to next player
          handleTimeUp()
          return 5
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTurnTimer = () => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current)
      turnTimerRef.current = null
    }
    setIsTimerActive(false)
    setCurrentTurnPlayer(null)
  }

  const handleTimeUp = () => {
    if (!game) return
    
    // Increment missed turns counter
    const newMissedTurns = consecutiveMissedTurns + 1
    setConsecutiveMissedTurns(newMissedTurns)
    
    // If both players have missed 2 turns each (4 total), end the game as a draw
    if (newMissedTurns >= 4) {
      // Stop timer and end game
      stopTurnTimer()
      
      // Set game as over with a draw
      setGame(prevGame => prevGame ? { 
        ...prevGame, 
        gameOver: true,
        winner: 'Draw'
      } : null)
      
      // Reset missed turns
      setConsecutiveMissedTurns(0)
      return
    }
    
    // Stop the current timer
    stopTurnTimer()
    
    // Switch to the next player
    const nextPlayer = game.currentPlayer === 'X' ? 'O' : 'X'
    setGame(prevGame => prevGame ? { ...prevGame, currentPlayer: nextPlayer } : null)
    
    // Check if next player is bot
    const isNextPlayerBot = isBotGame && (
      (nextPlayer === 'X' && game.player1.id.startsWith('bot_')) ||
      (nextPlayer === 'O' && game.player2?.id.startsWith('bot_'))
    )
    
    if (isNextPlayerBot && !game.gameOver) {
      // Trigger bot move after a short delay to allow state to update
      setTimeout(() => {
        if (game && !game.gameOver) {
          triggerBotMove(game)
        }
      }, 500)
    } else {
      // Start timer for next player (human vs human or human player in bot game)
      setTimeout(() => {
        if (game && !game.gameOver) {
          startTurnTimer(nextPlayer)
        }
      }, 100)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current)
      }
    }
  }, [])

  // Start timer when game starts or current player changes
  useEffect(() => {
    if (game && !game.gameOver && gameMode === 'multiplayer') {
      // Reset missed turns when starting a new game or round
      setConsecutiveMissedTurns(0)
      
      // Determine if current player is the bot
      const isBotTurn = isBotGame && (
        (game.currentPlayer === 'X' && game.player1.id.startsWith('bot_')) ||
        (game.currentPlayer === 'O' && game.player2?.id.startsWith('bot_'))
      )
      
      if (isBotTurn) {
        triggerBotMove(game)
      } else {
        // Start timer for human players
        startTurnTimer(game.currentPlayer as 'X' | 'O')
      }
    } else {
      stopTurnTimer()
    }
  }, [game?.currentPlayer, game?.gameOver, gameMode])

  // Mobile-optimized move handler
  const handleCellInteraction = (position: number) => {
    console.log('🎮 Cell interaction attempted at position:', position)
    
    // Check if the cell is already occupied or game is over
    if (!game || game.board[position] || game.gameOver) {
      console.log('❌ Move blocked: cell occupied or game over')
      return
    }
    
    // Check if it's the player's turn
    if (!isBotGame && !game.player2) {
      console.log('❌ Move blocked: waiting for player 2')
      return
    }
    
    // Turn enforcement for multiplayer
    if (!isBotGame && player && (
      (player.id === game.player1.id && game.currentPlayer !== 'X') || 
      (game.player2 && player.id === game.player2.id && game.currentPlayer !== 'O')
    )) {
      console.log('❌ Move blocked: not your turn')
      return
    }
    
    console.log('✅ Making move at position:', position)
    // Make the move
    makeMove(position)
  }

  const makeMove = async (position: number, isBotMove: boolean = false) => {
    if (!game || !player) return

    // Enforce turn-based play: Only allow the current player to move
    const isMyTurn = (player.id === game.player1.id && game.currentPlayer === 'X') || 
                     (game.player2 && player.id === game.player2.id && game.currentPlayer === 'O')
    
    // For bot moves, skip the turn validation
    if (!isBotMove && !isMyTurn) {
      return
    }

    // Stop the timer when a move is made
    stopTurnTimer()
    
    // Reset missed turns counter since a player made a move
    setConsecutiveMissedTurns(0)

    if (isBotGame) {
      // Handle bot game locally
      const newBoard = [...game.board]
      newBoard[position] = game.currentPlayer
      
      // Check for win - 6x6 board with 4-in-a-row
      const winningCombinations: number[][] = []
      
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
        
        // Determine which symbol the human player is using
        const humanPlayerSymbol = game.player1.id === player.id ? 'X' : 'O'
        const isPlayerWinner = (winner === humanPlayerSymbol)
        
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
          winnerProfile: isPlayerWinner ? player : botPlayer,
          loserProfile: isPlayerWinner ? botPlayer : player,
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

      // Bot logic disabled to prevent double moves - now handled by triggerBotMove
      if (false && !isBotMove && !gameOver && isBotGame) {
        // Determine if current player is bot
        const currentPlayerIsBot = (
          (updatedGame.currentPlayer === 'X' && updatedGame.player1.id.startsWith('bot_')) ||
          (updatedGame.currentPlayer === 'O' && updatedGame.player2?.id.startsWith('bot_'))
        )
        
        if (currentPlayerIsBot) {
          const botSymbol = updatedGame.currentPlayer
          const randomDelay = Math.random() * 3000 // Random delay between 0-3 seconds
          
          setTimeout(() => {
            const botMove = getBotMove({
              board: updatedGame.board,
              currentPlayer: updatedGame.currentPlayer,
              gameOver: updatedGame.gameOver,
              winner: updatedGame.winner,
              moves: updatedGame.moves
            }, botSymbol, botPlayer?.difficulty || 'human')

            if (botMove !== -1) {
              // Make bot move after delay
              const botBoard = [...updatedGame.board]
              botBoard[botMove] = botSymbol
          
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
            // Determine which symbol the human player is using
            const humanPlayerSymbol = finalGame.player1.id === player.id ? 'X' : 'O'
            const botPlayerSymbol = humanPlayerSymbol === 'X' ? 'O' : 'X'
            const isPlayerWinner = (botWinner === humanPlayerSymbol)
            const isBotWinner = (botWinner === botPlayerSymbol)
            const pointsEarned = isPlayerWinner ? Math.floor(100 * botMultiplier) : 0
            const botPointsEarned = isBotWinner ? Math.floor(100 * botMultiplier) : 0
            
            // Update player stats for bot win
            const updatedPlayer = {
              ...player,
              points: isPlayerWinner ? player.points + pointsEarned : player.points,
              gamesPlayed: player.gamesPlayed + 1,
              gamesWon: isPlayerWinner ? player.gamesWon + 1 : player.gamesWon
            }
            updatePlayerData(updatedPlayer)
            
            // Update bot stats in leaderboard
            if (botPlayer) {
              const updatedBot = {
                ...botPlayer,
                points: isBotWinner ? botPlayer.points + botPointsEarned : botPlayer.points,
                gamesPlayed: botPlayer.gamesPlayed + 1,
                gamesWon: isBotWinner ? botPlayer.gamesWon + 1 : botPlayer.gamesWon
              }
              
              // Update bot in leaderboard
              updateBotInLeaderboard(updatedBot)
            }
            
            // Show victory popup for both win and loss
            setVictoryData({
              winner: botWinner,
              loser: botWinner === 'X' ? 'O' : 'X',
              winnerProfile: isPlayerWinner ? player : botPlayer,
              loserProfile: isPlayerWinner ? botPlayer : player,
              multiplier: botMultiplier,
              moves: botMoves,
              pointsEarned: pointsEarned,
              isDraw: false
            })
            setShowVictoryPopup(true)
          }
        } // Close the if (botMove !== -1) block
        }, randomDelay) // Close setTimeout with delay
        } // Close the if (currentPlayerIsBot) block
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
    if (isBotGame && player) {
      // Cycle to next bot for the next round
      const nextBotIndex = (currentBotIndex + 1) % getTotalBots()
      setCurrentBotIndex(nextBotIndex)
      
      // Create the next bot
      const nextBot = createBotPlayer(nextBotIndex)
      setBotPlayer(nextBot)
      
      const randomStartingPlayer = getRandomStartingPlayer()
      const randomSides = Math.random() < 0.5
      
      const newGame: Game = {
        id: Math.random().toString(36).substring(2, 15),
        roomCode: 'BOT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        player1: randomSides ? player : nextBot,
        player2: randomSides ? nextBot : player,
        currentPlayer: randomStartingPlayer,
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Image
                src="/B T.svg"
                alt="Basetok Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Basetok</h1>
            <p className="text-gray-400">Your onchain gaming experience</p>
          </div>

          <div className="space-y-4">
            {/* Privy Authentication */}
            <PrivyAuth 
              onAuthenticated={handlePrivyAuthenticated}
              onLogout={handlePrivyLogout}
            />
          </div>

          {/* Username Setup Modal */}
          <AnimatePresence>
            {showUsernameSetup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="max-w-md w-full space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Image
                        src="/B T.svg"
                        alt="Basetok Logo"
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Choose Username</h3>
                    <p className="text-gray-400 mb-2">Required for leaderboard</p>
                    <p className="text-sm text-gray-500">4-20 characters, letters, numbers, _, @, ., - only</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => handleUsernameInput(e.target.value)}
                        placeholder="Enter your username"
                        autoFocus
                        required
                        className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                          usernameError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        maxLength={20}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !usernameError && !isCheckingUsername) {
                            handleUsernameSetup()
                          }
                        }}
                      />
                      {/* Username validation feedback */}
                      <div className="mt-3 min-h-[1.5rem]">
                        {isCheckingUsername && (
                          <div className="flex items-center space-x-2 text-sm text-blue-400">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Checking availability...</span>
                          </div>
                        )}
                        {usernameError && !isCheckingUsername && (
                          <p className="text-sm text-red-400">{usernameError}</p>
                        )}
                        {!usernameError && !isCheckingUsername && usernameInput.trim() && (
                          <p className="text-sm text-green-400">Username is available!</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleUsernameSetup}
                      disabled={!usernameInput.trim() || !!usernameError || isCheckingUsername}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isCheckingUsername ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Checking</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Main menu
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 p-4 relative">
        <div className="max-w-md mx-auto pt-16">
          {/* Header */}
          <header className="absolute top-0 left-0 right-0 z-10 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src="/B T.svg"
                    alt="Basetok Logo"
                    width={44}
                    height={44}
                    className="w-11 h-11 drop-shadow-lg"
                  />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Basetok</h1>
              </div>
            </div>
          </header>

          {/* Player Profile */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-700">
                  <Image
                    src={getProfilePicture(player)}
                    alt={`${player.name}'s avatar`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const seed = player.walletAddress || player.name || player.id
                      e.currentTarget.src = generatePixelArtAvatar(seed, 48)
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Welcome, {player.name}!</h2>
                {player.walletAddress && (
                  <div className="flex items-center space-x-1.5 text-gray-400">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">
                      {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <PointsDisplay
            player={player}
            currentMultiplier={calculateMultiplier(gameState.moves, gameState.streak)}
            streak={gameState.streak}
          />

          {/* Game Mode Selection */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white text-center mb-4">Choose Game Mode</h2>
            
            <button
              onClick={createOnlineGame}
              disabled={isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span className="text-base">Random Multiplayer</span>
                </>
              )}
            </button>
          </div>

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
                onLogout={handlePrivyLogout}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-xl border-t border-gray-600/50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 via-gray-800/20 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>
          <div className="max-w-md mx-auto relative">
            <div className="grid grid-cols-3 relative">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="p-3 flex flex-col items-center justify-center space-y-1 hover:bg-gradient-to-t hover:from-blue-500/20 hover:to-blue-400/5 transition-all duration-500 group relative overflow-hidden active:scale-95"
                title="Leaderboard"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 group-hover:from-blue-500/10 to-transparent transition-all duration-500"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <Trophy className="w-5 h-5 text-gray-300 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-lg" />
                <span className="text-xs font-semibold text-gray-300 group-hover:text-blue-400 transition-all duration-500 relative z-10">Board</span>
              </button>
              <button
                onClick={() => setShowMultiplierInfo(true)}
                className="p-3 flex flex-col items-center justify-center space-y-1 hover:bg-gradient-to-t hover:from-yellow-500/20 hover:to-yellow-400/5 transition-all duration-500 group relative overflow-hidden active:scale-95"
                title="Multipliers"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/0 group-hover:from-yellow-500/10 to-transparent transition-all duration-500"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <Zap className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-lg" />
                <span className="text-xs font-semibold text-gray-300 group-hover:text-yellow-400 transition-all duration-500 relative z-10">Perks</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 flex flex-col items-center justify-center space-y-1 hover:bg-gradient-to-t hover:from-purple-500/20 hover:to-purple-400/5 transition-all duration-500 group relative overflow-hidden active:scale-95"
                title="Settings"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 group-hover:from-purple-500/10 to-transparent transition-all duration-500"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <Settings className="w-5 h-5 text-gray-300 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-lg" />
                <span className="text-xs font-semibold text-gray-300 group-hover:text-purple-400 transition-all duration-500 relative z-10">More</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Matchmaking screen
  if (gameMode === 'multiplayer' && isSearching && !game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background with BASE.png */}
        <div className="absolute inset-0 bg-black">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/BASE.png"
              alt="BASE"
              width={300}
              height={300}
              className="opacity-20"
            />
          </motion.div>
          
          {/* Flicker overlay effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"
            animate={{
              opacity: [0, 0.3, 0, 0.5, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-8 max-w-sm mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h1 className="text-lg font-bold text-white">Matchmaking</h1>
            </div>
            <button
              onClick={() => {
                setGameMode('menu')
                setIsSearching(false)
                setMatchmakingCountdown(0)
              }}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">Back</span>
            </button>
          </div>

          {/* Logo with animation */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <Image
              src="/BASE.png"
              alt="BASE"
              width={100}
              height={100}
              className="mx-auto filter drop-shadow-2xl"
            />
          </motion.div>

          {/* Matchmaking text */}
          <div className="space-y-4">
            <motion.h2
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl font-bold text-white"
            >
              Finding Player...
            </motion.h2>
            
            {/* Search Message */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-2xl font-bold text-blue-400"
            >
              Finding Opponent
            </motion.div>
            
            <p className="text-gray-400 text-base">
              Setting up your match...
            </p>
          </div>

          {/* Loading animation */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-blue-500 rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Search Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="w-8 h-8 text-blue-500" />
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
                Multiplayer Game
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

          {/* Player Stats Containers */}
          <div className="mb-4 flex justify-center">
            <div className="w-[380px] flex gap-2">
              {/* Player 1 Card */}
              <div className={`w-1/2 h-auto rounded-xl p-3 shadow-lg relative overflow-hidden flex items-center space-x-3 bg-white/5 backdrop-blur-md border transition-all duration-300 ${
                game.currentPlayer === 'X' && !game.gameOver && !isBotGame
                  ? 'border-cyan-400 shadow-cyan-400/20' 
                  : 'border-white/10'
              }`}>
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500">
                  <Image
                    src={getProfilePicture(game.player1)}
                    alt={`${game.player1.name}'s avatar`}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-foreground truncate">{game.player1.name}</p>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      game.currentPlayer === 'X' && !game.gameOver && !isBotGame
                        ? 'bg-cyan-400 animate-pulse' 
                        : 'bg-cyan-500'
                    }`}>
                      <span className="text-white font-bold text-xs">X</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className={`w-1/2 h-auto rounded-xl p-3 shadow-lg relative overflow-hidden flex items-center space-x-3 bg-white/5 backdrop-blur-md border transition-all duration-300 ${
                game.currentPlayer === 'O' && !game.gameOver && !isBotGame && game.player2
                  ? 'border-pink-400 shadow-pink-400/20' 
                  : 'border-white/10'
              }`}>
                {game.player2 ? (
                  <>
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-pink-500">
                      <Image
                        src={getProfilePicture(game.player2)}
                        alt={`${game.player2.name}'s avatar`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-foreground truncate">
                          {game.player2.name}
                        </p>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          game.currentPlayer === 'O' && !game.gameOver && !isBotGame
                            ? 'bg-pink-400 animate-pulse' 
                            : 'bg-pink-500'
                        }`}>
                          <span className="text-white font-bold text-xs">O</span>
                        </div>
                      </div>
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

          {/* Turn Timer Display */}
          {isTimerActive && !game.gameOver && gameMode === 'multiplayer' && (
            <div className="mb-4 flex justify-center px-4">
              <div className="relative">
                {/* Compact timer container */}
                <div className={`relative bg-gradient-to-r from-black/50 via-black/30 to-black/20 backdrop-blur-xl border border-white/25 rounded-2xl px-6 py-3 flex items-center space-x-4 shadow-2xl transition-all duration-300 ${
                  currentTurnPlayer === 'X' 
                    ? 'shadow-cyan-500/25 border-cyan-400/30' 
                    : 'shadow-pink-500/25 border-pink-400/30'
                } ${
                  turnTimeLeft <= 2 ? 'animate-pulse scale-105' : 'hover:scale-105'
                }`}>
                  
                  {/* Player info - more compact */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      currentTurnPlayer === 'X' ? 'bg-cyan-400' : 'bg-pink-400'
                    }`} />
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${
                        currentTurnPlayer === 'X' ? 'text-cyan-100' : 'text-pink-100'
                      }`}>
                        {currentTurnPlayer === 'X' ? game.player1.name : game.player2?.name || 'Player 2'}
                      </span>
                      <span className="text-xs text-white/50 font-medium">Your Turn</span>
                    </div>
                  </div>

                  {/* Compact circular timer */}
                  <div className="relative">
                    {/* Background circle - smaller */}
                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-white/10"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ease-linear ${
                          turnTimeLeft <= 2 
                            ? 'text-red-400' 
                            : turnTimeLeft <= 3
                            ? 'text-yellow-400'
                            : currentTurnPlayer === 'X' ? 'text-cyan-400' : 'text-pink-400'
                        }`}
                        strokeDasharray="100.53"
                        strokeDashoffset={100.53 - (100.53 * turnTimeLeft / 5)}
                      />
                    </svg>
                    
                    {/* Timer number - smaller */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`text-lg font-bold transition-all duration-300 drop-shadow-lg ${
                        turnTimeLeft <= 2 
                          ? 'text-red-400 animate-bounce drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' 
                          : turnTimeLeft <= 3
                          ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                          : currentTurnPlayer === 'X' 
                          ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' 
                          : 'text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,0.6)]'
                      }`}>
                        {turnTimeLeft}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Turn Indicator (when timer is not active) */}
          {!isTimerActive && gameMode === 'multiplayer' && game && !game.gameOver && 
           (game.player2 || isBotGame) && (
            <div className="mb-4 flex justify-center px-4">
              <div className="relative">
                {/* Compact turn indicator container */}
                <div className={`relative bg-gradient-to-r from-black/50 via-black/30 to-black/20 backdrop-blur-xl border border-white/25 rounded-2xl px-6 py-3 flex items-center space-x-3 shadow-lg transition-all duration-300 hover:scale-105 ${
                  game.currentPlayer === 'X' 
                    ? 'border-cyan-400/30 shadow-cyan-500/20' 
                    : 'border-pink-400/30 shadow-pink-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    game.currentPlayer === 'X' ? 'bg-cyan-400' : 'bg-pink-400'
                  }`} />
                  <span className={`text-sm font-semibold ${
                    game.currentPlayer === 'X' ? 'text-cyan-100' : 'text-pink-100'
                  }`}>
                    {game.currentPlayer === 'X' ? game.player1.name : (game.player2?.name || 'Player 2')}'s Turn
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                    game.currentPlayer === 'X' ? 'bg-cyan-500' : 'bg-pink-500'
                  }`}>
                    {game.currentPlayer}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Board - 6x6 */}
          <div className="mb-4 flex justify-center">
            <div
              className="grid mx-auto bg-black/20 p-2 rounded-xl border border-white/30 select-none"
              style={{
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: '4px',
                width: '380px',
                height: '380px',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none',
                pointerEvents: 'auto'
              }}
              onTouchStart={(e) => {
                console.log('🎯 Grid container touch start')
                e.stopPropagation()
              }}
            >
              {game.board.map((cell, index) => (
                <motion.button
                  key={index}
                  data-position={index}
                  onClick={(e) => {
                    console.log('🖱️ Click event on cell', index)
                    e.preventDefault()
                    e.stopPropagation()
                    handleCellInteraction(index)
                  }}
                  onTouchStart={(e) => {
                    console.log('👆 Touch start on cell', index)
                    e.preventDefault()
                    e.stopPropagation()
                    // Use setTimeout to ensure state is ready
                    setTimeout(() => {
                      handleCellInteraction(index)
                    }, 10)
                  }}
                  onTouchEnd={(e) => {
                    console.log('👆 Touch end on cell', index)
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  disabled={!!cell || game.gameOver || (!isBotGame && !game.player2) || 
                    // Turn enforcement: disable if it's not the current player's turn
                    (!isBotGame && player && (
                      (player.id === game.player1.id && game.currentPlayer !== 'X') || 
                      (game.player2 && player.id === game.player2.id && game.currentPlayer !== 'O')
                    ))
                  }
                  className={getMobileOptimizedClasses(
                    `relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-2xl font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed aspect-square hover:bg-white/20 touch-manipulation select-none ${
                      cell ? 'pixel-reveal pixel-grid-effect' : ''
                    }`,
                    "bg-white/15"
                  )}
                  style={{
                    minHeight: '58px',
                    minWidth: '58px',
                    height: '58px',
                    width: '58px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    msUserSelect: 'none',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    fontSize: '24px'
                  }}
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
              <div className="text-sm text-muted-foreground">
                {/* Game in progress - could show current player indicator here if needed */}
              </div>
            )}
          </div>

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
              disabled={ isSearching}
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

// Helper function to copy victory card as image
const copyVictoryCardAsImage = async (cardId: string) => {
  try {
    const element = document.getElementById(cardId)
    if (!element) {
      console.error('Victory card element not found')
      return false
    }

    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Create a canvas to draw the element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get canvas context')
      return false
    }

    // Set canvas size
    canvas.width = 400
    canvas.height = 500
    
    // Get the background image from the element
    const bgImage = window.getComputedStyle(element).backgroundImage
    const imageUrl = bgImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1]
    
    if (imageUrl) {
      // Load and draw the background image
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      
      return new Promise<boolean>((resolve) => {
        img.onload = async () => {
          // Draw background image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Add overlay gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
          gradient.addColorStop(0, 'rgba(0,0,0,0)')
          gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)')
          gradient.addColorStop(1, 'rgba(0,0,0,0.9)')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Add border
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 4
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

          // Add title
          ctx.fillStyle = '#fbbf24'
          ctx.font = 'bold 32px Arial'
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 10
          
          const titleText = element.querySelector('h1')?.textContent || 'GAME COMPLETE'
          ctx.fillText(titleText, canvas.width / 2, 80)
          
          // Add subtitle
          ctx.fillStyle = '#ffffff'
          ctx.font = '16px Arial'
          ctx.shadowBlur = 5
          const subtitleText = element.querySelector('p')?.textContent || 'Thanks for playing!'
          ctx.fillText(subtitleText, canvas.width / 2, 120)
          
          // Add game info
          ctx.fillStyle = '#e5e7eb'
          ctx.font = '14px Arial'
          ctx.fillText('Tic Tac Toe Victory Card', canvas.width / 2, canvas.height - 30)

          // Convert to blob and try clipboard
          canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
              console.error('Failed to create image blob')
              resolve(false)
              return
            }

            // Try different clipboard methods based on browser support
            let success = false
            
            // Method 1: Modern Clipboard API (works on desktop and some mobile browsers)
            if (navigator.clipboard && window.ClipboardItem && !isMobile) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({
                    'image/png': blob
                  })
                ])
                console.log('Victory card copied to clipboard!')
                success = true
              } catch (error) {
                console.log('Modern clipboard API failed, trying fallback...', error)
              }
            }
            
            // Method 2: Mobile-friendly approach - create a shareable link
            if (!success && isMobile) {
              try {
                // Check if Web Share API is available (mobile browsers)
                if (navigator.share) {
                  const file = new File([blob], 'victory-card.png', { type: 'image/png' })
                  await navigator.share({
                    title: 'Tic Tac Toe Victory Card',
                    text: 'Check out my victory!',
                    files: [file]
                  })
                  success = true
                  console.log('Victory card shared successfully!')
                } else {
                  // Fallback: download for mobile
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'victory-card.png'
                  a.style.display = 'none'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  success = true
                  console.log('Victory card downloaded!')
                }
              } catch (error) {
                console.log('Mobile share failed, downloading...', error)
              }
            }
            
            // Method 3: Final fallback - download
            if (!success) {
              try {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'victory-card.png'
                a.style.display = 'none'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                success = true
                console.log('Victory card downloaded as fallback!')
              } catch (error) {
                console.error('All methods failed:', error)
              }
            }
            
            resolve(success)
          }, 'image/png', 1.0)
        }
        
        img.onerror = () => {
          console.error('Failed to load background image')
          resolve(false)
        }
        
        img.src = imageUrl
      })
    } else {
      // Fallback without background image
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const titleText = element.querySelector('h1')?.textContent || 'GAME COMPLETE'
      ctx.fillStyle = '#fbbf24'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(titleText, canvas.width / 2, 80)
      
      return new Promise<boolean>((resolve) => {
        canvas.toBlob(async (blob: Blob | null) => {
          if (!blob) {
            resolve(false)
            return
          }
          
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          
          if (isMobile && navigator.share) {
            try {
              const file = new File([blob], 'victory-card.png', { type: 'image/png' })
              await navigator.share({
                title: 'Tic Tac Toe Victory Card',
                files: [file]
              })
              resolve(true)
              return
            } catch (error) {
              console.log('Share failed, downloading...', error)
            }
          }
          
          try {
            if (navigator.clipboard && window.ClipboardItem && !isMobile) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
            } else {
              throw new Error('Clipboard not available, downloading')
            }
            resolve(true)
          } catch (error) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'victory-card.png'
            a.click()
            URL.revokeObjectURL(url)
            resolve(true)
          }
        }, 'image/png', 1.0)
      })
    }
  } catch (error) {
    console.error('Error capturing victory card:', error)
    return false
  }
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
  const [isCopying, setIsCopying] = useState(false)
  
  // Handle copy victory card as image
  const handleCopyAsImage = async () => {
    setIsCopying(true)
    try {
      const success = await copyVictoryCardAsImage('victory-popup')
      if (success) {
        console.log('Victory card copied/shared successfully!')
        // Show success feedback (could add a toast here)
      } else {
        console.log('Failed to copy/share victory card')
      }
    } catch (error) {
      console.error('Failed to copy/share victory card:', error)
    } finally {
      setIsCopying(false)
    }
  }
  
  // Removed useProfile - will replace with Privy
  const isInMiniApp = false // We'll handle Mini App detection differently
  const isWinner = !victoryData.isDraw && currentPlayer?.id === victoryData.winnerProfile.id
  
  const getBackgroundImage = () => {
    if (victoryData.isDraw) return 'url(/draw-bg.png)'
    return isWinner ? 'url(/victory-bg.png)' : 'url(/defeat-bg.png)'
  }

  const getTitle = () => {
    if (victoryData.isDraw) return "IT'S A DRAW"
    return isWinner ? '🎉 CONGRATULATIONS! 🎉' : '💔 YOU LOST 💔'
  }

  const getTitleColor = () => {
    if (victoryData.isDraw) return 'text-gray-200'
    return isWinner ? 'text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.5)]' : 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]'
  }

  const getCardBorderColor = () => {
    if (victoryData.isDraw) return 'border-gray-400/50'
    return isWinner ? 'border-yellow-400/70 shadow-yellow-400/30' : 'border-red-400/70 shadow-red-400/30'
  }

  const getSubtitle = () => {
    if (victoryData.isDraw) return "Better luck next time!"
    return isWinner ? "Outstanding performance!" : "Don't give up, try again!"
  }

  const getSubtitleColor = () => {
    if (victoryData.isDraw) return 'text-gray-300'
    return isWinner ? 'text-yellow-200' : 'text-red-200'
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
        id="victory-popup"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ 
          duration: isMobile ? 0.2 : 0.3,
          ease: "easeOut"
        }}
        className={`relative w-full max-w-sm h-[500px] bg-cover bg-center rounded-2xl shadow-2xl overflow-hidden border-2 ${getCardBorderColor()}`}
        style={{ backgroundImage: getBackgroundImage() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end h-full p-5 text-white">
          <h1 
            className={`text-3xl font-black mb-2 tracking-tighter text-center ${getTitleColor()}`}
            style={{ textShadow: '0 4px 10px rgba(0,0,0,0.7)' }}
          >
            {getTitle()}
          </h1>

          <p className={`text-sm font-semibold text-center mb-4 ${getSubtitleColor()}`}>
            {getSubtitle()}
          </p>

          {/* Player Profiles - More Compact */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <PlayerAvatar player={victoryData.winnerProfile} isWinner={!victoryData.isDraw} />
            <div className="text-xl font-black text-gray-400">VS</div>
            <PlayerAvatar player={victoryData.loserProfile} isWinner={false} />
          </div>

          {!victoryData.isDraw && (
            <p className="text-center text-base font-semibold mb-4 leading-tight">
              {isWinner ? (
                <>You defeated <span className="opacity-75">{victoryData.loserProfile.name}</span>!</>
              ) : (
                <><span className="font-bold text-yellow-300">{victoryData.winnerProfile.name}</span> defeated you!</>
              )}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCopyAsImage}
              disabled={isCopying}
              className="w-full py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {isCopying ? 'Processing...' : (
                typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                  ? 'Share Image' 
                  : 'Copy as Image'
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold text-base transition-all duration-200 shadow-lg"
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
  const seed = player.walletAddress || player.name || player.id
  const avatarUrl = player.farcasterProfile?.avatar || generatePixelArtAvatar(seed, 96)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <img 
          src={avatarUrl} 
          alt={player.name} 
          className={`w-20 h-20 rounded-lg object-cover border-3 transition-all duration-200 ${
            isWinner 
              ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' 
              : 'border-gray-500 opacity-75'
          }`}
        />
        {isWinner && (
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 animate-pulse" />
        )}
      </div>
      <p className="mt-2 font-bold text-xs w-20 truncate">{player.name}</p>
    </div>
  )
}