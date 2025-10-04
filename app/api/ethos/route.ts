import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      )
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace('@', '').trim()

    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'Valid username is required' },
        { status: 400 }
      )
    }

    // Call Ethos API
    const ethosResponse = await fetch(
      `https://api.ethos.network/api/v2/users/by/x?username=${encodeURIComponent(cleanUsername)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TicTacToe-Pro-MiniApp/1.0',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    if (!ethosResponse.ok) {
      if (ethosResponse.status === 404) {
        return NextResponse.json(
          { error: 'User not found on Ethos network' },
          { status: 404 }
        )
      }
      
      console.error('Ethos API error:', ethosResponse.status, ethosResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch user data from Ethos' },
        { status: ethosResponse.status }
      )
    }

    const ethosData = await ethosResponse.json()

    if (!ethosData.data) {
      return NextResponse.json(
        { error: 'User not found on Ethos network' },
        { status: 404 }
      )
    }

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: {
        id: ethosData.data.id,
        username: ethosData.data.username,
        name: ethosData.data.name || ethosData.data.username,
        profileImageUrl: ethosData.data.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ethosData.data.username}`,
        ethosScore: ethosData.data.ethosScore || 0,
        isVerified: ethosData.data.isVerified || false,
      }
    })

  } catch (error) {
    console.error('Error fetching Ethos data:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Ethos API is taking too long to respond' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error while fetching Ethos data' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}