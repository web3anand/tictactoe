// Test database connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }

    console.log('✅ Database connection successful!')
    
    // Test leaderboard view
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(5)

    if (leaderboardError) {
      console.error('❌ Leaderboard query failed:', leaderboardError)
      return false
    }

    console.log('✅ Leaderboard query successful!')
    console.log('📊 Current leaderboard entries:', leaderboard?.length || 0)
    
    if (leaderboard && leaderboard.length > 0) {
      console.log('🏆 Top player:', leaderboard[0])
    } else {
      console.log('📝 No players in leaderboard yet')
    }

    // Check if we now have users in the database from the app
    console.log('\n🔍 Checking for users in database...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (usersError) {
      console.error('❌ Users query failed:', usersError)
    } else {
      console.log('👥 Users in database:', users?.length || 0)
      if (users && users.length > 0) {
        users.forEach((user, i) => {
          console.log(`  ${i + 1}. ${user.display_name} (${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}) - ${user.total_points} points`)
        })
      }
    }

    // Test game creation specifically
    console.log('\n🎮 Testing game creation...')
    if (users && users.length > 0) {
      const testUser = users[0]
      
      // Try to create a game with just basic fields
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          room_code: 'TEST123',
          player_x_id: testUser.id,
          status: 'waiting',
          game_mode: 'quick',
          base_points: 25,
          multiplier: 1.5
        })
        .select()
        .single()

      if (gameError) {
        console.error('❌ Game creation failed:', gameError)
        
        // Let's check what columns exist in the games table
        console.log('\n🔍 Checking games table structure...')
        const { data: gameStructure, error: structureError } = await supabase
          .from('games')
          .select()
          .limit(1)
        
        if (structureError) {
          console.log('Game table structure check failed:', structureError.message)
        }
        
        return false
      } else {
        console.log('✅ Game creation successful:', gameData.room_code)
        
        // Clean up test game
        await supabase
          .from('games')
          .delete()
          .eq('id', gameData.id)
        
        console.log('🧹 Test game cleaned up')
      }
    }

    // Test user upsert (should work or handle duplicates)
    console.log('\n🧪 Testing user creation with duplicate handling...')
    const testUser = {
      wallet_address: '0x1234567890123456789012345678901234567890',
      username: 'test_user_2',
      display_name: 'Test User 2',
      total_points: 200,
      games_played: 10,
      games_won: 6,
      win_streak: 3,
      max_win_streak: 4,
      multiplier_level: 1.5,
      last_active: new Date().toISOString()
    }
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'wallet_address' })
      .select()
      .single()

    if (createError) {
      console.error('❌ User upsert failed:', createError)
      return false
    }

    console.log('✅ User upsert successful:', newUser.display_name)
    
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}testConnection()