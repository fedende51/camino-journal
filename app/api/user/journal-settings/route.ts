import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSlugAvailable, validateSlug } from '@/lib/utils/slugGeneration'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { journalSlug, journalTitle } = await request.json()

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate slug if provided
    if (journalSlug) {
      const validation = validateSlug(journalSlug)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Check if slug is available
      const slugAvailable = await isSlugAvailable(journalSlug, currentUser.id)
      if (!slugAvailable) {
        return NextResponse.json(
          { error: 'This journal URL is already taken' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        journalSlug: journalSlug || null,
        journalTitle: journalTitle || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        journalSlug: true,
        journalTitle: true,
      }
    })

    return NextResponse.json({
      message: 'Journal settings updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Journal settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}