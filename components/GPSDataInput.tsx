'use client'

import { useState } from 'react'

interface GPSData {
  source: 'strava' | 'garmin' | 'manual'
  activityId?: string
  name: string
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
  externalUrl?: string
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

interface GPSDataInputProps {
  date: string
  onGPSDataChange: (gpsData: GPSData | null) => void
  isLoading?: boolean
}

export default function GPSDataInput({ date, onGPSDataChange, isLoading = false }: GPSDataInputProps) {
  const [inputMode, setInputMode] = useState<'search' | 'manual'>('search')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [selectedGPSData, setSelectedGPSData] = useState<GPSData | null>(null)
  const [stravaConnected, setStravaConnected] = useState(false)
  const [stravaToken, setStravaToken] = useState<string>('')
  const [searchError, setSearchError] = useState('')

  // Manual input state
  const [manualData, setManualData] = useState<ManualGPSInput>({
    startLocation: '',
    endLocation: '',
    distanceKm: 0,
    elevationGainM: 0,
    durationMinutes: 0,
    calories: 0
  })

  const handleSearchGPS = async () => {
    setIsSearching(true)
    setSearchError('')
    setSearchResults(null)

    try {
      const response = await fetch('/api/gps/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          source: 'strava',
          stravaAccessToken: stravaToken || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.gpsData) {
          setSearchResults(data)
        } else {
          setSearchError(data.message || 'No GPS data found for this date')
        }
      } else {
        setSearchError(data.error || 'Failed to search GPS data')
      }
    } catch (error) {
      setSearchError('Network error occurred while searching GPS data')
    } finally {
      setIsSearching(false)
    }
  }

  const handleConnectStrava = async () => {
    try {
      const response = await fetch('/api/auth/strava?baseUrl=' + window.location.origin)
      const data = await response.json()
      
      if (data.authorizationUrl) {
        // Open Strava authorization in popup
        const popup = window.open(
          data.authorizationUrl,
          'strava-auth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        )

        // Listen for popup messages
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'STRAVA_AUTH_SUCCESS') {
            setStravaConnected(true)
            setStravaToken(event.data.accessToken)
            popup?.close()
            window.removeEventListener('message', handleMessage)
          }
        }

        window.addEventListener('message', handleMessage)
      }
    } catch (error) {
      setSearchError('Failed to connect to Strava')
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

  const clearGPSData = () => {
    setSelectedGPSData(null)
    setSearchResults(null)
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
          {!stravaConnected ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Strava</h3>
              <p className="text-gray-500 mb-4">
                Connect your Strava account to automatically import walking and hiking data for this date.
              </p>
              <button
                type="button"
                onClick={handleConnectStrava}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
                disabled={isLoading}
              >
                Connect Strava Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Strava Connected</p>
                    <p className="text-sm text-green-600">Ready to search for activities</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSearchGPS}
                  disabled={isSearching || isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search Activities'}
                </button>
              </div>

              {searchError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 text-sm">
                    <strong>No activities found:</strong> {searchError}
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

              {searchResults && searchResults.gpsData && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Found Activity</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {searchResults.source === 'strava' ? 'Strava' : 'Garmin'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Route:</span>
                        <div className="font-medium">{searchResults.gpsData.startLocation} → {searchResults.gpsData.endLocation}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <div className="font-medium">{searchResults.gpsData.distanceKm} km</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{Math.floor(searchResults.gpsData.durationMinutes / 60)}h {searchResults.gpsData.durationMinutes % 60}m</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Elevation:</span>
                        <div className="font-medium">+{searchResults.gpsData.elevationGainM}m</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSelectGPSData(searchResults.gpsData)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      disabled={isLoading}
                    >
                      Use This Data
                    </button>
                  </div>
                </div>
              )}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                {selectedGPSData.source === 'manual' ? 'Manual Entry' : 
                 selectedGPSData.source === 'strava' ? 'Strava' : 'Garmin'}
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
    </div>
  )
}