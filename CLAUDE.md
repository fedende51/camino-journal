# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Camino de Santiago Journal App** - a web-based journaling application that allows Camino pilgrims to document their journey through voice recordings, photos, and GPS data, while enabling family members to follow along remotely.

**Current Status**: Planning phase complete, ready for implementation.

## Architecture & Tech Stack

**Core Framework**: Next.js 14 with App Router, TypeScript, Tailwind CSS
**Database**: Prisma ORM with PostgreSQL (SQLite for development)
**Hosting**: Vercel with Blob Storage for files
**Key APIs**: AssemblyAI (transcription), Claude 3 Haiku (text cleanup), Google Maps, Garmin Connect/Strava

**Architecture Pattern**: Offline-first PWA with role-based access control (pilgrim vs family users)

## Database Schema Structure

The app uses a relational structure with five main entities:
- **Users**: Pilgrim and family member authentication
- **Entries**: Daily journal entries with privacy controls (public/private)
- **Photos**: File storage with hero image selection per entry
- **AudioFiles**: Voice recordings with transcription storage
- **GPSData**: Route information from Garmin/Strava APIs

## Development Commands

**Initial Setup** (when starting implementation):
```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install prisma @prisma/client @auth/prisma-adapter
npm install @vercel/blob openai anthropic @google/maps
npx prisma init
```

**Development Workflow**:
```bash
npm run dev          # Start development server
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open database GUI
npm run build        # Production build
npm run lint         # ESLint checking
npm run type-check   # TypeScript checking (add to package.json)
```

## Core User Workflows

**Pilgrim Daily Workflow**:
1. Upload voice recording (.m4a from iPhone)
2. Auto-transcription via AssemblyAI → Claude cleanup
3. Upload photos to Vercel Blob → select hero image
4. GPS data auto-imported from Garmin/Strava
5. Set privacy level and publish entry

**Family Viewing Workflow**:
- Access via shared link (no registration required)
- View entries in List View (chronological) or Map View (geographic pins)
- Click through to photo galleries and route information

## Key Implementation Considerations

**Offline-First Architecture**:
- Service worker for caching and background sync
- IndexedDB for draft entries and failed uploads
- Retry mechanisms with exponential backoff

**API Integration Fallbacks**:
- Transcription: AssemblyAI → OpenAI Whisper → Google Speech-to-Text → Manual
- GPS Data: Garmin Connect → Strava → Manual location entry

**Mobile Optimization**:
- iPhone Safari as primary target
- Touch-friendly interfaces with large tap targets
- Image compression before upload
- Battery-efficient background processing

## Environment Variables Required

```bash
DATABASE_URL=
ASSEMBLYAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
GARMIN_CLIENT_ID=
GARMIN_CLIENT_SECRET=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=
```

## Development Phases

**Week 1**: Foundation & Core Entry System
- Day 1-2: Next.js setup, Prisma, Vercel deployment
- Day 3-4: Authentication, basic UI
- Day 5-7: Audio processing pipeline (upload → transcription → cleanup)

**Week 2**: Photos, GPS & Family Interface
- Day 8-9: Photo management and Blob Storage
- Day 10-11: GPS integration with maps
- Day 12-14: Family viewing interface and final testing

## File Organization Pattern

```
/app
  /(auth)           # Authentication routes
  /(pilgrim)        # Pilgrim-only pages (entry creation/editing)
  /(public)         # Family viewing pages (no auth required)
  /api              # API routes for all services
/components
  /ui               # Reusable UI components
  /forms            # Entry creation forms
  /maps             # GPS and route visualization
/lib
  /services         # API integrations (AssemblyAI, Claude, etc.)
  /utils            # Helper functions
/prisma
  schema.prisma     # Database schema
```

## Critical Design Principles

**Minimal Effort for Pilgrim**: Entry creation must be completable in under 10 minutes
**Family-Friendly**: Non-tech-savvy users can navigate without support
**Intermittent Connectivity**: Full offline capability with sync when connected
**Privacy-First**: Granular controls for public/private entries
**Mobile-First**: Optimized for iPhone Safari usage patterns

## Testing Strategy

Focus testing on:
- Complete entry creation workflow (audio → transcription → publish)
- Photo upload and processing under various network conditions
- Family viewing experience across devices
- Offline functionality and sync behavior
- Mobile Safari compatibility

## Cost Monitoring

Keep track of API usage:
- AssemblyAI: $0.12/hour (covered by $50 free credit)
- Claude 3 Haiku: $0.80/$4 per million tokens
- Vercel Blob Storage: Usage-based pricing
- Target total cost: $3-10 for entire Camino journey (30-40 days)

## Reference Documents

- `camino_journal_requirements.md`: Complete product specification
- `implementation_plan.md`: Detailed technical roadmap with database schema, API configurations, and phase-by-phase development plan