'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  journalSlug: string | null
  journalTitle: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    journalSlug: '',
    journalTitle: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          journalSlug: userData.journalSlug || '',
          journalTitle: userData.journalTitle || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/journal-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(prev => prev ? { ...prev, ...data.user } : null)
        setMessage({ type: 'success', text: 'Journal settings updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const copyToClipboard = () => {
    if (formData.journalSlug) {
      const url = `${window.location.origin}/journal/${formData.journalSlug}`
      navigator.clipboard.writeText(url)
      setMessage({ type: 'success', text: 'Journal URL copied to clipboard!' })
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load user data.</p>
          <Link href="/pilgrim" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const journalUrl = user.journalSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/journal/${user.journalSlug}` : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/pilgrim"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Journal Settings</h1>
          <p className="text-gray-600 mt-1">
            Customize your public journal URL and title
          </p>
        </div>


        {/* Settings Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customize Your Journal</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Journal URL */}
            <div>
              <label htmlFor="journalSlug" className="block text-sm font-medium text-gray-700 mb-2">
                Your Public Journal URL
              </label>
              <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-blue-500 focus-within:border-blue-500">
                <span className="text-gray-500 text-sm px-3 py-2 bg-gray-50 border-r border-gray-300">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/journal/
                </span>
                <input
                  type="text"
                  id="journalSlug"
                  name="journalSlug"
                  value={formData.journalSlug}
                  onChange={handleChange}
                  className="flex-1 min-w-0 block px-3 py-2 border-0 rounded-r-md focus:outline-none focus:ring-0 text-gray-900"
                  placeholder="your-name-2024"
                  pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
                  minLength={3}
                  maxLength={50}
                  required
                />
                {user?.journalSlug && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium border-l border-blue-600 rounded-r-md transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Share this URL with family and friends so they can follow your journey!
              </p>
            </div>

            {/* Journal Title */}
            <div>
              <label htmlFor="journalTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Journal Title
              </label>
              <input
                type="text"
                id="journalTitle"
                name="journalTitle"
                value={formData.journalTitle}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                placeholder="Your Name's Camino Journey 2024"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be displayed as the main heading on your journal page.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}