import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/entries - List entries (with optional privacy filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50') // Default to 50, will be 10 for pagination
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit

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

    const whereClause = {
      ...(userId && { userId }),
      ...(includePrivate ? {} : { isPrivate: false }) // Only public entries if not includePrivate
    }

    // Get total count for pagination
    const totalEntries = await prisma.entry.count({
      where: whereClause
    })

    // Get paginated entries
    const entries = await prisma.entry.findMany({
      where: whereClause,
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
      ],
      skip,
      take: limit
    })

    const totalPages = Math.ceil(totalEntries / limit)

    return NextResponse.json({ 
      entries,
      pagination: {
        page,
        limit,
        totalEntries,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
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

    const requestData = await request.json()
    console.log('Entry creation request data:', JSON.stringify(requestData, null, 2))
    
    const { dayNumber, date, location, title, content, isPrivate, isDraft, audioUrl, photoUrls, heroPhotoIndex, gpsData, googlePhotosAlbumUrl, albumCoverImageUrl } = requestData

    // Validation - temporarily relaxed for debugging
    console.log('Validation check:', {
      dayNumber: dayNumber, dayNumberType: typeof dayNumber, dayNumberTruthy: !!dayNumber,
      date: date, dateType: typeof date, dateTruthy: !!date,
      location: location, locationType: typeof location, locationTruthy: !!location,
      content: content, contentType: typeof content, contentTruthy: !!content
    })
    
    // Validation 
    if (!dayNumber || !date || !location || !content) {
      console.log('Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Day number, date, location, and content are required' },
        { status: 400 }
      )
    }

    // Note: Removed restriction on multiple entries per day to allow multiple entries

    // Create entry
    console.log('Creating entry with data:', {
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
    })
    
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

    console.log('Entry created successfully:', entry.id)

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