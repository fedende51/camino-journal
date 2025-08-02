import { prisma } from '@/lib/prisma'
import JournalContent from '@/components/ui/JournalContent'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShareBanner from './ShareBanner'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function IndividualJournalPage({ params }: PageProps) {
  const { slug } = params

  // Find the user by journal slug
  const user = await prisma.user.findUnique({
    where: {
      journalSlug: slug
    },
    select: {
      id: true,
      name: true,
      journalTitle: true,
      journalSlug: true,
      createdAt: true
    }
  })

  if (!user) {
    notFound()
  }

  // Fetch public entries for this specific user
  const entries = await prisma.entry.findMany({
    where: {
      userId: user.id,
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
      {/* Header with pilgrim info */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.journalTitle || `${user.name}'s Camino Journey`}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Following {user.name}'s journey on the Camino de Santiago
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📡 Live Updates
                </span>
                <span className="text-xs text-gray-500">
                  Journey started {user.createdAt.toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← All Pilgrims
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pilgrim Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Share info banner */}
      <ShareBanner slug={slug} />

      {/* Welcome message for empty journals */}
      {entries.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M28 16a4 4 0 11-8 0 4 4 0 018 0zM24 20a9.971 9.971 0 00-6.712 2.714M24 20a9.971 9.971 0 016.712 2.714" />
              </svg>
            </div>
            <h2 className="mt-2 text-lg font-medium text-gray-900">
              🌟 {user.name} hasn't started sharing yet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for updates from their Camino journey!
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                ← View other active pilgrims
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main journal content */}
      <JournalContent entries={entries} />

      {/* Footer with pilgrim info */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Following {user.name}'s Camino Journey
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Bookmark this page to follow along with their adventure. New entries will appear automatically.
            </p>
            <div className="flex justify-center space-x-6 text-xs text-gray-500">
              <span>📱 Mobile friendly</span>
              <span>🔄 Auto-updates</span>
              <span>🌍 No login required</span>
              <span>📍 GPS tracking</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}