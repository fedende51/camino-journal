import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/entries - List entries (with optional privacy filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    const userId = searchParams.get('userId')

    // If includePrivate is true, verify the user is authenticated
    if (includePrivate) {
      const session = await auth()
      if (!session || !userId || session.user.id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const entries = await prisma.entry.findMany({
      where: {
        ...(userId && { userId }),
        ...(includePrivate ? {} : { isPrivate: false }) // Only public entries if not includePrivate
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        photos: true,
        gpsData: true,
        _count: {
          select: {
            audioFiles: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { dayNumber: 'desc' }
      ]
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/entries - Create new entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { dayNumber, date, location, title, content, isPrivate } = await request.json()

    // Validation
    if (!dayNumber || !date || !location || !content) {
      return NextResponse.json(
        { error: 'Day number, date, location, and content are required' },
        { status: 400 }
      )
    }

    // Check if entry for this day already exists for this user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        userId: session.user.id,
        dayNumber: parseInt(dayNumber)
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: `Entry for Day ${dayNumber} already exists` },
        { status: 400 }
      )
    }

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        userId: session.user.id,
        dayNumber: parseInt(dayNumber),
        date: new Date(date),
        location,
        title: title || null,
        content,
        isPrivate: Boolean(isPrivate)
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        photos: true,
        gpsData: true
      }
    })

    return NextResponse.json(
      { message: 'Entry created successfully', entry },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}