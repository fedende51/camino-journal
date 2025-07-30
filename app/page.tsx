export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          Camino Journal
        </h1>
      </div>
      
      <div className="mt-8 text-center space-y-4">
        <p className="text-lg text-gray-600">
          Document your Camino de Santiago journey
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            ✅ Phase 1A: Project Setup Complete
          </h2>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Next.js 15 with App Router & TypeScript</li>
            <li>• Tailwind CSS v4 configured</li>
            <li>• Prisma ORM with SQLite database</li>
            <li>• Complete database schema (Users, Entries, Photos, GPS, Audio)</li>
            <li>• Vercel deployment configuration</li>
            <li>• Git repository initialized</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            ✅ Phase 1B: Authentication & Basic UI Complete
          </h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• NextAuth.js authentication system</li>
            <li>• User registration and login</li>
            <li>• Role-based access control</li>
            <li>• Protected pilgrim dashboard</li>
          </ul>
        </div>

        <div className="flex space-x-4 justify-center">
          <a
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            Register
          </a>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🚀 Next: Phase 1C - Audio Processing Pipeline
          </h2>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Audio file upload to Vercel Blob</li>
            <li>• AssemblyAI transcription integration</li>
            <li>• Claude 3 Haiku text cleanup</li>
            <li>• Entry creation form</li>
          </ul>
        </div>
      </div>
    </main>
  )
}