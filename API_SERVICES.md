# API Services & Third-Party Integrations

## Summary of Services Required

### ✅ Required for MVP

| Service | Purpose | Cost | Sign Up Link |
|---------|---------|------|--------------|
| **Firebase** | Database, Storage, Auth | Free tier: 1GB storage, 10GB/month transfer, 20K writes/day | Already configured ✅ |
| **Resend** | Email notifications & reminders | Free: 100 emails/day, 3K emails/month | https://resend.com/signup |

### 🔧 Optional (Recommended)

| Service | Purpose | Cost | Sign Up Link |
|---------|---------|------|--------------|
| **Google Maps API** | GPS validation, geocoding | Free: 28K map loads/month | https://console.cloud.google.com/ |
| **what3words** | Three-word address locations | Free: 25K API calls/month | https://what3words.com/select-plan |
| **Sentry** | Error tracking & monitoring | Free: 5K errors/month | https://sentry.io/signup/ |

---

## Detailed Service Breakdown

### 1. Firebase (Already Configured)

**What it provides:**
- **Firestore Database** - NoSQL database for all app data
- **Firebase Storage** - File storage for photos, documents, PDFs
- **Firebase Auth** - User authentication with MFA support
- **Cloud Functions** - Serverless functions for scheduled tasks (future)

**Free Tier Limits:**
- 1GB database storage
- 10GB/month bandwidth
- 20,000 document writes/day
- 50,000 document reads/day
- 5GB file storage
- 1GB/day file downloads

**Paid Tier (Blaze):**
- Pay-as-you-go after free tier
- Typical small site: ~£5-15/month
- Typical multi-site org: ~£20-50/month

**Your Configuration:**
- Project ID: `fire-235c2`
- Region: Should be `europe-west2` (London) for UK data residency
- Already configured in `.env.local`

**Setup Required:**
- ✅ Project created
- ⏳ Enable Firestore Database
- ⏳ Enable Storage
- ⏳ Enable Authentication
- ⏳ Download service account JSON
- ⏳ Deploy security rules

---

### 2. Resend (Email Service)

**What it provides:**
- Transactional email sending
- Email delivery infrastructure
- Email templates
- Delivery analytics

**Use Cases:**
- Task assignment notifications
- Pre-due reminders (24h, 1h before due)
- Overdue escalations to managers
- Weekly/monthly digest emails
- Defect alerts
- Training due reminders

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- 1 verified domain
- Test mode with `onboarding@resend.dev`

**Paid Tier:**
- $20/month: 50K emails/month
- $80/month: 200K emails/month

**Typical Usage (Small Org):**
- 10 users × 5 checks/week = 50 checks/week
- Reminders: 100 emails/week
- Escalations: 20 emails/week
- Digests: 10 emails/week
- **Total: ~600 emails/month** (well within free tier)

**Setup:**
1. Sign up at https://resend.com/signup
2. Generate API key
3. Add to `.env.local`
4. (Optional) Add custom domain for production

---

### 3. Google Maps API (Optional - Recommended)

**What it provides:**
- **Geocoding API** - Convert addresses to lat/lng
- **Reverse Geocoding** - Convert GPS to addresses
- **Maps JavaScript API** - Display site locations on maps
- **Geolocation API** - Verify user is at site (geo-fencing)

**Use Cases:**
- Validate check was performed at correct site
- Geo-fencing (optional): warn if GPS outside site radius
- Display site locations on dashboard map
- Convert postcodes to coordinates

**Free Tier:**
- $200 credit/month (never expires)
- ~28,000 map loads/month free
- ~40,000 geocoding requests/month free

**Typical Usage:**
- Map displays: 100-500/month
- Geocoding (new sites): 10-20/month
- GPS validation: Every check = 1K-5K/month
- **Total cost: $0/month for small orgs**

**Setup:**
1. Go to https://console.cloud.google.com/
2. Create project (or use existing)
3. Enable Maps JavaScript API & Geocoding API
4. Create API key
5. Restrict key to your domain/app
6. Add to `.env.local`

---

### 4. what3words API (Optional)

**What it provides:**
- Convert GPS coordinates to 3-word addresses
- Convert 3-word addresses to coordinates
- E.g., `///filled.count.soap` = specific 3m² location

**Use Cases:**
- Precise asset location identification
- Easier location communication for staff
- Alternative to complex building/floor/room descriptions

**Free Tier:**
- 25,000 API calls/month
- Sufficient for most use cases

**Paid Tier:**
- £250/month for 100K calls
- Only needed for very large deployments

**Typical Usage:**
- Asset registration: 50-100 calls/month
- Check location display: 500-1K calls/month
- **Total: Well within free tier**

**Setup:**
1. Sign up at https://what3words.com/select-plan
2. Choose free tier
3. Create API key
4. Add to `.env.local`

---

### 5. Sentry (Optional - Recommended for Production)

**What it provides:**
- Error tracking and monitoring
- Performance monitoring
- Release tracking
- User feedback

**Use Cases:**
- Catch production errors before users report them
- Monitor app performance
- Track error rates after deployments
- Debug issues with stack traces

**Free Tier:**
- 5,000 errors/month
- 10,000 performance transactions/month
- 1 project
- 1 team member

**Paid Tier:**
- $29/month: 50K errors/month
- Only needed if you exceed free tier

**Setup:**
1. Sign up at https://sentry.io/signup/
2. Create Next.js project
3. Follow integration instructions
4. Add DSN to `.env.local`

---

## Environment Variables Summary

Here's every env var you might need:

```bash
# ============= REQUIRED =============

# Firebase (Already configured)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyB2_3a2BOEsqsGdb-Cy0urSo_mSmfFd_Ug"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="fire-235c2.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="fire-235c2"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="fire-235c2.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="447709297649"
NEXT_PUBLIC_FIREBASE_APP_ID="1:447709297649:web:f487e77c340a31704c6250"

# Firebase Admin (Server-side)
FIREBASE_PRIVATE_KEY="..." # Get from service account JSON
FIREBASE_CLIENT_EMAIL="..." # Get from service account JSON

# Resend Email
RESEND_API_KEY="re_..." # Get from resend.com
EMAIL_FROM="Fire Safety <noreply@yourdomain.com>"

# Security
JWT_SECRET="..." # Generate random
ENCRYPTION_KEY="..." # Generate random

# ============= OPTIONAL =============

# Google Maps (Optional but recommended)
GOOGLE_MAPS_API_KEY="AIza..."

# what3words (Optional)
WHAT3WORDS_API_KEY="..."

# Sentry Error Tracking (Optional but recommended for production)
SENTRY_DSN="https://...@....ingest.sentry.io/..."

# Application
NODE_ENV="development" # or "production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="Europe/London"
```

---

## Cost Estimation

### Small Organisation (1-2 sites, 5-10 users)
- Firebase: **£0/month** (within free tier)
- Resend: **£0/month** (within free tier)
- Google Maps: **£0/month** (within free tier)
- what3words: **£0/month** (within free tier)
- Sentry: **£0/month** (within free tier)
- **Total: £0/month**

### Medium Organisation (5-10 sites, 20-50 users)
- Firebase: **£10-30/month** (storage & bandwidth)
- Resend: **£0-20/month** (might exceed 3K emails)
- Google Maps: **£0/month** (still within free tier)
- what3words: **£0/month**
- Sentry: **£0/month**
- **Total: £10-50/month**

### Large Organisation (20+ sites, 100+ users)
- Firebase: **£50-150/month**
- Resend: **£20-80/month**
- Google Maps: **£0-20/month**
- what3words: **£0-250/month** (if heavy usage)
- Sentry: **£0-29/month**
- **Total: £70-529/month**

---

## Migration Path (If Needed Later)

Firebase is great for MVP, but if you need to migrate later:

### Alternative Databases
- **PostgreSQL + PostGIS** (self-hosted or Railway/Render)
  - Better for complex queries
  - Relational data
  - ~£10-50/month hosted

- **Supabase** (Firebase alternative)
  - PostgreSQL + Storage + Auth
  - More SQL-like
  - Similar pricing to Firebase

### Alternative Storage
- **Cloudflare R2** (S3-compatible)
  - No egress fees
  - £0.015/GB storage
  - Cheaper for large files

- **AWS S3**
  - £0.023/GB
  - Industry standard

### Alternative Email
- **SendGrid** (similar to Resend)
- **AWS SES** (cheaper for volume)
- **Postmark** (transactional focus)

**Note:** For MVP, stick with Firebase + Resend. Easy to migrate later if needed.

---

## Quick Start Checklist

For MVP, you only need:

1. ✅ Firebase project (you have this)
2. ⏳ Enable Firestore Database
3. ⏳ Enable Firebase Storage
4. ⏳ Enable Firebase Auth
5. ⏳ Get service account JSON
6. ⏳ Sign up for Resend
7. ⏳ Get Resend API key
8. ⏳ Add both to `.env.local`
9. ⏳ Deploy security rules
10. ⏳ Run `npm install && npm run dev`

**That's it!** Everything else is optional for MVP.
