# Quick Start Guide - Fire Safety Log Book

Get up and running in 10 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Firebase account (you have project: `fire-235c2`)
- Resend account (for emails)

---

## Step 1: Install Dependencies (2 min)

```bash
cd C:\Users\Mark\dev\Fire
npm install
```

---

## Step 2: Firebase Setup (5 min)

### A. Enable Services

Go to https://console.firebase.google.com/project/fire-235c2

1. **Firestore Database**
   - Click **Firestore Database** → **Create database**
   - Choose **Production mode**
   - Location: **europe-west2 (London)**
   - Click **Enable**

2. **Storage**
   - Click **Storage** → **Get started**
   - Choose **Production mode**
   - Location: **europe-west2**
   - Click **Done**

3. **Authentication**
   - Click **Authentication** → **Get started**
   - Enable **Email/Password**
   - Click **Save**

### B. Get Service Account

1. Click **⚙️ (gear icon)** → **Project settings**
2. Go to **Service accounts** tab
3. Click **Generate new private key** → **Generate key**
4. Save the JSON file (don't commit to git!)
5. Open the file and copy `private_key` and `client_email`
6. Add to `.env.local`:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"
```

### C. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (use existing project: fire-235c2)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## Step 3: Resend Setup (2 min)

1. Sign up at https://resend.com/signup
2. Verify your email
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_...`)
5. Add to `.env.local`:

```bash
RESEND_API_KEY="re_your_key_here"
EMAIL_FROM="Fire Safety <onboarding@resend.dev>"
```

---

## Step 4: Security Secrets (1 min)

Generate random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run twice and add to `.env.local`:

```bash
JWT_SECRET="first_random_output_here"
ENCRYPTION_KEY="second_random_output_here"
```

---

## Step 5: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

You should see the homepage with no errors!

---

## Verify Setup

### ✅ Checklist

- [ ] Firebase Firestore enabled
- [ ] Firebase Storage enabled
- [ ] Firebase Auth enabled
- [ ] Service account JSON downloaded
- [ ] `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` in `.env.local`
- [ ] Resend API key in `.env.local`
- [ ] `JWT_SECRET` and `ENCRYPTION_KEY` generated
- [ ] Security rules deployed
- [ ] Dev server runs (`npm run dev`)
- [ ] Homepage loads at http://localhost:3000
- [ ] No errors in browser console (F12)

---

## Your Complete .env.local

Should look like this:

```bash
# Firebase (Already configured)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyB2_3a2BOEsqsGdb-Cy0urSo_mSmfFd_Ug"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="fire-235c2.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="fire-235c2"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="fire-235c2.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="447709297649"
NEXT_PUBLIC_FIREBASE_APP_ID="1:447709297649:web:f487e77c340a31704c6250"

# Firebase Admin (Server-side)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"

# Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="Fire Safety <onboarding@resend.dev>"

# Security
JWT_SECRET="your_random_secret_here"
ENCRYPTION_KEY="your_random_secret_here"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="Europe/London"
```

---

## Common Issues

### "Missing FIREBASE_PRIVATE_KEY"
- Check you copied the entire key including `-----BEGIN...` and `-----END...`
- Keep the `\n` characters in the key
- Wrap in double quotes

### "Permission denied"
- Deploy security rules: `firebase deploy --only firestore:rules`

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Then run dev again
npm run dev
```

---

## Next Steps

Now that setup is complete:

1. **Build authentication** - Sign up/sign in UI
2. **Create first org** - Organisation and site management
3. **Add assets** - Fire doors, alarms, etc.
4. **Schedule checks** - Set up recurring tasks
5. **Complete a check** - Test offline functionality
6. **View dashboard** - See KPIs and compliance status

See `PROJECT_STATUS.md` for full roadmap.

---

## Need Help?

- **Firebase issues** → See `FIREBASE_SETUP.md`
- **Service setup** → See `API_SERVICES.md`
- **General setup** → See `SETUP.md`
- **Project overview** → See `README.md`

---

**You're all set!** Start building the authentication system next.
