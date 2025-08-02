'use client'

interface ShareBannerProps {
  slug: string
}

export default function ShareBanner({ slug }: ShareBannerProps) {
  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/journal/${slug}`
      navigator.clipboard.writeText(url).then(() => {
        // Could add a toast notification here
      })
    }
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-sm">🔗</span>
            <span className="text-blue-900 text-sm font-medium">
              Share this journal:
            </span>
            <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              /journal/{slug}
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}