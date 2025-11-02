# Fire Safety Log Book - Complete Setup Guide

## Services Required & Sign-Up Links

### 1. Firebase (Already Set Up ✅)

You already have Firebase configured with:
- Project ID: `fire-235c2`
- Auth Domain: `fire-235c2.firebaseapp.com`
- Storage: `fire-235c2.firebasestorage.app`

**What you still need to do:**

#### A. Enable Firestore Database
1. Go to https://console.firebase.google.com/project/fire-235c2
2. Click **Firestore Database** in the left sidebar
3. Click **Create Database**
4. Choose **Start in production mode** (we have custom security rules)
5. Select location: **europe-west2 (London)** for UK data residency
6. Click **Enable**

#### B. Enable Firebase Storage
1. In Firebase Console, click **Storage**
2. Click **Get Started**
3. Choose **Start in production mode**
4. Select location: **europe-west2 (London)**
5. Click **Done**

#### C. Enable Authentication
1. Click **Authentication** → **Get Started**
2. Enable **Email/Password** sign-in method
3. Optional: Enable **Google** OAuth for SSO later

#### D. Get Service Account Key
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file as `firebase-service-account.json` (DO NOT commit to git!)
4. Copy the `private_key` and `client_email` values to your `.env.local`:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"
```

**Note:** The private key must keep the `\n` characters. Don't replace them with actual newlines.

---

### 2. Resend (Email Service)

**Sign up:** https://resend.com/signup

**Steps:**
1. Create a free account (100 emails/day free tier)
2. Verify your email
3. Go to **API Keys** in dashboard
4. Click **Create API Key**
5. Name it "Fire Safety Production" or "Fire Safety Dev"
6. Copy the key (starts with `re_...`)
7. Add to `.env.local`:

```bash
RESEND_API_KEY="re_your_key_here"
```

**Add Sending Domain (for production):**
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records they provide to your domain registrar
4. Wait for verification
5. Update `.env.local`:

```bash
EMAIL_FROM="Fire Safety <noreply@yourdomain.com>"
```

**For MVP/Testing:** You can use Resend's test email for now:
```bash
EMAIL_FROM="Fire Safety <onboarding@resend.dev>"
```

---

## Optional Services (Can Add Later)

### 3. Google Maps API (for GPS validation, geo-fencing)

**Sign up:** https://console.cloud.google.com/

**Steps:**
1. Create a Google Cloud project (or use existing)
2. Enable **Maps JavaScript API** and **Geocoding API**
3. Go to **Credentials**
4. Create **API Key**
5. Restrict key to your domain/IP for security
6. Add to `.env.local`:

```bash
GOOGLE_MAPS_API_KEY="AIza..."
```

**Pricing:** Free tier includes 28,000 map loads/month

---

### 4. what3words API (for three-word addresses)

**Sign up:** https://what3words.com/select-plan

**Steps:**
1. Choose free tier (25,000 API calls/month)
2. Create account
3. Generate API key
4. Add to `.env.local`:

```bash
WHAT3WORDS_API_KEY="your_key_here"
```

---

### 5. Sentry (Error Tracking)

**Sign up:** https://sentry.io/signup/

**Steps:**
1. Create free account (5,000 errors/month free)
2. Create new project → Choose **Next.js**
3. Copy the DSN (looks like `https://...@....ingest.sentry.io/...`)
4. Add to `.env.local`:

```bash
SENTRY_DSN="https://...@....ingest.sentry.io/..."
```

---

## Complete .env.local Template

Here's what your `.env.local` should look like:

```bash
# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyB2_3a2BOEsqsGdb-Cy0urSo_mSmfFd_Ug"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="fire-235c2.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="fire-235c2"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="fire-235c2.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="447709297649"
NEXT_PUBLIC_FIREBASE_APP_ID="1:447709297649:web:f487e77c340a31704c6250"

# Server-side Firebase Admin (get from Firebase Console)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"

# =============================================================================
# RESEND (Email Notifications) - REQUIRED
# =============================================================================
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="Fire Safety <noreply@yourdomain.com>"

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="Europe/London"

# Security - Generate random values for production
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="generate_a_random_256_bit_secret_here"
ENCRYPTION_KEY="generate_another_random_256_bit_secret_here"

# =============================================================================
# OPTIONAL APIs (Can add later)
# =============================================================================
# GOOGLE_MAPS_API_KEY="AIza..."
# WHAT3WORDS_API_KEY="..."
# SENTRY_DSN="https://...@....ingest.sentry.io/..."
```

---

## Installation Steps

### 1. Install Node.js Dependencies

```bash
npm install
```

If you get any errors, try:
```bash
npm install --legacy-peer-deps
```

### 2. Generate Security Secrets

Generate random secrets for JWT and encryption:

```bash
# On Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice and use the outputs for `JWT_SECRET` and `ENCRYPTION_KEY` in `.env.local`.

### 3. Deploy Firebase Security Rules

Install Firebase CLI:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
firebase init
```

Select:
- **Firestore** (press Space to select, Enter to confirm)
- **Storage**
- Use existing project: **fire-235c2**
- Firestore rules file: **firestore.rules** (default)
- Firestore indexes file: **firestore.indexes.json** (default)
- Storage rules file: **storage.rules** (default)

Deploy the security rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Verify Setup Checklist

- [ ] Firebase project created and configured
- [ ] Firestore Database enabled (europe-west2)
- [ ] Firebase Storage enabled (europe-west2)
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Service account JSON downloaded
- [ ] `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` added to `.env.local`
- [ ] Resend account created
- [ ] Resend API key added to `.env.local`
- [ ] `JWT_SECRET` and `ENCRYPTION_KEY` generated
- [ ] `npm install` completed successfully
- [ ] Firebase CLI installed
- [ ] Firestore and Storage security rules deployed
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Home page loads at http://localhost:3000

---

## Common Issues & Solutions

### Issue: "Missing FIREBASE_PRIVATE_KEY"

**Solution:** Make sure you've copied the private key from the service account JSON file, and kept the `\n` characters in the key. Don't replace them with actual newlines.

### Issue: "Permission denied" in Firestore

**Solution:** Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### Issue: npm install fails

**Solution:** Try:
```bash
npm install --legacy-peer-deps
```

Or use Node.js 18 LTS:
```bash
node --version  # Should be 18.x or 20.x
```

### Issue: Can't send emails with Resend

**Solution:**
1. Check API key is correct in `.env.local`
2. For testing, use `onboarding@resend.dev` as the FROM address
3. For production, add and verify your domain in Resend dashboard

---

## Next Steps After Setup

1. **Create seed data** - Add your first organisation, sites, and assets
2. **Test authentication** - Create user accounts with different roles
3. **Test offline mode** - Try completing checks with network disabled
4. **Configure notifications** - Set up email reminders and escalations
5. **Generate test reports** - Create compliance packs for audit

---

## Production Deployment

When ready to deploy:

1. **Update environment variables** for production
2. **Deploy to Vercel/Railway/your hosting provider**
3. **Set up custom domain**
4. **Configure Resend with verified domain**
5. **Enable Firebase production quotas**
6. **Set up monitoring** (Sentry recommended)
7. **Run security audit**
8. **Load test** with expected user volumes

---

## Support

For issues or questions about setup:
- Check the main README.md
- Review Firebase documentation: https://firebase.google.com/docs
- Review Resend documentation: https://resend.com/docs
- Contact the development team
