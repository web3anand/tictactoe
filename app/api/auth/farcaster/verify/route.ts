import { NextRequest, NextResponse } from 'next/server'

// Reference to the same pendingAuths from start route
// In production, use Redis or database for shared state
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

// Store completed auths temporarily
const completedAuths = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelToken } = body

    if (!channelToken) {
      return NextResponse.json(
        { success: false, error: 'Channel token required' },
        { status: 400 }
      )
    }

    // Check if auth is completed
    if (completedAuths.has(channelToken)) {
      const userData = completedAuths.get(channelToken)
      completedAuths.delete(channelToken) // Clean up after use
      
      return NextResponse.json({
        success: true,
        userData
      })
    }

    // Check if auth request exists
    if (!global.pendingAuths.has(channelToken)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired channel token' },
        { status: 400 }
      )
    }

    // Poll Farcaster for auth completion
    try {
      const authResponse = await fetch(
        `https://api.warpcast.com/v2/sign-in-with-farcaster?channelToken=${channelToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!authResponse.ok) {
        return NextResponse.json(
          { success: false, pending: true },
          { status: 200 }
        )
      }

      const authData = await authResponse.json()
      
      if (authData.state === 'completed' && authData.message && authData.signature) {
        // Verify the signature and extract user data
        const userData = {
          fid: authData.fid,
          username: authData.username,
          displayName: authData.displayName,
          pfpUrl: authData.pfpUrl,
          bio: authData.bio,
          custody: authData.custody,
          verifications: authData.verifications || [],
          message: authData.message,
          signature: authData.signature,
          nonce: authData.nonce
        }

        // Store completed auth
        completedAuths.set(channelToken, userData)
        
        // Clean up pending auth
        global.pendingAuths.delete(channelToken)

        return NextResponse.json({
          success: true,
          userData
        })
      }

      // Auth still pending
      return NextResponse.json(
        { success: false, pending: true },
        { status: 200 }
      )

    } catch (fetchError) {
      console.error('Failed to check auth status:', fetchError)
      return NextResponse.json(
        { success: false, pending: true },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Failed to verify Farcaster auth:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify authentication' },
      { status: 500 }
    )
  }
}