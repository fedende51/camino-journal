export default function JournalPage() {
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Navigation options */}
          <div className="mb-8 flex space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium">
              List View
            </button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300">
              Map View
            </button>
          </div>

          {/* Empty state */}
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No journal entries yet
            </h3>
            <p className="text-gray-500 mb-6">
              Journal entries will appear here once the pilgrim starts documenting their journey.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                💡 This page is publicly accessible - family members can bookmark this URL to follow the journey without needing to create an account.
              </p>
            </div>
          </div>

          {/* Sample entry structure (commented out for now) */}
          {/*
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Day 1 - Saint-Jean-Pied-de-Port</h3>
                    <p className="text-sm text-gray-500">March 15, 2024</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Public
                  </span>
                </div>
                
                <div className="mb-4">
                  <img 
                    src="/placeholder-hero.jpg" 
                    alt="Day 1 hero photo" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <p className="text-gray-700 mb-4">
                  Started the journey today from Saint-Jean-Pied-de-Port. The weather was perfect and spirits are high...
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>25.2 km • 6h 30m • +1,200m elevation</span>
                  <a href="#" className="text-blue-600 hover:text-blue-800">View photos</a>
                </div>
              </div>
            </div>
          </div>
          */}
        </div>
      </main>
    </div>
  )
}