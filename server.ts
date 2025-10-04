import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { GameServer } from './lib/gameServer'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3001', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO game server
  const gameServer = new GameServer(server)
  
  // Add health check endpoint
  server.on('request', (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: gameServer.getStats()
      }))
      return
    }
  })

  server.listen(port, () => {
    console.log(`🚀 TicTacToe Pro Server ready on http://${hostname}:${port}`)
    console.log(`🎮 Socket.IO Game Server initialized`)
    console.log(`📊 Health check available at http://${hostname}:${port}/health`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    server.close(() => {
      console.log('Process terminated')
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    server.close(() => {
      console.log('Process terminated')
    })
  })
})