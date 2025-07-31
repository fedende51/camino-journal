#!/usr/bin/env python3
"""
Garmin Connect Activity Fetcher
Fetches walking/hiking activities from Garmin Connect for a specific date.
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# Note: Requires garminconnect library
# Install with: pip3 install garminconnect python-dotenv
try:
    from garminconnect import Garmin
    GARMIN_AVAILABLE = True
except ImportError:
    GARMIN_AVAILABLE = False

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Fetch Garmin Connect activities for the last 30 days')
    parser.add_argument('--email', required=True, help='Garmin Connect email')
    parser.add_argument('--password', required=True, help='Garmin Connect password')
    parser.add_argument('--days', type=int, default=30, help='Number of days to fetch (default: 30)')
    return parser.parse_args()

def reverse_geocode(lat: float, lng: float) -> str:
    """Simple reverse geocoding using free API."""
    try:
        import urllib.request
        import urllib.parse
        
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lng}&localityLanguage=en"
        
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get('locality') or data.get('city') or data.get('principalSubdivision') or 'Unknown Location'
    except Exception as e:
        print(f"Reverse geocoding error: {e}", file=sys.stderr)
        return 'Unknown Location'

def process_activity(activity: Dict[str, Any]) -> Dict[str, Any]:
    """Process raw Garmin activity data into our format."""
    
    # Extract basic activity data
    activity_id = str(activity.get('activityId', ''))
    name = activity.get('activityName', 'Unnamed Activity')
    distance_meters = activity.get('distance', 0)
    duration_seconds = activity.get('duration', 0)
    elevation_gain = activity.get('elevationGain', 0)
    start_time_local = activity.get('startTimeLocal', '')
    
    # Calculate derived values
    distance_km = round(distance_meters / 1000, 2) if distance_meters else 0
    duration_minutes = round(duration_seconds / 60) if duration_seconds else 0
    elevation_gain_m = round(elevation_gain) if elevation_gain else 0
    
    # Calculate average speed
    average_speed_kmh = 0
    if distance_meters and duration_seconds:
        average_speed_ms = distance_meters / duration_seconds
        average_speed_kmh = round(average_speed_ms * 3.6, 2)
    
    # Parse start time
    start_time = start_time_local
    end_time = start_time_local
    if start_time_local and duration_seconds:
        try:
            start_dt = datetime.fromisoformat(start_time_local.replace('Z', '+00:00'))
            end_dt = start_dt + timedelta(seconds=duration_seconds)
            start_time = start_dt.isoformat()
            end_time = end_dt.isoformat()
        except ValueError:
            pass
    
    # Get locations from coordinates if available
    start_location = "Unknown"
    end_location = "Unknown"
    
    start_lat = activity.get('startLatitude')
    start_lng = activity.get('startLongitude')
    end_lat = activity.get('endLatitude')
    end_lng = activity.get('endLongitude')
    
    if start_lat and start_lng:
        start_location = reverse_geocode(start_lat, start_lng)
    
    if end_lat and end_lng:
        end_location = reverse_geocode(end_lat, end_lng)
    
    # Heart rate data
    heart_rate_data = None
    avg_hr = activity.get('averageHR')
    max_hr = activity.get('maxHR')
    if avg_hr:
        heart_rate_data = {
            "average": avg_hr,
            "max": max_hr or avg_hr
        }
    
    return {
        "activityId": activity_id,
        "name": name,
        "activityType": get_activity_type_display(activity),
        "date": activity.get('startTimeLocal', '')[:10] if activity.get('startTimeLocal') else '',
        "startLocation": start_location,
        "endLocation": end_location,
        "distanceKm": distance_km,
        "elevationGainM": elevation_gain_m,
        "durationMinutes": duration_minutes,
        "averageSpeedKmh": average_speed_kmh,
        "startTime": start_time,
        "endTime": end_time,
        "calories": activity.get('calories'),
        "heartRateData": heart_rate_data
    }

def get_activity_type_display(activity: Dict[str, Any]) -> str:
    """Get a human-readable activity type for display."""
    activity_type = activity.get('activityType', {})
    type_key = activity_type.get('typeKey', '').lower()
    type_name = activity_type.get('typeDisplayName', '')
    activity_name = activity.get('activityName', '').lower()
    
    # Map common activity types to display names
    type_mapping = {
        'walking': 'Walking',
        'hiking': 'Hiking', 
        'running': 'Running',
        'cycling': 'Cycling',
        'trekking': 'Trekking',
        'trail_running': 'Trail Running',
        'road_biking': 'Road Cycling',
        'mountain_biking': 'Mountain Biking',
        'fitness_walking': 'Fitness Walking'
    }
    
    # Check exact type key matches first
    if type_key in type_mapping:
        return type_mapping[type_key]
    
    # Check for keywords in type key or activity name
    for keyword, display_name in type_mapping.items():
        keyword_clean = keyword.replace('_', ' ')
        if keyword_clean in type_key or keyword_clean in activity_name:
            return display_name
    
    # Fallback to type display name or generic
    return type_name or 'Other Activity'

def is_relevant_activity(activity: Dict[str, Any]) -> bool:
    """Check if activity is relevant for journal entries (walking, hiking, running, cycling, cardio)."""
    activity_type = activity.get('activityType', {})
    type_key = activity_type.get('typeKey', '').lower()
    type_name = activity_type.get('typeDisplayName', '').lower()
    activity_name = activity.get('activityName', '').lower()
    
    # Include walking, hiking, running, cycling, cardio activities
    relevant_keywords = [
        'walk', 'walking', 'hike', 'hiking', 'trekking', 'trek',
        'run', 'running', 'jog', 'jogging', 'cycle', 'cycling', 'bike', 'biking',
        'pedestrian', 'foot', 'trail', 'ramble', 'stroll', 'fitness',
        'cardio', 'cardiovascular', 'aerobic', 'exercise', 'workout',
        'elliptical', 'treadmill', 'indoor', 'gym', 'strength', 'training'
    ]
    
    # Check activity type key, display name, and activity name
    for keyword in relevant_keywords:
        if keyword in type_key or keyword in type_name or keyword in activity_name:
            return True
    
    return False

def fetch_recent_activities(email: str, password: str, days: int = 30) -> Dict[str, Any]:
    """Fetch activities from Garmin Connect for the last N days."""
    
    if not GARMIN_AVAILABLE:
        return {
            "success": False,
            "error": "Garmin Connect library not available. Please install: pip3 install garminconnect"
        }
    
    try:
        # Connect to Garmin
        print(f"Connecting to Garmin Connect...", file=sys.stderr)
        api = Garmin(email, password)
        api.login()
        
        # Calculate date range (last N days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')
        
        print(f"Fetching activities from {start_date_str} to {end_date_str}...", file=sys.stderr)
        
        # Get activities for the date range
        activities = api.get_activities_by_date(start_date_str, end_date_str)
        
        if not activities:
            return {
                "success": True,
                "activities": [],
                "dateRange": {
                    "start": start_date_str,
                    "end": end_date_str
                }
            }
        
        # Filter for relevant activities (walking, hiking, running, cycling, cardio)
        relevant_activities = []
        for activity in activities:
            if is_relevant_activity(activity):
                processed_activity = process_activity(activity)
                relevant_activities.append(processed_activity)
        
        # Sort activities by date (most recent first)
        relevant_activities.sort(key=lambda x: x.get('startTime', ''), reverse=True)
        
        print(f"Found {len(relevant_activities)} relevant activities", file=sys.stderr)
        
        return {
            "success": True,
            "activities": relevant_activities,
            "dateRange": {
                "start": start_date_str,
                "end": end_date_str
            }
        }
        
    except Exception as e:
        error_msg = str(e)
        
        # Handle common authentication errors
        if "401" in error_msg or "authentication" in error_msg.lower():
            return {
                "success": False,
                "error": "Invalid Garmin Connect credentials. Please check your email and password."
            }
        elif "network" in error_msg.lower() or "connection" in error_msg.lower():
            return {
                "success": False,
                "error": "Unable to connect to Garmin Connect. Please check your internet connection."
            }
        else:
            return {
                "success": False,
                "error": f"Error fetching activities: {error_msg}"
            }

def main():
    """Main function."""
    args = parse_arguments()
    
    try:
        result = fetch_recent_activities(args.email, args.password, args.days)
        print(json.dumps(result, indent=2))
    except KeyboardInterrupt:
        print(json.dumps({
            "success": False,
            "error": "Operation cancelled by user"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()