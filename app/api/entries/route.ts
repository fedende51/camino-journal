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

    const { dayNumber, date, location, title, content, isPrivate, isDraft, audioUrl, photoUrls, heroPhotoIndex, gpsData, googlePhotosAlbumUrl, albumCoverImageUrl } = await request.json()

    // Validation
    if (!dayNumber || !date || !location || !content) {
      return NextResponse.json(
        { error: 'Day number, date, location, and content are required' },
        { status: 400 }
      )
    }

    // Note: Removed restriction on multiple entries per day to allow multiple entries

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        userId: session.user.id,
        dayNumber: parseInt(dayNumber),
        date: new Date(date),
        location,
        title: title || null,
        content,
        isPrivate: Boolean(isPrivate),
        isDraft: Boolean(isDraft),
        googlePhotosAlbumUrl: googlePhotosAlbumUrl || null,
        albumCoverImageUrl: albumCoverImageUrl || null
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

    // If photoUrls provided, create photo records
    if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
      try {
        const photoCreatePromises = photoUrls.map((url: string, index: number) => {
          return prisma.photo.create({
            data: {
              entryId: entry.id,
              blobUrl: url,
              filename: url.split('/').pop() || `photo-${index + 1}.jpg`,
              isHero: index === (heroPhotoIndex >= 0 ? heroPhotoIndex : 0) // First photo is hero by default
            }
          })
        })

        await Promise.all(photoCreatePromises)
      } catch (error) {
        console.error('Failed to create photo records:', error)
        // Don't fail the entire request if photo creation fails
      }
    }

    // If gpsData provided, create GPS data record
    if (gpsData) {
      try {
        await prisma.gPSData.create({
          data: {
            entryId: entry.id,
            startLocation: gpsData.startLocation,
            endLocation: gpsData.endLocation,
            distanceKm: gpsData.distanceKm,
            elevationGainM: gpsData.elevationGainM,
            durationMinutes: gpsData.durationMinutes,
            averageSpeedKmh: gpsData.averageSpeedKmh,
            startTime: new Date(gpsData.startTime),
            endTime: new Date(gpsData.endTime),
            calories: gpsData.calories,
            averageHeartRate: gpsData.heartRateData?.average,
            maxHeartRate: gpsData.heartRateData?.max,
            source: gpsData.source,
            externalActivityId: gpsData.activityId,
            externalUrl: gpsData.externalUrl,
            // coordinates would be stored as JSON if needed
            rawData: gpsData.coordinates ? JSON.stringify(gpsData.coordinates) : null
          }
        })
      } catch (error) {
        console.error('Failed to create GPS data record:', error)
        // Don't fail the entire request if GPS data creation fails
      }
    }

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