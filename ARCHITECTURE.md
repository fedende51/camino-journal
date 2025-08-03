# Camino Journal App - Architecture Reference

> Quick reference for agents to understand codebase structure without reading all files

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript  
- **Database**: Prisma + PostgreSQL
- **Auth**: NextAuth v5 (JWT sessions)
- **Storage**: Vercel Blob (photos)
- **External APIs**: Garmin Connect
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet

## Database Schema (Prisma)
```
User (id, email, role, garminEmail/Hash, journalSlug)
├── Entry (dayNumber, date, location, content, isPrivate)
    ├── Photo (blobUrl, filename, isHero)
    └── GPSData (start/endLocation, distance, elevation, heartRate)
```

**User Roles**: `PILGRIM` (creates entries) | `FAMILY` (views entries)

## API Routes (`/app/api/`)
```
auth/[...nextauth]     → NextAuth handlers
entries/               → CRUD operations (GET: public+private filtering)
entries/[id]           → Individual entry operations  
entries/search         → Search with filters
upload/photos          → Vercel Blob photo upload
garmin/credentials     → Store encrypted Garmin login
garmin/activities      → Fetch GPS data from Garmin
user/profile           → User settings
user/journal-settings  → Journal configuration
register               → User registration
health                 → Health check
```

## Authentication Patterns
- **Public Routes**: `/`, `/journal/*`, `/entry/*`, `/login`, `/register`
- **Pilgrim Routes**: `/pilgrim/*` (requires auth + PILGRIM role)
- **API Protection**: Most endpoints use `auth()` session check
- **Privacy**: Entries have `isPrivate` flag for family access control

## Component Structure (`/components/`)
```
ui/                    → Reusable components (Button, Card, Input, etc.)
maps/                  → Leaflet map components
forms/                 → Form-specific components (GPSDataInput)
```

## Key Services (`/lib/services/`)
- **photoProcessor.ts**: Image processing utilities

## File Organization
```
app/
├── (pages)            → Next.js App Router pages
├── api/               → API route handlers
└── globals.css        → Global styles

lib/
├── auth.ts            → NextAuth configuration
├── prisma.ts          → Database client
├── utils/             → Utilities (encryption, slugs)
└── services/          → External API integrations

components/            → React components
middleware.ts          → Route protection logic
prisma/schema.prisma   → Database schema
```

## Key Patterns
- **Mobile-First**: iPhone Chrome primary target
- **Offline-Ready**: IndexedDB + service workers (PWA)
- **Error Handling**: Try-catch with structured responses
- **File Uploads**: Direct to Vercel Blob with validation
- **Encryption**: Garmin credentials encrypted in database
- **Privacy**: Entry-level public/private controls

## Environment Variables
```
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
BLOB_READ_WRITE_TOKEN, GARMIN_ENCRYPTION_KEY
```

## Common Workflows
**Pilgrim**: Write text (or paste from Voice Memos) → Upload photos → GPS from Garmin → Publish entry  
**Family**: Access journal via slug → Browse entries (list/map) → View details