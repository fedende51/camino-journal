import { prisma } from '@/lib/prisma'
import JournalContent from '@/components/ui/JournalContent'
import Link from 'next/link'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch public entries
  const entries = await prisma.entry.findMany({
    where: {
      isPrivate: false
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
    },
    orderBy: [
      { date: 'desc' },
      { dayNumber: 'desc' }
    ]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Pilgrim Login */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Camino de Santiago Journal
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Follow the journey - Family & friends welcome
              </p>
            </div>
            
            {/* Pilgrim Login Button */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-sm text-gray-500">
                Are you the pilgrim?
              </div>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Pilgrim Login</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome message for first-time visitors */}
      {entries.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M28 16a4 4 0 11-8 0 4 4 0 018 0zM24 20a9.971 9.971 0 00-6.712 2.714M24 20a9.971 9.971 0 016.712 2.714" />
              </svg>
            </div>
            <h2 className="mt-2 text-lg font-medium text-gray-900">
              🌟 Welcome to the Camino Journey!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The pilgrim hasn&apos;t started sharing their journey yet. Check back soon for updates!
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Are you starting the Camino? Register as a pilgrim →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main journal content */}
      <JournalContent entries={entries} />
    </div>
  )
}