import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { minikitConfig } from '@/minikit.config'

// Webhook event types from Base
interface WebhookEvent {
  type: 'user.joined' | 'user.left' | 'payment.completed' | 'cast.created' | 'frame.interaction'
  data: {
    user?: {
      fid: number
      username: string
      displayName: string
      pfpUrl: string
      verified: boolean
    }
    payment?: {
      transactionHash: string
      amount: string
      currency: string
      fromAddress: string
      toAddress: string
    }
    cast?: {
      hash: string
      text: string
      author: {
        fid: number
        username: string
      }
    }
    frame?: {
      buttonIndex: number
      inputText?: string
      state?: string
    }
  }
  timestamp: string
  signature: string
}

// Verify webhook signature
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.MINIKIT_WEBHOOK_SECRET
  if (!secret) return false
  
  // Implement signature verification based on Base's webhook signing method
  // This is a placeholder - replace with actual verification logic
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-minikit-signature') || ''
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: WebhookEvent = JSON.parse(body)
    console.log('📡 Webhook event received:', event.type)

    switch (event.type) {
      case 'user.joined':
        await handleUserJoined(event)
        break
        
      case 'user.left':
        await handleUserLeft(event)
        break
        
      case 'payment.completed':
        await handlePaymentCompleted(event)
        break
        
      case 'cast.created':
        await handleCastCreated(event)
        break
        
      case 'frame.interaction':
        await handleFrameInteraction(event)
        break
        
      default:
        console.log('🤷 Unknown webhook event type:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleUserJoined(event: WebhookEvent) {
  const userData = event.data.user
  if (!userData) return

  console.log('👤 User joined:', userData.username)

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('farcaster_fid', userData.fid)
      .single()

    if (!existingUser) {
      // Create new user
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({
          farcaster_fid: userData.fid,
          farcaster_username: userData.username,
          display_name: userData.displayName,
          avatar_url: userData.pfpUrl,
          farcaster_verified: userData.verified,
          wallet_address: `farcaster:${userData.fid}` // Temporary wallet until they connect
        })
        .select()
        .single()

      // Send welcome notification
      if (newUser) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: newUser.id,
            type: 'system',
            title: 'Welcome to TicTacToe Pro! 🎮',
            message: 'Start playing to earn points and climb the leaderboard!',
            data: { welcome: true }
          })
      }

      console.log('✅ New user created:', newUser?.id)
    } else {
      // Update existing user activity
      await supabaseAdmin
        .from('users')
        .update({ 
          last_active: new Date().toISOString(),
          display_name: userData.displayName,
          avatar_url: userData.pfpUrl,
          farcaster_verified: userData.verified
        })
        .eq('farcaster_fid', userData.fid)

      console.log('✅ User updated:', existingUser.id)
    }
  } catch (error) {
    console.error('❌ Error handling user joined:', error)
  }
}

async function handleUserLeft(event: WebhookEvent) {
  const userData = event.data.user
  if (!userData) return

  console.log('👋 User left:', userData.username)

  try {
    // Update user's last active time
    await supabaseAdmin
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('farcaster_fid', userData.fid)
  } catch (error) {
    console.error('❌ Error handling user left:', error)
  }
}

async function handlePaymentCompleted(event: WebhookEvent) {
  const paymentData = event.data.payment
  if (!paymentData) return

  console.log('💰 Payment completed:', paymentData.transactionHash)

  try {
    // Find user by wallet address
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', paymentData.fromAddress)
      .single()

    if (user) {
      // Award bonus points for payment
      const bonusPoints = parseInt(paymentData.amount) * 10 // 10 points per unit
      
      await supabaseAdmin
        .from('users')
        .update({
          total_points: user.total_points + bonusPoints
        })
        .eq('id', user.id)

      // Send notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: 'Payment Received! 💰',
          message: `You earned ${bonusPoints} bonus points!`,
          data: { 
            transaction_hash: paymentData.transactionHash,
            bonus_points: bonusPoints
          }
        })

      console.log('✅ Bonus points awarded:', bonusPoints)
    }
  } catch (error) {
    console.error('❌ Error handling payment:', error)
  }
}

async function handleCastCreated(event: WebhookEvent) {
  const castData = event.data.cast
  if (!castData) return

  console.log('📝 Cast created:', castData.text)

  try {
    // Check if cast mentions the app
    const appMentions = ['tictactoe', 'tic tac toe', 'gaming']
    const mentionsApp = appMentions.some(mention => 
      castData.text.toLowerCase().includes(mention)
    )

    if (mentionsApp) {
      // Find user and award social points
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('farcaster_fid', castData.author.fid)
        .single()

      if (user) {
        const socialPoints = 25
        
        await supabaseAdmin
          .from('users')
          .update({
            total_points: user.total_points + socialPoints
          })
          .eq('id', user.id)

        // Send notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'system',
            title: 'Social Points Earned! 📱',
            message: `You earned ${socialPoints} points for sharing!`,
            data: { 
              cast_hash: castData.hash,
              social_points: socialPoints
            }
          })

        console.log('✅ Social points awarded:', socialPoints)
      }
    }
  } catch (error) {
    console.error('❌ Error handling cast:', error)
  }
}

async function handleFrameInteraction(event: WebhookEvent) {
  const frameData = event.data.frame
  if (!frameData) return

  console.log('🖼️ Frame interaction:', frameData.buttonIndex)

  try {
    // Handle different frame button interactions
    switch (frameData.buttonIndex) {
      case 1: // Play Now button
        // Track engagement
        console.log('🎮 User clicked Play Now from frame')
        break
        
      case 2: // Leaderboard button
        // Track leaderboard views
        console.log('🏆 User clicked Leaderboard from frame')
        break
        
      default:
        console.log('🤷 Unknown frame button:', frameData.buttonIndex)
    }
  } catch (error) {
    console.error('❌ Error handling frame interaction:', error)
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  
  if (challenge) {
    // Respond with challenge for webhook verification
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'TicTacToe Pro Webhook Endpoint',
    version: minikitConfig.miniapp.version,
    features: minikitConfig.miniapp.features
  })
}
