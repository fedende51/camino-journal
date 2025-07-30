import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check if we can access the database and get basic stats
    const userCount = await prisma.user.count()
    const entryCount = await prisma.entry.count()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        entries: entryCount
      },
      services: {
        nextjs: 'running',
        prisma: 'connected'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        nextjs: 'running',
        prisma: 'error'
      }
    }, { status: 503 })
  }
}