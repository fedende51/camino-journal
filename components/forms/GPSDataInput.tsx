'use client'

import { useState, useEffect } from 'react'

interface GPSData {
  source: 'garmin' | 'manual'
  activityId?: string
  name: string
  activityType?: string
  date?: string
  startLocation: string
  endLocation: string
  distanceKm: number
  elevationGainM: number
  durationMinutes: number
  averageSpeedKmh: number
  startTime: Date
  endTime: Date
  calories?: number
  heartRateData?: {
    average: number
    max: number
  }
  coordinates?: Array<{
    lat: number
    lng: number
  }>
}

interface ManualGPSInput {
  startLocation: string
  endLocation: string
  distanceKm: number
  elevationGainM: number
  durationMinutes: number
  startTime?: Date
  calories?: number
}

interface GarminCredentials {
  email: string
  password: string
}

interface GPSDataInputProps {
  date: string
  onGPSDataChange: (gpsData: GPSData | null) => void
  isLoading?: boolean
  initialData?: GPSData | null
}

export default function GPSDataInput({ date, onGPSDataChange, isLoading = false, initialData = null }: GPSDataInputProps) {
  const [inputMode, setInputMode] = useState<'search' | 'manual'>('search')
  const [isSearching, setIsSearching] = useState(false)
  const [activities, setActivities] = useState<GPSData[]>([])
  const [filteredActivities, setFilteredActivities] = useState<GPSData[]>([])
  const [selectedGPSData, setSelectedGPSData] = useState<GPSData | null>(null)
  const [searchError, setSearchError] = useState('')
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActivityType, setSelectedActivityType] = useState<string>('All')
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false)
  const [storedGarminEmail, setStoredGarminEmail] = useState('')
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false)
  
  // Garmin credentials state
  const [garminCredentials, setGarminCredentials] = useState<GarminCredentials>({
    email: '',
    password: ''
  })

  // Manual input state
  const [manualData, setManualData] = useState<ManualGPSInput>({
    startLocation: '',
    endLocation: '',
    distanceKm: 0,
    elevationGainM: 0,
    durationMinutes: 0,
    calories: 0
  })

  // Check for stored credentials on component mount
  useEffect(() => {
    checkStoredCredentials()
  }, [])

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      setSelectedGPSData(initialData)
      onGPSDataChange(initialData)
      setInputMode(initialData.source === 'garmin' ? 'search' : 'manual')
      if (initialData.source === 'manual') {
        setManualData({
          startLocation: initialData.startLocation,
          endLocation: initialData.endLocation,
          distanceKm: initialData.distanceKm,
          elevationGainM: initialData.elevationGainM,
          durationMinutes: initialData.durationMinutes,
          calories: initialData.calories || 0
        })
      }
    }
  }, [initialData])

  const checkStoredCredentials = async () => {
    setIsCheckingCredentials(true)
    try {
      const response = await fetch('/api/garmin/credentials')
      const data = await response.json()
      
      if (response.ok && data.hasCredentials) {
        setHasStoredCredentials(true)
        setStoredGarminEmail(data.garminEmail)
      }
    } catch (error) {
      console.error('Error checking stored credentials:', error)
    } finally {
      setIsCheckingCredentials(false)
    }
  }

  const handleConnectGarmin = () => {
    if (hasStoredCredentials) {
      // If we have stored credentials, fetch activities directly
      fetchActivitiesWithStoredCredentials()
    } else {
      // Otherwise, show credentials modal
      setShowCredentialsModal(true)
      setSearchError('')
    }
  }

  const fetchActivitiesWithStoredCredentials = async () => {
    setIsSearching(true)
    resetToInitialState()

    try {
      const response = await fetch('/api/garmin/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          days: 30
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.activities?.length > 0) {
          setActivities(data.activities)
          setFilteredActivities(data.activities)
        } else {
          setSearchError('No activities found in the last 30 days')
        }
      } else {
        setSearchError(data.error || 'Failed to fetch activities from Garmin Connect')
        if (data.error?.includes('credentials')) {
          // If credentials are invalid, remove them
          setHasStoredCredentials(false)
          setStoredGarminEmail('')
        }
      }
    } catch (error) {
      setSearchError('Network error occurred while connecting to Garmin')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGarminLogin = async () => {
    if (!garminCredentials.email || !garminCredentials.password) {
      setSearchError('Please enter both email and password')
      return
    }

    setIsSearching(true)
    setSearchError('')
    setActivities([])
    setFilteredActivities([])

    try {
      // First, try to fetch activities to validate credentials
      const activitiesResponse = await fetch('/api/garmin/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: garminCredentials.email,
          password: garminCredentials.password,
          days: 30
        })
      })

      const activitiesData = await activitiesResponse.json()

      if (activitiesResponse.ok && activitiesData.success) {
        // Credentials are valid, store them
        try {
          await fetch('/api/garmin/credentials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: garminCredentials.email,
              password: garminCredentials.password
            })
          })

          // Update state to reflect stored credentials
          setHasStoredCredentials(true)
          setStoredGarminEmail(garminCredentials.email)
        } catch (storeError) {
          console.error('Failed to store credentials:', storeError)
          // Continue anyway since we got the activities
        }

        // Display activities
        if (activitiesData.activities && activitiesData.activities.length > 0) {
          setActivities(activitiesData.activities)
          setFilteredActivities(activitiesData.activities)
          setShowCredentialsModal(false)
        } else {
          setSearchError('No activities found in the last 30 days')
        }
      } else {
        setSearchError(activitiesData.error || 'Failed to fetch activities from Garmin Connect')
      }
    } catch (error) {
      setSearchError('Network error occurred while connecting to Garmin')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectGPSData = (gpsData: GPSData) => {
    setSelectedGPSData(gpsData)
    onGPSDataChange(gpsData)
  }

  const handleManualDataChange = (field: keyof ManualGPSInput, value: any) => {
    const updatedData = { ...manualData, [field]: value }
    setManualData(updatedData)

    // Create GPS data from manual input
    if (updatedData.startLocation && updatedData.endLocation && updatedData.distanceKm > 0 && updatedData.durationMinutes > 0) {
      const startTime = new Date(date + 'T08:00:00') // Default 8 AM start
      const endTime = new Date(startTime.getTime() + updatedData.durationMinutes * 60000)
      
      const gpsData: GPSData = {
        source: 'manual',
        name: `Walking Day - ${updatedData.startLocation} to ${updatedData.endLocation}`,
        startLocation: updatedData.startLocation,
        endLocation: updatedData.endLocation,
        distanceKm: updatedData.distanceKm,
        elevationGainM: updatedData.elevationGainM,
        durationMinutes: updatedData.durationMinutes,
        averageSpeedKmh: Math.round((updatedData.distanceKm / (updatedData.durationMinutes / 60)) * 100) / 100,
        startTime,
        endTime,
        calories: updatedData.calories
      }
      
      setSelectedGPSData(gpsData)
      onGPSDataChange(gpsData)
    }
  }

  // Filter activities by search query and activity type
  const filterActivities = (query: string, activityType: string) => {
    let filtered = activities

    // Filter by activity type
    if (activityType !== 'All') {
      filtered = filtered.filter(activity => activity.activityType === activityType)
    }

    // Filter by search query (name, location)
    if (query.trim()) {
      const searchLower = query.toLowerCase()
      filtered = filtered.filter(activity => 
        activity.name.toLowerCase().includes(searchLower) ||
        activity.startLocation.toLowerCase().includes(searchLower) ||
        activity.endLocation.toLowerCase().includes(searchLower)
      )
    }

    setFilteredActivities(filtered)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    filterActivities(query, selectedActivityType)
  }

  const handleActivityTypeChange = (activityType: string) => {
    setSelectedActivityType(activityType)
    filterActivities(searchQuery, activityType)
  }

  const resetToInitialState = () => {
    setActivities([])
    setFilteredActivities([])
    setSearchQuery('')
    setSelectedActivityType('All')
    setSearchError('')
  }

  const clearGPSData = () => {
    setSelectedGPSData(null)
    resetToInitialState()
    setManualData({
      startLocation: '',
      endLocation: '',
      distanceKm: 0,
      elevationGainM: 0,
      durationMinutes: 0,
      calories: 0
    })
    onGPSDataChange(null)
  }

  const closeCredentialsModal = () => {
    setShowCredentialsModal(false)
    setGarminCredentials({ email: '', password: '' })
  }

  const handleDisconnectGarmin = async () => {
    try {
      await fetch('/api/garmin/credentials', {
        method: 'DELETE'
      })
      
      setHasStoredCredentials(false)
      setStoredGarminEmail('')
      resetToInitialState()
    } catch (error) {
      console.error('Failed to disconnect Garmin:', error)
    }
  }

  // Get unique activity types for filter buttons
  const getUniqueActivityTypes = () => {
    const types = activities.map(activity => activity.activityType || 'Unknown')
    return ['All', ...Array.from(new Set(types))]
  }

  // Helper function to format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      })
    } catch {
      return dateStr
    }
  }

  // Helper function to format time for display
  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'Unknown'
    try {
      return new Date(dateTimeStr).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return dateTimeStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setInputMode('search')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            inputMode === 'search'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={isLoading}
        >
          Search GPS Data
        </button>
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            inputMode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={isLoading}
        >
          Manual Entry
        </button>
      </div>

      {/* Search Mode */}
      {inputMode === 'search' && (
        <div className="space-y-4">
          {/* Connect Button or Activity Browser */}
          {activities.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔗</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Garmin</h3>
              {hasStoredCredentials ? (
                <div className="space-y-3">
                  <p className="text-gray-500">
                    Connected as <span className="font-medium text-gray-700">{storedGarminEmail}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Browse your recent activities from the last 30 days.
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      type="button"
                      onClick={handleConnectGarmin}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                      disabled={isLoading || isSearching}
                    >
                      {isSearching ? 'Loading Activities...' : 'Browse Recent Activities'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGarmin}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                      disabled={isLoading || isSearching}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 mb-4">
                    Connect your Garmin Connect account to browse your recent activities from the last 30 days.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectGarmin}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                    disabled={isLoading || isSearching}
                  >
                    {isSearching ? 'Connecting...' : 'Connect to Garmin'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Activity Browser Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Activities ({activities.length} found)
                  </h3>
                  {hasStoredCredentials && (
                    <p className="text-sm text-gray-500">
                      Connected as {storedGarminEmail}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={resetToInitialState}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                  {hasStoredCredentials && (
                    <button
                      type="button"
                      onClick={handleDisconnectGarmin}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Disconnect Account
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                {/* Search Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Search activities by name or location..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Activity Type Filters */}
                <div className="flex flex-wrap gap-2">
                  {getUniqueActivityTypes().map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleActivityTypeChange(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedActivityType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Table */}
              {filteredActivities.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredActivities.map((activity, index) => {
                          const isCurrentDate = activity.date === date
                          return (
                            <tr 
                              key={activity.activityId || index} 
                              className={isCurrentDate ? 'bg-green-50' : 'hover:bg-gray-50'}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className={`font-medium ${isCurrentDate ? 'text-green-800' : 'text-gray-900'}`}>
                                  {formatDate(activity.date || '')}
                                </div>
                                {isCurrentDate && (
                                  <div className="text-xs text-green-600">Today&apos;s entry</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatTime(activity.startTime.toString())}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    activity.activityType === 'Walking' ? 'bg-blue-100 text-blue-800' :
                                    activity.activityType === 'Hiking' ? 'bg-green-100 text-green-800' :
                                    activity.activityType === 'Running' ? 'bg-red-100 text-red-800' :
                                    activity.activityType === 'Cycling' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {activity.activityType || 'Activity'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{activity.name}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {activity.startLocation} → {activity.endLocation}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {activity.distanceKm} km
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {Math.floor(activity.durationMinutes / 60)}h {activity.durationMinutes % 60}m
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <button
                                  type="button"
                                  onClick={() => handleSelectGPSData(activity)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                                  disabled={isLoading}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No activities match your current filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedActivityType('All')
                      setFilteredActivities(activities)
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {searchError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800 text-sm">
                <strong>Error:</strong> {searchError}
              </div>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Add GPS data manually instead →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Mode */}
      {inputMode === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Location
              </label>
              <input
                type="text"
                value={manualData.startLocation}
                onChange={(e) => handleManualDataChange('startLocation', e.target.value)}
                placeholder="e.g., Saint-Jean-Pied-de-Port"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Location
              </label>
              <input
                type="text"
                value={manualData.endLocation}
                onChange={(e) => handleManualDataChange('endLocation', e.target.value)}
                placeholder="e.g., Roncesvalles"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={manualData.distanceKm || ''}
                onChange={(e) => handleManualDataChange('distanceKm', parseFloat(e.target.value) || 0)}
                placeholder="25.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={manualData.durationMinutes || ''}
                onChange={(e) => handleManualDataChange('durationMinutes', parseInt(e.target.value) || 0)}
                placeholder="480"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Elevation Gain (m)
              </label>
              <input
                type="number"
                min="0"
                value={manualData.elevationGainM || ''}
                onChange={(e) => handleManualDataChange('elevationGainM', parseInt(e.target.value) || 0)}
                placeholder="800"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories (optional)
              </label>
              <input
                type="number"
                min="0"
                value={manualData.calories || ''}
                onChange={(e) => handleManualDataChange('calories', parseInt(e.target.value) || 0)}
                placeholder="2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected GPS Data Display */}
      {selectedGPSData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-800">GPS Data Selected</h4>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {selectedGPSData.source === 'manual' ? 'Manual Entry' : 'Garmin'}
              </span>
              <button
                type="button"
                onClick={clearGPSData}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
                disabled={isLoading}
              >
                Remove
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600">Distance:</span>
              <div className="font-medium text-green-800">{selectedGPSData.distanceKm} km</div>
            </div>
            <div>
              <span className="text-green-600">Duration:</span>
              <div className="font-medium text-green-800">
                {Math.floor(selectedGPSData.durationMinutes / 60)}h {selectedGPSData.durationMinutes % 60}m
              </div>
            </div>
            <div>
              <span className="text-green-600">Elevation:</span>
              <div className="font-medium text-green-800">+{selectedGPSData.elevationGainM}m</div>
            </div>
            <div>
              <span className="text-green-600">Avg Speed:</span>
              <div className="font-medium text-green-800">{selectedGPSData.averageSpeedKmh} km/h</div>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-green-700">
            <strong>Route:</strong> {selectedGPSData.startLocation} → {selectedGPSData.endLocation}
          </div>
        </div>
      )}

      {/* Garmin Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔐</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connect to Garmin
              </h3>
              <p className="text-sm text-gray-500">
                Enter your Garmin Connect credentials to fetch activities for {date}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={garminCredentials.email}
                  onChange={(e) => setGarminCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={isSearching}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={garminCredentials.password}
                  onChange={(e) => setGarminCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Your Garmin Connect password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={isSearching}
                  autoComplete="current-password"
                />
              </div>

              <div className="text-xs text-gray-500">
                🔒 Your credentials will be securely encrypted and stored for automatic activity fetching. You can disconnect anytime.
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={closeCredentialsModal}
                disabled={isSearching}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGarminLogin}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isSearching ? 'Connecting...' : 'Fetch Activities'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}