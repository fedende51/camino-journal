'use client'

import { useState, useEffect, useRef } from 'react'

interface LocationData {
  name: string
  latitude: number
  longitude: number
}

interface LocationSelectorProps {
  value: string
  onChange: (location: LocationData) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}

export default function LocationSelector({ 
  value, 
  onChange, 
  placeholder = "e.g., Saint-Jean-Pied-de-Port",
  disabled = false,
  className = ""
}: LocationSelectorProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounced search function
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Using OpenStreetMap Nominatim API for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `countrycodes=es,fr,pt&` + // Focus on Spain, France, Portugal for Camino
        `addressdetails=1&` +
        `extratags=1`,
        {
          headers: {
            'User-Agent': 'CaminoJournalApp/1.0'
          }
        }
      )

      if (response.ok) {
        const results: NominatimResult[] = await response.json()
        setSuggestions(results)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)

    // Update parent with basic location data even without coordinates
    onChange({
      name: newValue,
      latitude: 0, // Default to 0 when no coordinates available
      longitude: 0
    })

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: NominatimResult) => {
    const locationData: LocationData = {
      name: suggestion.display_name.split(',')[0].trim(), // Use first part as clean name
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }

    setInputValue(locationData.name)
    setShowSuggestions(false)
    setSuggestions([])
    onChange(locationData)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            mt-1 block w-full border-gray-300 rounded-md shadow-sm 
            focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 
            border text-gray-900 ${className}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                ${index === selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
              `}
            >
              <div className="font-medium text-gray-900">
                {suggestion.display_name.split(',')[0].trim()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {suggestion.display_name.split(',').slice(1, 3).join(',').trim()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            No locations found. Try a different search term.
          </div>
        </div>
      )}
    </div>
  )
}