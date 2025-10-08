import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Store pending auth requests (in production, use Redis or database)
declare global {
  var pendingAuths: Map<string, {
    channelToken: string
    nonce: string
    siweUri: string
    domain: string
    createdAt: number
  }>
}

if (!global.pendingAuths) {
  global.pendingAuths = new Map()
}

export async function POST(request: NextRequest) {
  try {
    // Generate unique nonce and channel token
    const nonce = crypto.randomUUID()
    const channelToken = crypto.randomUUID()
    
    // Get domain from request
    const domain = request.headers.get('host') || 'localhost:3000'
    const siweUri = `${request.headers.get('x-forwarded-proto') || 'http'}://${domain}`

    // Store auth request
    global.pendingAuths.set(channelToken, {
      channelToken,
      nonce,
      siweUri,
      domain,
      createdAt: Date.now()
    })

    // Clean up old auth requests (older than 10 minutes)
    const now = Date.now()
    Array.from(global.pendingAuths.entries()).forEach(([key, value]) => {
      if (now - value.createdAt > 600000) {
        global.pendingAuths.delete(key)
      }
    })

    // Create Farcaster auth URL
    const authUrl = `https://warpcast.com/~/sign-in-with-farcaster?` +
      `channelToken=${channelToken}&` +
      `nonce=${nonce}&` +
      `siweUri=${encodeURIComponent(siweUri)}&` +
      `domain=${encodeURIComponent(domain)}`

    return NextResponse.json({
      success: true,
      authUrl,
      channelToken,
      nonce
    })

  } catch (error) {
    console.error('Failed to start Farcaster auth:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize authentication' },
      { status: 500 }
    )
  }
}