'use client'

import { useState, useEffect } from 'react'

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void
  onFilterChange: (filters: FilterOptions) => void
  totalEntries: number
  filteredCount: number
}

interface FilterOptions {
  dateRange?: {
    start?: string
    end?: string
  }
  hasPhotos?: boolean
  hasAudio?: boolean
  hasGPS?: boolean
  isPrivate?: boolean
  minDistance?: number
  location?: string
  sortBy?: string
}

export default function SearchAndFilter({ 
  onSearchChange, 
  onFilterChange, 
  totalEntries, 
  filteredCount 
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({})
  
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onSearchChange(searchQuery)
    }, 300)
    
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, onSearchChange])

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== false
  ).length

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search entries by content, location, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          {(activeFilterCount > 0 || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        {filteredCount === totalEntries ? (
          `Showing all ${totalEntries} entries`
        ) : (
          `Showing ${filteredCount} of ${totalEntries} entries`
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Start date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  placeholder="End date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g., Santiago, Astorga..."
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Distance (km)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 20"
                value={filters.minDistance || ''}
                onChange={(e) => handleFilterChange('minDistance', parseFloat(e.target.value) || undefined)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Media Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPhotos || false}
                    onChange={(e) => handleFilterChange('hasPhotos', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">📸 Has Photos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasAudio || false}
                    onChange={(e) => handleFilterChange('hasAudio', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">🎤 Has Audio</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasGPS || false}
                    onChange={(e) => handleFilterChange('hasGPS', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">🗺️ Has GPS Data</span>
                </label>
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Filters
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange('dateRange', {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => handleFilterChange('dateRange', {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => setFilters({
                    hasPhotos: true,
                    hasAudio: true,
                    hasGPS: true
                  })}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium"
                >
                  Complete entries
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="distance-desc">Longest Distance</option>
                <option value="distance-asc">Shortest Distance</option>
                <option value="day-desc">Highest Day Number</option>
                <option value="day-asc">Lowest Day Number</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {filters.dateRange?.start && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    From: {new Date(filters.dateRange.start).toLocaleDateString()}
                    <button
                      onClick={() => handleFilterChange('dateRange', { ...filters.dateRange, start: undefined })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {filters.dateRange?.end && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    To: {new Date(filters.dateRange.end).toLocaleDateString()}
                    <button
                      onClick={() => handleFilterChange('dateRange', { ...filters.dateRange, end: undefined })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {filters.location && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Location: {filters.location}
                  </span>
                )}
                
                {filters.minDistance && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Min {filters.minDistance}km
                  </span>
                )}
                
                {filters.hasPhotos && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    📸 Has Photos
                  </span>
                )}
                
                {filters.hasAudio && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    🎤 Has Audio
                  </span>
                )}
                
                {filters.hasGPS && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    🗺️ Has GPS
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}