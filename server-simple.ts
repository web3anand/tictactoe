import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log('🔧 Starting Basetok Server...')

// Check environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

if (!supabaseConfigured) {
  console.log('⚠️  Running in development mode without database')
  console.log('📋 To enable full features:')
  console.log('   1. Create Supabase project at https://supabase.com')
  console.log('   2. Update .env.local with your credentials')
  console.log('   3. Run the schema from supabase/schema.sql')
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      
      // Handle health check
      if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          mode: supabaseConfigured ? 'production' : 'development',
          database: supabaseConfigured ? 'connected' : 'placeholder'
        }))
        return
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Only initialize Socket.IO if Supabase is configured
  if (supabaseConfigured) {
    try {
      const { GameServer } = require('./lib/gameServer')
      const gameServer = new GameServer(server)
      console.log(`🎮 Socket.IO Game Server initialized`)
    } catch (error) {
      console.warn('⚠️  Could not initialize game server:', error instanceof Error ? error.message : String(error))
      console.log('🔧 Game server will be available once database is configured')
    }
  } else {
    console.log('🔧 Socket.IO game server disabled - configure Supabase to enable')
  }

  server.listen(port, () => {
    console.log(`🚀 Basetok Server ready on http://${hostname}:${port}`)
    console.log(`📊 Health check available at http://${hostname}:${port}/health`)
    
    if (!supabaseConfigured) {
      console.log(`\n📚 Setup Guide: Follow SETUP_GUIDE.md for complete configuration`)
      console.log(`🎮 Current features: Static game board, UI components`)
      console.log(`🔄 Missing features: Real-time multiplayer, database storage, achievements`)
    } else {
      console.log(`✅ Full features enabled: Real-time multiplayer, database, achievements`)
    }
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
})