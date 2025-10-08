import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the identity token from cookie or header
    const token = request.cookies.get('privy-id-token')?.value ?? 
                  request.headers.get('privy-id-token')

    if (!token) {
      return NextResponse.json({ error: 'No identity token found' }, { status: 401 })
    }

    // In a real implementation, you would verify the JWT token with Privy's public key
    // For now, we'll just decode it without verification (NOT secure for production)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      return NextResponse.json({
        success: true,
        user: {
          id: payload.sub,
          email: payload.email,
          linked_accounts: payload.linked_accounts || [],
        },
        token_info: {
          issued_at: new Date(payload.iat * 1000),
          expires_at: new Date(payload.exp * 1000),
        }
      })
    } catch (decodeError) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Handle logout or token refresh
  return NextResponse.json({ message: 'Auth endpoint' })
}