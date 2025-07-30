import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { StravaConnectService } from '@/lib/services/stravaConnect'

// GET - Generate Strava authorization URL
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const baseUrl = searchParams.get('baseUrl') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const redirectUri = `${baseUrl}/api/auth/strava/callback`
    const state = session.user.id // Use user ID as state to verify callback
    
    try {
      const authUrl = StravaConnectService.getAuthorizationUrl(redirectUri, state)
      
      return NextResponse.json({
        authorizationUrl: authUrl,
        instructions: 'Visit this URL to authorize your Strava account'
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to generate authorization URL' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Strava auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Exchange authorization code for tokens
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { code, state } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Verify state matches user ID for security
    if (state !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    const { tokens, error } = await StravaConnectService.exchangeCodeForTokens(code)
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    if (!tokens) {
      return NextResponse.json(
        { error: 'Failed to obtain tokens' },
        { status: 500 }
      )
    }

    // In a real app, you'd store these tokens securely in the database
    // associated with the user account. For now, we'll return them
    // to be stored client-side temporarily.
    
    return NextResponse.json({
      message: 'Strava account connected successfully',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      },
      expiresAt: new Date(tokens.expires_at * 1000).toISOString()
    })

  } catch (error) {
    console.error('Strava token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}