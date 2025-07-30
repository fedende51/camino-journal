# Camino de Santiago Journal App - Requirements Document

## Product Vision

A simple, web-based journaling application that allows a Camino pilgrim to effortlessly document their journey through voice recordings, photos, and GPS data, while enabling family members to follow along remotely through an intuitive interface.

**Core Principles:**
- Minimal effort required from the pilgrim
- Family-friendly interface for non-tech-savvy users
- Simple workflows with smart automation
- Works with intermittent internet connectivity

## User Personas

### Primary User: The Pilgrim
- Uses iPhone for photos and voice recordings
- Has Garmin device synced to Strava
- Limited time and energy for complex workflows
- Intermittent internet access (mainly at albergues)

### Secondary Users: Family Members
- Non-tech-savvy, comfortable with basic web browsing
- Want to follow journey progress remotely
- Access via desktop/mobile web browsers

## Core Features

### 1. Journal Entry Creation

**Audio Processing Workflow:**
- Upload audio files (iPhone voice memos - .m4a format)
- Automatic transcription via OpenAI Whisper API
- LLM cleanup and formatting (maintaining personal voice/style)
- Support for multiple audio files per entry
- Manual text editing capability post-transcription

**Entry Structure:**
- Date and day number (Day 1, Day 2, etc.)
- Location/town name
- Transcribed and cleaned journal text
- Hero photo (embedded from Google Photos)
- Link to full photo album for the day
- Basic route information (start/end points)
- Optional: Stats from Garmin/Strava (distance, elevation, duration)

**Entry Management:**
- One entry per day (triggered manually)
- Privacy toggle: Public (family visible) or Private (pilgrim only)
- Edit capability for all text content

### 2. Photo Integration

**Photo Workflow:**
- Upload photos directly to Vercel Blob Storage via app interface
- Get public URLs for each photo (no login required for family viewing)
- Select one hero photo per entry to display in journal
- Optional: Link to view all photos for the day in a simple gallery
- Photos embedded directly in app - no external service required

### 3. GPS and Route Data

**Map Integration:**
- Pull basic route data from Garmin Connect or Strava API
- Display start and end points on Google Maps
- Show route line between points
- Include basic stats: distance, elevation gain, walking time
- *Future consideration: Full GPS track visualization*

### 4. Family Viewing Interface

**Navigation Options:**
- **List View:** Chronological list of entries (Day 1, Day 2, Day 3...)
- **Map View:** Google Map with pins at each town/end location
  - Click pin to view that day's entry
  - Shows journey progress geographically

**Entry Display:**
- Clean, readable format optimized for various screen sizes
- Hero photo prominently displayed
- Journal text in readable typography
- Basic route map and stats
- Link to photo album opens in new tab

### 5. User Authentication & Privacy

**Access Control:**
- Simple login for pilgrim (entry creation/editing)
- Family view accessible via shared link or simple family login
- Private entries only visible to pilgrim
- No user registration required for family viewing

## Technical Requirements

### Platform
- **Web application** (responsive design for mobile and desktop)
- Works on iPhone Safari for pilgrim
- Compatible with common desktop browsers for family

### Core Technology Stack
- **Frontend/Backend:** Next.js with TypeScript
- **Styling:** Tailwind CSS for modern, responsive design
- **Database:** SQLite (development) → PostgreSQL (production via Vercel)
- **ORM:** Prisma for database management
- **Hosting:** Vercel (free tier with automatic HTTPS and custom domain support)
- **File Storage:** Vercel Blob Storage for photos and audio files

### Third-Party Integrations

**Required:**
- **AssemblyAI Speech-to-Text API** for audio transcription ($0.12/hour - FREE with $50 credit)
- **Claude 3 Haiku API** for text cleanup and formatting ($0.80/$4 per million tokens)
- **Google Maps API** for route visualization
- **Vercel Blob Storage** for photo and audio file storage (integrated with hosting)

**Preferred:**
- **Garmin Connect API** or **Strava API** for GPS data
- *Fallback: Manual entry of start/end locations*

### Development & Deployment
- **Single developer** building with LLM assistance (Claude/ChatGPT)
- **Deployment:** Automatic via Vercel (git push → live site)
- **Domain:** Free Vercel subdomain (your-app.vercel.app) or custom domain
- **SSL/HTTPS:** Automatic through Vercel
- **Zero server management required**

## User Workflows

### Pilgrim Daily Workflow
1. Throughout day: Take photos, record voice memos on iPhone
2. End of day (with internet):
   - Upload voice recording(s) to app
   - App transcribes and cleans up text
   - Review and edit text if needed
   - Upload/organize photos to Google Photos
   - Select hero photo and link album in app
   - App pulls GPS data from Garmin/Strava
   - Set privacy level (public/private)
   - Publish entry

### Family Viewing Workflow
1. Access app via web browser
2. Choose list view or map view
3. Select specific day/entry to read
4. View journal text, photo, and route information
5. Click through to full photo album if desired

## Success Metrics
- **Pilgrim satisfaction:** Can create complete daily entry in under 10 minutes
- **Family engagement:** Regular viewing of entries throughout journey
- **Technical reliability:** 99%+ uptime during Camino period
- **Ease of use:** Family can navigate without technical support

## Development Priorities

### Phase 1 (MVP - 2 weeks)
- Basic entry creation with audio transcription
- Simple text editing
- Google Photos hero image integration
- Basic Google Maps with start/end points
- Family viewing interface (list and map views)
- Privacy controls

### Phase 2 (Future enhancements)
- Full GPS track visualization
- Enhanced photo gallery integration
- Entry templates and automated formatting
- Basic analytics/statistics
- Mobile app versions

## Technical Constraints & Considerations

**Budget Considerations:**
- **Hosting:** $0 (Vercel free tier)
- **Domain:** $0 (Vercel subdomain) or ~$12/year (custom domain)
- **Audio transcription:** $0 (covered by AssemblyAI's $50 free credit)
- **Text cleanup:** $2-5 total (Claude 3 Haiku - 5x cheaper than OpenAI)
- **Google Maps API:** $0 (stays within free quota)
- **Photo/audio storage:** $1-3 total (Vercel Blob Storage)
- **Total estimated cost:** $3-10 for entire Camino journey

**Development Timeline:**
- 2-week development window
- Small team (2-3 engineers)
- Simple, proven technologies preferred over complex solutions

**Risk Mitigation:**
- **Fallback for Garmin/Strava integration:** Manual location entry
- **Fallback for audio transcription:** Multiple API options available (OpenAI, AssemblyAI, Google)
- **Simple deployment:** Vercel handles scaling and reliability automatically
- **Proven tech stack:** Next.js has extensive documentation and community support
- **LLM development assistance:** Claude/ChatGPT excellent for Next.js code generation

## Acceptance Criteria

**Pilgrim Can:**
- Upload and transcribe voice recordings in under 2 minutes
- Edit transcribed text easily
- Add photos and GPS data with minimal effort
- Create complete daily entry in under 10 minutes
- Set entries as private or public

**Family Can:**
- View all public entries without technical difficulties
- Navigate between entries via list or map interface
- See journey progress visually on map
- Access photo albums for each day
- View on both mobile and desktop browsers

**System Can:**
- Handle intermittent usage patterns
- Process multiple audio files per entry
- Integrate with external APIs reliably
- Maintain data consistency and backups
- Scale for duration of Camino journey (30-40 days)