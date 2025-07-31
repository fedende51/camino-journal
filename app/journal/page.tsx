import { prisma } from '@/lib/prisma'
import JournalContent from '@/components/ui/JournalContent'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default async function JournalPage() {
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Camino Journal
            </h1>
            <div className="text-sm text-gray-500">
              Public viewing - no login required
            </div>
          </div>
        </div>
      </header>

      {/* Main content with view toggle */}
      <JournalContent entries={entries} />
    </div>
  )
}