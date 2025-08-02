import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { generateUniqueSlug, generateJournalTitle } from '@/lib/utils/slugGeneration'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    const role = UserRole.PILGRIM // All registered users are pilgrims

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate journal slug and title
    let journalSlug: string | undefined
    let journalTitle: string | undefined
    
    if (name) {
      try {
        journalSlug = await generateUniqueSlug(name)
        journalTitle = generateJournalTitle(name)
      } catch (error) {
        console.error('Error generating slug:', error)
        // Continue without slug if generation fails
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        role,
        journalSlug,
        journalTitle,
      }
    })

    // Return user without password
    const { hashedPassword: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}