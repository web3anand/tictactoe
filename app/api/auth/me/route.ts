import { NextRequest, NextResponse } from 'next/server'
import { createClient, Errors } from '@farcaster/quick-auth'

const client = createClient()

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    try {
      // Verify JWT using Quick Auth client
      const payload = await client.verifyJwt({
        token: token,
        domain: process.env.HOSTNAME || 'localhost:3001',
      })
      
      const fid = payload.sub
      
      if (!fid) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        )
      }

      // Resolve user information
      const userData = await resolveUser(fid)
      
      return NextResponse.json(userData)
      
    } catch (error) {
      if (error instanceof Errors.InvalidTokenError) {
        console.info('Invalid token:', error.message)
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }
      throw error
    }
    
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Resolve information about the authenticated Farcaster user
async function resolveUser(fid: number) {
  try {
    // Get primary address
    const primaryAddressResponse = await fetch(
      `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`
    )
    
    let primaryAddress = undefined
    if (primaryAddressResponse.ok) {
      const addressData = await primaryAddressResponse.json()
      primaryAddress = addressData.result?.address?.address
    }

    // Get user profile data
    const userResponse = await fetch(
      `https://api.farcaster.xyz/fc/user-by-fid?fid=${fid}`
    )

    if (!userResponse.ok) {
      // Return minimal user data if profile fetch fails
      return {
        fid,
        primaryAddress,
      }
    }

    const userData = await userResponse.json()
    const user = userData.result?.user
    
    return {
      fid,
      username: user?.username,
      displayName: user?.displayName,
      pfpUrl: user?.pfp?.url,
      bio: user?.profile?.bio?.text,
      verifications: user?.verifications || [],
      followerCount: user?.followerCount || 0,
      followingCount: user?.followingCount || 0,
      primaryAddress,
    }
    
  } catch (error) {
    console.error('Failed to resolve user:', error)
    // Return minimal user data on error
    return {
      fid,
      primaryAddress: undefined,
    }
  }
}