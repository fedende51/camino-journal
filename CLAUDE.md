# CLAUDE.md

Guidance for Claude Code and specialized agents working on the Camino de Santiago Journal App.

## Quick Start

**Read `ARCHITECTURE.md` first** - Contains detailed codebase structure, API patterns, database schema, and component organization to save time understanding the project.

## Project Overview

**Camino Journal App** - Pilgrims document their journey via voice recordings, photos, and GPS data. Family members follow along remotely.

**Current Status**: **FULLY FUNCTIONAL** - Core features implemented including photo management, Garmin GPS integration, and family interface. Simple text-based journal creation with Voice Memos transcription support.

## Tech Stack

Next.js 14, TypeScript, Tailwind CSS, Prisma + PostgreSQL, Vercel + Blob Storage  
APIs: Garmin Connect

## Core Workflows

**Pilgrim**: Write text (or paste from Voice Memos) → Upload photos → GPS from Garmin → Publish entry  
**Family**: Access journal via `journal/[slug]` → Browse entries (list/map) → View entry details

## Implemented Features

✅ **Authentication**: NextAuth v5 with email/password  
✅ **Entry Management**: Create, edit, draft, publish with privacy controls  
✅ **Text-Based Journal**: Simple text editor with Voice Memos transcription tip  
✅ **Photo Management**: Vercel Blob upload with hero image selection  
✅ **GPS Integration**: Garmin Connect API with encrypted credential storage  
✅ **Family Interface**: Shareable journal URLs with public entry browsing  
✅ **Search & Filtering**: Advanced search across entries with date/location filters  
✅ **Maps**: Leaflet integration showing journey routes and locations

## Key Implementation Notes

- **Mobile-first**: iPhone Chrome primary target
- **Garmin Integration**: `garmin-connect` JavaScript library, encrypted credentials in DB
- **Privacy Controls**: Entry-level public/private flags for family access
- **File Storage**: Direct Vercel Blob uploads with validation
- **Error Handling**: Structured API responses with proper status codes
- **Route Protection**: Middleware-based auth with role-based access

## Database Schema

Users (with journalSlug, garminEmail/Hash) → Entries (dayNumber, location, content, isPrivate) → Photos/GPSData

## Next Priority Areas

🔄 **PWA Features**: Service workers, offline sync, push notifications  
🔄 **Performance**: Image optimization, lazy loading, caching strategies  
🔄 **UX Enhancements**: Better mobile interactions, loading states  
🔄 **Voice Workflow**: Voice Memos integration guide and paste optimization

## Environment Variables

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=
GARMIN_ENCRYPTION_KEY=
```

## Agent Team

- `camino-ux-designer`: UX/UI analysis and improvements
- `camino-frontend-lead`: React/Next.js implementation  
- `camino-api-developer`: Backend APIs and integrations