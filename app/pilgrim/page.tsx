'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Entry {
  id: string
  dayNumber: number
  date: string
  location: string
  title?: string
  content: string
  isPrivate: boolean
  isDraft: boolean
  createdAt: string
  user: {
    name?: string
    email: string
  }
  photos: Array<{
    id: string
    blobUrl: string
    filename: string
    isHero: boolean
  }>
  _count: {
    audioFiles: number
  }
}

export default function PilgrimDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!session?.user.id) return
    
    try {
      const response = await fetch(`/api/entries?includePrivate=true&userId=${session.user.id}`)
      const data = await response.json()
      if (response.ok) {
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setIsLoadingEntries(false)
    }
  }, [session?.user.id])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'PILGRIM') {
      router.push('/')
      return
    }
    
    // Fetch user's entries
    fetchEntries()
  }, [session, status, router, fetchEntries])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'PILGRIM') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Camino Journal
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Create New Entry Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">+</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Create New Entry
                    </h3>
                    <p className="text-sm text-gray-500">
                      Document today&apos;s journey
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/pilgrim/create"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    Start New Entry
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Entries Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">📖</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Entries
                    </h3>
                    <p className="text-sm text-gray-500">
                      View and edit your entries
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/journal"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    View Public Journal
                  </Link>
                </div>
              </div>
            </div>

            {/* Journey Stats Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Journey Stats
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track your progress
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
                  <div className="text-sm text-gray-500">Days completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Journal Entries</h2>
            
            {isLoadingEntries ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="text-gray-500">Loading entries...</div>
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
                <p className="text-gray-500 mb-4">
                  Start documenting your Camino journey by creating your first entry.
                </p>
                <Link
                  href="/pilgrim/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create First Entry
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Day {entry.dayNumber} - {entry.location}
                        </h3>
                        {entry.title && (
                          <p className="text-gray-600 mt-1">{entry.title}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {entry.isDraft && (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.isPrivate
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...` 
                        : entry.content
                      }
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{entry.content.length} characters</span>
                        {entry.photos && entry.photos.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <span>📸</span>
                            <span>{entry.photos.length}</span>
                          </span>
                        )}
                        {entry._count?.audioFiles > 0 && (
                          <span className="flex items-center space-x-1">
                            <span>🎤</span>
                            <span>{entry._count.audioFiles}</span>
                          </span>
                        )}
                      </div>
                      <div className="space-x-2">
                        <Link
                          href={`/pilgrim/edit/${entry.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                        <Link 
                          href={`/entry/${entry.id}`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Entry
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this entry? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}