# Deployment Guide

## Vercel Deployment Setup

### Prerequisites
1. Create a [Vercel account](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`

### Deploy to Vercel

1. **Connect to Vercel**:
   ```bash
   npx vercel --prod
   ```

2. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project settings → Environment Variables
   - Add all variables from `.env` file:
     - `DATABASE_URL` (will be PostgreSQL in production)
     - `ASSEMBLYAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `GOOGLE_MAPS_API_KEY`
     - `GARMIN_CLIENT_ID`
     - `GARMIN_CLIENT_SECRET`
     - `STRAVA_CLIENT_ID`
     - `STRAVA_CLIENT_SECRET`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (your vercel app URL)
     - `BLOB_READ_WRITE_TOKEN`

3. **Database Setup for Production**:
   - In Vercel Dashboard → Storage → Create Database → PostgreSQL
   - Copy the connection string to `DATABASE_URL` environment variable
   - Update `prisma/schema.prisma` datasource to use PostgreSQL:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - Run database migration:
     ```bash
     npx prisma db push
     ```

4. **Set up Vercel Blob Storage**:
   - In Vercel Dashboard → Storage → Create Blob Store
   - Copy the `BLOB_READ_WRITE_TOKEN` to environment variables

### API Keys Setup

1. **AssemblyAI**: Sign up at https://www.assemblyai.com/
2. **Anthropic**: Get API key from https://console.anthropic.com/
3. **Google Maps**: Enable Maps API at https://console.cloud.google.com/
4. **Garmin Connect**: Apply for developer access
5. **Strava**: Create app at https://developers.strava.com/

### Domain Configuration
- Custom domain can be added in Vercel Dashboard → Domains
- SSL is automatically configured by Vercel

### Deployment Commands
```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Environment variables
vercel env add
```

## Local Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Database commands**:
   ```bash
   npm run db:push      # Push schema changes
   npm run db:generate  # Generate Prisma client
   npm run db:studio    # Open Prisma Studio
   ```

3. **Build and test**:
   ```bash
   npm run build        # Production build
   npm run type-check   # TypeScript check
   npm run lint         # ESLint check
   ```

## Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] PostgreSQL database connected and migrated
- [ ] Vercel Blob Storage configured
- [ ] All API keys working and within rate limits
- [ ] Custom domain configured (optional)
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Analytics configured (Vercel Analytics included)


# DB Admin credentials
Go to http://localhost:8080 and login with:
  - System: PostgreSQL
  - Server: postgres
  - Username: camino_user
  - Password: camino_secure_password_2024
  - Database: camino_journal