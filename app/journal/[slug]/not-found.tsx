import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0L28 29.344l13.172-13.172a4 4 0 115.656 5.656L33.656 35l13.172 13.172a4 4 0 01-5.656 5.656L28 40.656 14.828 53.828a4 4 0 01-5.656-5.656L22.344 35 9.172 21.828a4 4 0 010-5.656z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pilgrim Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The journal you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Pilgrim Login
          </Link>
          <Link
            href="/register"
            className="block w-full text-blue-600 hover:text-blue-500 font-medium"
          >
            Are you starting the Camino? Register here →
          </Link>
        </div>
      </div>
    </div>
  )
}