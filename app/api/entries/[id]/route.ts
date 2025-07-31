import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/entries/[id] - Get specific entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        photos: true,
        gpsData: true,
        audioFiles: true
      }
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Check if user can access this entry
    if (entry.isPrivate && (!session || session.user.id !== entry.userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/entries/[id] - Update entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.entry.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own entries' },
        { status: 401 }
      )
    }

    const { dayNumber, date, location, title, content, isPrivate, isDraft } = await request.json()

    // Validation
    if (!dayNumber || !date || !location || !content) {
      return NextResponse.json(
        { error: 'Day number, date, location, and content are required' },
        { status: 400 }
      )
    }

    // Update entry
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        dayNumber: parseInt(dayNumber),
        date: new Date(date),
        location,
        title: title || null,
        content,
        isPrivate: Boolean(isPrivate),
        isDraft: Boolean(isDraft)
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
        audioFiles: true
      }
    })

    return NextResponse.json(
      { message: 'Entry updated successfully', entry: updatedEntry },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/entries/[id] - Delete entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.entry.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own entries' },
        { status: 401 }
      )
    }

    // Delete entry (CASCADE will handle related records)
    await prisma.entry.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Entry deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}