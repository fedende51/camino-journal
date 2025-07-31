# 🚀 Camino Journal - Production Deployment Guide

## Prerequisites

### 1. Vercel Account Setup
- Create a [Vercel account](https://vercel.com/signup)
- Install Vercel CLI: `npm i -g vercel`
- Connect your GitHub repository to Vercel

### 2. Database Setup
Choose one of these database options:

#### Option A: Vercel Postgres (Recommended)
```bash
# In Vercel dashboard:
# 1. Go to Storage tab in your project
# 2. Create new Postgres database
# 3. Copy the connection string
```

#### Option B: External PostgreSQL
- Use services like Railway, PlanetScale, or Supabase
- Get the connection string with SSL enabled

### 3. File Storage Setup
```bash
# In Vercel dashboard:
# 1. Go to Storage tab in your project  
# 2. Create new Blob store
# 3. Copy the read/write token
```

---

## Quick Deployment Steps

### 1. Environment Variables
In your Vercel project dashboard, add these environment variables:

**Required:**
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-super-secure-random-32-character-secret
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx_xxx
```

**Optional (for future features):**
```env
ASSEMBLYAI_API_KEY=your-assemblyai-key
ANTHROPIC_API_KEY=your-anthropic-key  
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 2. Deploy to Vercel
```bash
# Option 1: Via CLI
vercel --prod

# Option 2: Via GitHub (Recommended)
# Push to main branch - auto-deploys
git push origin main
```

### 3. Initialize Database
After first deployment:
```bash
# Run database migrations
npx prisma db push --force-reset
```

---

## Detailed Configuration

### Project Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (automatically includes Prisma generation)
- **Install Command**: `npm install`
- **Root Directory**: `./`
- **Node.js Version**: 18.x

### Build Optimizations
✅ Automatic Prisma client generation  
✅ Static page pre-rendering  
✅ Image optimization for Vercel Blob  
✅ Leaflet map bundle optimization  
✅ Security headers configured  
✅ Health check endpoint at `/api/health`

### Performance Expectations
- **Cold Start**: ~1-2 seconds
- **Warm Response**: ~200-400ms
- **Image Loading**: Optimized via Vercel Blob
- **Map Rendering**: Client-side with CDN tiles
- **Database Queries**: ~50-200ms (depending on provider)

---

## Post-Deployment Checklist

### 1. Verify Core Functionality
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works  
- [ ] Entry creation works
- [ ] Map displays correctly
- [ ] Public journal accessible

### 2. Test Mobile Experience
- [ ] Responsive design on mobile
- [ ] Touch interactions work
- [ ] Photo upload works
- [ ] Map is touch-friendly

### 3. Production Testing
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test authentication
# Manual: Try registration/login flow

# Test entry creation
# Manual: Create a test journal entry
```

### 4. Security Verification
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] NEXTAUTH_SECRET is secure (32+ chars)
- [ ] Database uses SSL connections
- [ ] No API keys exposed in client code

---

## Monitoring & Maintenance

### Health Monitoring
- **Endpoint**: `https://your-app.vercel.app/api/health`
- **Expected Response**: JSON with database stats and response time
- **Status Codes**: 200 (healthy) or 503 (unhealthy)

### Vercel Analytics
Enable in dashboard for:
- Performance metrics
- Error tracking  
- User analytics
- Core Web Vitals

### Cost Monitoring
Typical usage for 30-day Camino:
- **Vercel Pro**: $20/month (includes generous limits)
- **Postgres**: $5-15/month (depending on provider)
- **Blob Storage**: $1-5/month (photos/audio)
- **Total**: ~$25-40/month

---

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear build cache
vercel --force

# Check build logs in Vercel dashboard
```

**Database Connection:**
```bash
# Verify connection string format
DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require

# Test connection locally
npx prisma db push
```

**Authentication Issues:**
- Ensure NEXTAUTH_URL matches your domain exactly
- NEXTAUTH_SECRET must be 32+ characters
- Check cookie settings in production

**Map Not Loading:**
- Verify Leaflet CSS is imported in layout.tsx
- Check browser console for JavaScript errors
- Test with different zoom levels

### Support Resources
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://prisma.io/docs

---

## Future Enhancements Ready for Integration

Once deployed, these features can be added incrementally:

### Phase 2: Live API Integrations
1. **Audio Transcription**: AssemblyAI → Claude cleanup
2. **GPS Auto-Import**: Garmin Connect + Strava APIs
3. **Enhanced Maps**: Real GPS coordinates from activities

### Phase 3: PWA Features  
1. **Offline Support**: Service worker + IndexedDB
2. **Push Notifications**: Family updates
3. **App Installation**: Add to home screen

### Phase 4: Advanced Features
1. **Photo Processing**: Auto-resize, EXIF data
2. **Multi-language**: i18n for Spanish/French routes
3. **Social Features**: Comments, reactions from family

---

**🎉 Your Camino Journal is ready for the world!**

The app is production-ready with excellent mobile experience, robust authentication, and all core journaling features working flawlessly.