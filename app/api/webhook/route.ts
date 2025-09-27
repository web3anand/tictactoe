import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Base Mini App webhook events
    console.log('Webhook received:', body)
    
    // You can add custom logic here to handle different webhook events
    // For example, updating leaderboards, sending notifications, etc.
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'TicTacToe Pro Webhook Endpoint' })
}
