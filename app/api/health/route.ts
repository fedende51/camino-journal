import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
    ])
    
    // Check if we can access the database and get basic stats
    const [userCount, entryCount] = await Promise.all([
      prisma.user.count(),
      prisma.entry.count()
    ])
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'connected',
      stats: {
        users: userCount,
        entries: entryCount
      },
      services: {
        nextjs: 'running',
        prisma: 'connected',
        environment: process.env.NODE_ENV || 'development'
      },
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        nextjs: 'running',
        prisma: 'error',
        environment: process.env.NODE_ENV || 'development'
      },
      version: process.env.npm_package_version || '1.0.0'
    }, { status: 503 })
  }
}