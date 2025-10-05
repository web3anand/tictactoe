import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Farcaster Mini App webhook event types
interface FarcasterWebhookEvent {
  event: 'miniapp_added' | 'miniapp_removed' | 'notifications_enabled' | 'notifications_disabled'
  notificationDetails?: {
    url: string
    token: string
  }
}

// JSON Farcaster Signature format
interface SignedWebhookPayload {
  header: string
  payload: string
  signature: string
}

export async function POST(request: NextRequest) {
  try {
    // Early return if database is not configured
    if (!supabaseAdmin) {
      console.warn('⚠️  Database not configured - webhook events will be logged but not persisted')
      return NextResponse.json({ success: true, message: 'Webhook received (database not configured)' })
    }

    const body = await request.text()
    console.log('📡 Webhook event received')

    // Parse the signed payload
    let signedPayload: SignedWebhookPayload
    try {
      signedPayload = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON in webhook payload')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Decode and parse the actual event data
    let eventData: FarcasterWebhookEvent
    try {
      const decodedPayload = Buffer.from(signedPayload.payload, 'base64url').toString('utf-8')
      eventData = JSON.parse(decodedPayload)
    } catch (error) {
      console.error('❌ Failed to decode webhook payload')
      return NextResponse.json({ error: 'Invalid payload encoding' }, { status: 400 })
    }

    console.log('📋 Processing event:', eventData.event)

    switch (eventData.event) {
      case 'miniapp_added':
        await handleMiniAppAdded(eventData, signedPayload)
        break
        
      case 'miniapp_removed':
        await handleMiniAppRemoved(eventData, signedPayload)
        break
        
      case 'notifications_enabled':
        await handleNotificationsEnabled(eventData, signedPayload)
        break
        
      case 'notifications_disabled':
        await handleNotificationsDisabled(eventData, signedPayload)
        break
        
      default:
        console.log('🤷 Unknown webhook event type:', eventData.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleMiniAppAdded(event: FarcasterWebhookEvent, signedPayload: SignedWebhookPayload) {
  console.log('➕ User added Mini App')

  try {
    if (!supabaseAdmin || !event.notificationDetails) {
      console.warn('Database not configured or no notification details - skipping token storage')
      return
    }

    // Extract FID from header (you'll need to decode this properly in production)
    const headerData = JSON.parse(Buffer.from(signedPayload.header, 'base64url').toString('utf-8'))
    const userFid = headerData.fid

    if (!userFid) {
      console.error('❌ No FID found in webhook header')
      return
    }

    // Store notification token
    const { error } = await supabaseAdmin
      .from('farcaster_notifications')
      .upsert({
        user_fid: userFid,
        notification_url: event.notificationDetails.url,
        notification_token: event.notificationDetails.token,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_fid'
      })

    if (error) {
      console.error('❌ Failed to store notification token:', error)
      return
    }

    // Also update user record if exists
    await supabaseAdmin
      .from('users')
      .update({ 
        farcaster_miniapp_added: true,
        last_active: new Date().toISOString()
      })
      .eq('farcaster_fid', userFid)

    console.log('✅ Notification token stored for FID:', userFid)
  } catch (error) {
    console.error('❌ Error handling miniapp_added:', error)
  }
}

async function handleMiniAppRemoved(event: FarcasterWebhookEvent, signedPayload: SignedWebhookPayload) {
  console.log('➖ User removed Mini App')

  try {
    if (!supabaseAdmin) {
      console.warn('Database not configured - skipping token removal')
      return
    }

    // Extract FID from header
    const headerData = JSON.parse(Buffer.from(signedPayload.header, 'base64url').toString('utf-8'))
    const userFid = headerData.fid

    if (!userFid) {
      console.error('❌ No FID found in webhook header')
      return
    }

    // Remove notification token
    await supabaseAdmin
      .from('farcaster_notifications')
      .delete()
      .eq('user_fid', userFid)

    // Update user record
    await supabaseAdmin
      .from('users')
      .update({ 
        farcaster_miniapp_added: false,
        last_active: new Date().toISOString()
      })
      .eq('farcaster_fid', userFid)

    console.log('✅ Notification token removed for FID:', userFid)
  } catch (error) {
    console.error('❌ Error handling miniapp_removed:', error)
  }
}

async function handleNotificationsEnabled(event: FarcasterWebhookEvent, signedPayload: SignedWebhookPayload) {
  console.log('� Notifications enabled')

  try {
    if (!supabaseAdmin || !event.notificationDetails) {
      console.warn('Database not configured or no notification details')
      return
    }

    // Extract FID from header
    const headerData = JSON.parse(Buffer.from(signedPayload.header, 'base64url').toString('utf-8'))
    const userFid = headerData.fid

    if (!userFid) {
      console.error('❌ No FID found in webhook header')
      return
    }

    // Update notification token
    await supabaseAdmin
      .from('farcaster_notifications')
      .upsert({
        user_fid: userFid,
        notification_url: event.notificationDetails.url,
        notification_token: event.notificationDetails.token,
        enabled: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_fid'
      })

    console.log('✅ Notifications enabled for FID:', userFid)
  } catch (error) {
    console.error('❌ Error handling notifications_enabled:', error)
  }
}

async function handleNotificationsDisabled(event: FarcasterWebhookEvent, signedPayload: SignedWebhookPayload) {
  console.log('🔕 Notifications disabled')

  try {
    if (!supabaseAdmin) {
      console.warn('Database not configured')
      return
    }

    // Extract FID from header
    const headerData = JSON.parse(Buffer.from(signedPayload.header, 'base64url').toString('utf-8'))
    const userFid = headerData.fid

    if (!userFid) {
      console.error('❌ No FID found in webhook header')
      return
    }

    // Disable notifications but keep token for potential re-enabling
    await supabaseAdmin
      .from('farcaster_notifications')
      .update({
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_fid', userFid)

    console.log('✅ Notifications disabled for FID:', userFid)
  } catch (error) {
    console.error('❌ Error handling notifications_disabled:', error)
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
    status: 'TicTacToe Pro Farcaster Webhook Endpoint',
    version: '1.0',
    features: ['miniapp_added', 'miniapp_removed', 'notifications_enabled', 'notifications_disabled']
  })
}
