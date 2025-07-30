import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  query?: string
  page?: number
  limit?: number
  dateStart?: string
  dateEnd?: string
  hasPhotos?: boolean
  hasAudio?: boolean
  hasGPS?: boolean
  isPrivate?: boolean
  location?: string
  minDistance?: number
  sortBy?: string
  userId?: string
  includePrivate?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
      hasPhotos: searchParams.get('hasPhotos') === 'true',
      hasAudio: searchParams.get('hasAudio') === 'true',
      hasGPS: searchParams.get('hasGPS') === 'true',
      isPrivate: searchParams.get('isPrivate') === 'true' || undefined,
      location: searchParams.get('location') || undefined,
      minDistance: searchParams.get('minDistance') ? parseFloat(searchParams.get('minDistance')!) : undefined,
      sortBy: searchParams.get('sortBy') || 'date-desc',
      userId: searchParams.get('userId') || undefined,
      includePrivate: searchParams.get('includePrivate') === 'true'
    }

    // Validate pagination
    if (params.page! < 1) params.page = 1
    if (params.limit! < 1 || params.limit! > 50) params.limit = 10

    // Check authentication for private entries
    if (params.includePrivate) {
      const session = await auth()
      if (!session || !params.userId || session.user.id !== params.userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Build where clause
    const whereClause: any = {
      ...(params.userId && { userId: params.userId }),
      ...(params.includePrivate ? {} : { isPrivate: false })
    }

    // Text search
    if (params.query) {
      whereClause.OR = [
        { content: { contains: params.query, mode: 'insensitive' } },
        { title: { contains: params.query, mode: 'insensitive' } },
        { location: { contains: params.query, mode: 'insensitive' } }
      ]
    }

    // Date range filter
    if (params.dateStart || params.dateEnd) {
      whereClause.date = {}
      if (params.dateStart) {
        whereClause.date.gte = new Date(params.dateStart)
      }
      if (params.dateEnd) {
        whereClause.date.lte = new Date(params.dateEnd + 'T23:59:59.999Z')
      }
    }

    // Location filter
    if (params.location) {
      whereClause.location = {
        contains: params.location,
        mode: 'insensitive'
      }
    }

    // Media filters
    if (params.hasPhotos) {
      whereClause.photos = {
        some: {}
      }
    }

    if (params.hasAudio) {
      whereClause.audioFiles = {
        some: {}
      }
    }

    if (params.hasGPS) {
      whereClause.gpsData = {
        isNot: null
      }
    }

    // Distance filter (requires GPS data)
    if (params.minDistance) {
      whereClause.gpsData = {
        ...whereClause.gpsData,
        distanceKm: {
          gte: params.minDistance
        }
      }
    }

    // Privacy filter
    if (params.isPrivate !== undefined) {
      whereClause.isPrivate = params.isPrivate
    }

    // Build order by clause
    let orderBy: any = []
    switch (params.sortBy) {
      case 'date-asc':
        orderBy = [{ date: 'asc' }, { dayNumber: 'asc' }]
        break
      case 'date-desc':
        orderBy = [{ date: 'desc' }, { dayNumber: 'desc' }]
        break
      case 'day-asc':
        orderBy = [{ dayNumber: 'asc' }, { date: 'asc' }]
        break
      case 'day-desc':
        orderBy = [{ dayNumber: 'desc' }, { date: 'desc' }]
        break
      case 'distance-asc':
        orderBy = [{ gpsData: { distanceKm: 'asc' } }, { date: 'desc' }]
        break
      case 'distance-desc':
        orderBy = [{ gpsData: { distanceKm: 'desc' } }, { date: 'desc' }]
        break
      default:
        orderBy = [{ date: 'desc' }, { dayNumber: 'desc' }]
    }

    // Get total count
    const totalCount = await prisma.entry.count({
      where: whereClause
    })

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / params.limit!)
    const skip = (params.page! - 1) * params.limit!

    // Fetch entries
    const entries = await prisma.entry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        photos: {
          select: {
            id: true,
            blobUrl: true,
            filename: true,
            isHero: true
          }
        },
        gpsData: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            distanceKm: true,
            elevationGainM: true,
            durationMinutes: true,
            averageSpeedKmh: true,
            source: true,
            externalUrl: true
          }
        },
        _count: {
          select: {
            audioFiles: true,
            photos: true
          }
        }
      },
      orderBy,
      skip,
      take: params.limit
    })

    // Calculate additional statistics
    const stats = await calculateJourneyStats(whereClause)

    return NextResponse.json({
      entries,
      pagination: {
        currentPage: params.page!,
        totalPages,
        totalEntries: totalCount,
        entriesPerPage: params.limit!,
        hasNextPage: params.page! < totalPages,
        hasPreviousPage: params.page! > 1
      },
      stats,
      searchParams: params
    })

  } catch (error) {
    console.error('Search entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateJourneyStats(whereClause: any) {
  try {
    const [
      totalEntries,
      entriesWithPhotos,
      entriesWithAudio,
      entriesWithGPS,
      gpsStats
    ] = await Promise.all([
      prisma.entry.count({ where: whereClause }),
      prisma.entry.count({
        where: {
          ...whereClause,
          photos: { some: {} }
        }
      }),
      prisma.entry.count({
        where: {
          ...whereClause,
          audioFiles: { some: {} }
        }
      }),
      prisma.entry.count({
        where: {
          ...whereClause,
          gpsData: { isNot: null }
        }
      }),
      prisma.gPSData.aggregate({
        where: {
          entry: whereClause
        },
        _sum: {
          distanceKm: true,
          elevationGainM: true,
          durationMinutes: true
        },
        _avg: {
          averageSpeedKmh: true
        }
      })
    ])

    return {
      totalEntries,
      entriesWithPhotos,
      entriesWithAudio,
      entriesWithGPS,
      totalDistance: Math.round((gpsStats._sum.distanceKm || 0) * 100) / 100,
      totalElevation: Math.round(gpsStats._sum.elevationGainM || 0),
      totalDuration: Math.round(gpsStats._sum.durationMinutes || 0),
      averageSpeed: Math.round((gpsStats._avg.averageSpeedKmh || 0) * 100) / 100
    }
  } catch (error) {
    console.error('Stats calculation error:', error)
    return {
      totalEntries: 0,
      entriesWithPhotos: 0,
      entriesWithAudio: 0,
      entriesWithGPS: 0,
      totalDistance: 0,
      totalElevation: 0,
      totalDuration: 0,
      averageSpeed: 0
    }
  }
}