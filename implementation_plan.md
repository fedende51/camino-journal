# Camino Journal App - Implementation Plan

## Overview
This document outlines the detailed implementation strategy for the Camino de Santiago Journal App, incorporating offline-first architecture, robust error handling, and incremental delivery approach.

## Core Database Schema

### Data Models
```sql
-- Users table
Users {
  id: string (UUID)
  email: string
  role: enum ['pilgrim', 'family']
  created_at: datetime
  updated_at: datetime
}

-- Journal Entries table
Entries {
  id: string (UUID)
  user_id: string (FK)
  day_number: integer
  date: date
  title: string
  location: string
  content: text
  is_private: boolean
  created_at: datetime
  updated_at: datetime
}

-- Photos table
Photos {
  id: string (UUID)
  entry_id: string (FK)
  blob_url: string
  filename: string
  is_hero: boolean
  created_at: datetime
}

-- GPS Data table
GPSData {
  id: string (UUID)
  entry_id: string (FK)
  start_location: string
  end_location: string
  distance_km: float
  elevation_gain_m: integer
  duration_minutes: integer
  strava_activity_id: string (optional)
  created_at: datetime
}

-- Audio Files table
AudioFiles {
  id: string (UUID)
  entry_id: string (FK)
  blob_url: string
  filename: string
  transcription: text
  processed: boolean
  created_at: datetime
}
```

## Revised Development Phases

### Week 1: Foundation & Core Entry System

#### Phase 1A: Project Setup (Days 1-2) ✅ COMPLETE
- [x] Initialize Next.js 15 with App Router, TypeScript, and Tailwind CSS v4
- [x] Configure Prisma ORM with SQLite (dev) → PostgreSQL (prod)
- [x] Set up complete database schema (Users, Entries, Photos, GPS, Audio, NextAuth models)
- [x] Configure Vercel deployment pipeline with environment variables
- [x] Initialize git repository and project structure

#### Phase 1B: Authentication & Entry Management (Days 3-4) ✅ COMPLETE
- [x] Implement NextAuth.js with credentials provider and JWT sessions
- [x] Create user registration and login pages with role-based access
- [x] Build complete entry creation form (/pilgrim/create) with validation
- [x] Create entry API routes for full CRUD operations
- [x] Build pilgrim dashboard with entries list and statistics
- [x] Create individual entry view pages (/entry/[id])
- [x] Implement public journal viewing (/journal) - no login required for family
- [x] Add privacy controls (public/private entries)
- [x] Responsive design throughout all interfaces

#### Phase 1C: Audio Processing Pipeline (Days 5-7) 🚧 NEXT
- [ ] Integrate Vercel Blob Storage for audio file uploads
- [ ] Build AssemblyAI transcription service integration
- [ ] Add Claude 3 Haiku text cleanup and formatting
- [ ] Create audio upload interface with progress tracking
- [ ] Implement offline queue for failed uploads
- [ ] Update entry creation form to handle audio workflow

### Week 2: Photos, GPS & Enhanced Features

#### Phase 2A: Photo Management (Days 8-9) 📅 PLANNED
- [ ] Photo upload to Vercel Blob Storage with optimization
- [ ] Image compression and multiple size variants
- [ ] Hero photo selection interface
- [ ] Photo gallery component for entries
- [ ] Integration with entry creation and display

#### Phase 2B: GPS Integration (Days 10-11) 📅 PLANNED  
- [ ] Garmin Connect API integration
- [ ] Strava API fallback implementation
- [ ] Manual location entry interface with Google Places
- [ ] Google Maps route visualization
- [ ] GPS data storage and display in entries

#### Phase 2C: Enhanced Family Interface (Days 12-14) 📅 PLANNED
- [ ] Interactive map view with journey pins
- [ ] Entry pagination and search functionality
- [ ] Share individual entry links
- [ ] Mobile PWA enhancements
- [ ] Final testing and production deployment

## Current Status Summary

### ✅ COMPLETED (Phase 1A & 1B)
- **Full-stack application** with Next.js 15, TypeScript, Tailwind CSS
- **Complete authentication system** with NextAuth.js and role-based access
- **Database layer** with Prisma ORM and comprehensive schema
- **Entry management** - Create, view, list, privacy controls
- **Public family viewing** - No login required, responsive design
- **Deployment ready** - Vercel configuration and environment setup

### 🚧 IN PROGRESS (Phase 1C)
- **Audio processing pipeline** - File upload, transcription, text cleanup

### 📅 UPCOMING (Phase 2A-2C)
- **Photo management** - Upload, optimization, gallery display
- **GPS integration** - Route data from Garmin/Strava APIs
- **Enhanced features** - Map view, search, PWA capabilities

## Offline-First Architecture

### Service Worker Implementation
```typescript
// Key offline capabilities:
- Cache static assets (CSS, JS, images)
- Cache API responses for entries
- Queue failed uploads for retry
- Store draft entries in IndexedDB
- Background sync when connection returns
```

### Local Storage Strategy
- **Draft Entries**: Save to IndexedDB every 30 seconds
- **Photo Uploads**: Queue with retry mechanism
- **Audio Files**: Compress and queue for upload
- **User Sessions**: Persist JWT tokens securely

## Error Handling & Fallback Strategies

### Transcription Services (Priority Order)
1. **Primary**: AssemblyAI Speech-to-Text API
2. **Fallback 1**: OpenAI Whisper API
3. **Fallback 2**: Google Cloud Speech-to-Text
4. **Manual**: Text input if all services fail

### GPS Data Sources (Priority Order)
1. **Primary**: Garmin Connect API
2. **Fallback 1**: Strava API
3. **Manual**: Location input with Google Places autocomplete

### File Upload Resilience
- Automatic retry with exponential backoff
- Chunked uploads for large files
- Progress persistence across page refreshes
- Upload resume capability

## Performance Optimization Checklist

### Image Handling
- [ ] Client-side compression before upload (Phase 2A)
- [ ] Multiple image sizes (thumbnail, medium, full) (Phase 2A)
- [ ] Lazy loading for gallery views (Phase 2A)
- [ ] WebP format with JPEG fallback (Phase 2A)

### API Performance
- [x] Database query optimization with Prisma
- [x] Efficient data fetching with includes/selects
- [ ] Response caching with appropriate TTL (Phase 2C)
- [ ] API rate limiting and throttling (Phase 2C)
- [x] Static asset optimization via Vercel CDN

### Mobile Optimization
- [x] Touch-friendly interfaces with Tailwind CSS
- [x] Responsive design for all screen sizes
- [ ] Offline-first functionality with service workers (Phase 1C)
- [ ] Background sync for failed uploads (Phase 1C)
- [x] Battery-efficient client-side processing

## Security & Privacy Requirements

### Authentication & Authorization
- [x] JWT tokens with NextAuth.js session management
- [x] Password hashing with bcryptjs (12 rounds)
- [x] Role-based access control (PILGRIM role for entry creation)
- [x] Route protection via middleware
- [x] Session persistence and secure cookies

### Data Protection
- [x] Input validation and sanitization on API routes
- [x] SQL injection prevention via Prisma ORM
- [x] XSS protection with React's built-in escaping
- [x] HTTPS enforcement (automatic via Vercel)
- [x] Environment variable security for API keys

### Privacy Controls
- [x] Granular privacy settings per entry (public/private toggle)
- [x] Public family viewing without authentication
- [ ] Secure photo URLs with expiration (Phase 2A)
- [ ] GDPR compliance features (Phase 2C)
- [ ] Data export functionality (Phase 2C)

## Testing Strategy

### Unit Tests (Jest + Testing Library) 📅 PLANNED
- [ ] API route handlers testing (Phase 1C)
- [ ] Transcription service functions (Phase 1C)
- [ ] Text cleanup utilities (Phase 1C)
- [ ] Authentication helpers (Phase 2C)

### Integration Tests (Playwright) 📅 PLANNED
- [ ] Complete entry creation workflow (Phase 1C)
- [ ] Audio upload and processing (Phase 1C)
- [ ] Photo upload and processing (Phase 2A)
- [ ] Family viewing experience (Phase 2C)
- [ ] Mobile responsiveness (Phase 2C)

### Manual Testing Checklist ✅ BASIC TESTING DONE
- [x] iPhone Safari compatibility (entry creation form)
- [x] Desktop browser testing (Chrome, Safari, Firefox)
- [x] Authentication flow testing
- [x] Entry CRUD operations
- [x] Public family viewing
- [ ] Android Chrome compatibility (Phase 1C)
- [ ] Intermittent connectivity scenarios (Phase 1C)
- [ ] Large file upload handling (Phase 1C)

## API Integration Details

### AssemblyAI Configuration
```typescript
const assemblyConfig = {
  api_key: process.env.ASSEMBLYAI_API_KEY,
  language_code: 'en',  // Support for Spanish: 'es'
  punctuate: true,
  format_text: true,
  speaker_labels: false  // Single speaker expected
}
```

### Claude 3 Haiku Prompts
```typescript
const cleanupPrompt = `
Clean up this transcribed journal entry while maintaining the personal voice and style. 
Fix grammatical errors, add appropriate punctuation, and organize into readable paragraphs.
Preserve all factual information and personal details.
Keep the tone conversational and authentic.

Transcription: {transcription}
`;
```

### Google Maps Integration
- Static Maps API for route visualization
- Places API for location autocomplete
- Geocoding API for coordinate conversion
- Maps JavaScript API for interactive maps

## Deployment & DevOps

### Environment Configuration
```bash
# Required Environment Variables
DATABASE_URL=postgresql://...
ASSEMBLYAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_MAPS_API_KEY=...
GARMIN_CLIENT_ID=...
GARMIN_CLIENT_SECRET=...
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
BLOB_READ_WRITE_TOKEN=...
```

### Monitoring & Analytics
- Vercel Analytics for performance tracking
- Error tracking with Sentry (optional)
- API usage monitoring for cost control
- User engagement metrics

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching and retry logic
- **File Storage Costs**: Image compression and cleanup policies
- **Third-party Dependencies**: Multiple fallback services
- **Mobile Performance**: Progressive loading and offline support

### User Experience Risks
- **Complex Workflows**: Simplified, step-by-step interfaces
- **Technical Support**: Self-explanatory UI with helpful tooltips
- **Data Loss**: Automatic saves and backup strategies
- **Connectivity Issues**: Robust offline capabilities

## Success Metrics & KPIs

### Technical Metrics
- [ ] Page load time < 2 seconds
- [ ] Audio transcription accuracy > 95%
- [ ] File upload success rate > 99%
- [ ] Mobile responsiveness score > 90

### User Experience Metrics
- [ ] Entry creation time < 10 minutes
- [ ] Family engagement rate > 80%
- [ ] Mobile usability score > 4.5/5
- [ ] Support requests < 5% of user base

## Post-Launch Considerations

### Phase 3: Enhancements (Future)
- PWA capabilities for app-like experience
- Push notifications for family members
- Advanced photo organization and tagging
- Multi-language support (Spanish, French, German)
- Export functionality (PDF, EPUB)
- Social sharing capabilities

### Maintenance & Support
- Regular security updates
- API cost monitoring and optimization
- User feedback collection and implementation
- Performance monitoring and optimization
- Database backup and recovery procedures

---

**Last Updated**: July 30, 2025
**Status**: Phase 1B Complete - Ready for Phase 1C (Audio Processing)
**Development Progress**: 
- ✅ Phase 1A: Project Setup (2 days) - COMPLETE
- ✅ Phase 1B: Authentication & Entry Management (2 days) - COMPLETE  
- 🚧 Phase 1C: Audio Processing Pipeline (3 days) - NEXT
- 📅 Phase 2A-2C: Photos, GPS & Enhanced Features (7 days) - PLANNED

**Total Estimated Time**: 14 days (4 days completed, 10 days remaining)
**Development Approach**: Single developer + LLM assistance (Claude Code)