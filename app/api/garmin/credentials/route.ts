import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CryptoJS from 'crypto-js'

// Encryption key - in production, this should be in environment variables
const ENCRYPTION_KEY = process.env.GARMIN_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

function encryptPassword(password: string): string {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
}

function decryptPassword(encryptedPassword: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// GET - Check if user has Garmin credentials stored
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { garminEmail: true, garminPasswordHash: true }
    })

    return NextResponse.json({
      hasCredentials: !!(user?.garminEmail && user?.garminPasswordHash),
      garminEmail: user?.garminEmail || null
    })

  } catch (error) {
    console.error('Garmin credentials check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Store Garmin credentials
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Encrypt the password for secure storage
    const encryptedPassword = encryptPassword(password)

    // Update user with Garmin credentials
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        garminEmail: email,
        garminPasswordHash: encryptedPassword
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Garmin credentials stored successfully'
    })

  } catch (error) {
    console.error('Garmin credentials storage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove stored Garmin credentials
export async function DELETE() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    // Remove Garmin credentials
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        garminEmail: null,
        garminPasswordHash: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Garmin credentials removed successfully'
    })

  } catch (error) {
    console.error('Garmin credentials removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}