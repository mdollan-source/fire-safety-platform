# 🚀 Pre-Deployment Checklist - Coolify/Hetzner VPS

**Target**: Production deployment via Coolify on Hetzner VPS
**Status**: Awaiting DNS propagation

---

## ⚠️ CRITICAL - DO THESE FIRST

### 1. 🔒 Security & Data Migration (MUST DO BEFORE DEPLOYMENT)

#### Step 1.1: Set up Firebase Admin credentials
```bash
# Get service account key from Firebase Console
# Project Settings → Service Accounts → Generate New Private Key

# Set environment variable (choose your OS)
# Windows PowerShell:
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"

# Windows CMD:
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json

# Mac/Linux:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

**Where to get:**
1. Go to: https://console.firebase.google.com/
2. Select your Fire Safety project
3. Settings (⚙️) → Project Settings
4. Service Accounts tab
5. Click "Generate New Private Key"
6. Save the JSON file securely (DO NOT commit to git!)

---

#### Step 1.2: Install ts-node (if not already)
```bash
npm install -D ts-node @types/node
```

---

#### Step 1.3: Check Data Migration Status
```bash
npm run security:migrate:check
```

**Expected Output:**
```
✅ All documents have orgId - Safe to deploy security rules
```

**If you see missing orgId fields:**
```bash
# Review the output carefully
# Then run migration in LIVE mode:
npm run security:migrate -- --live
```

**❌ DO NOT PROCEED if:**
- Any documents are missing orgId
- Migration shows errors
- You can't infer orgId for some documents

---

#### Step 1.4: Audit Client-Side Queries
```bash
npm run security:audit
```

**Expected Output:**
```
✅ No security issues found!
```

**If critical issues found:**
- Fix each query to use `querySecure` or add orgId filter
- Re-run audit until clean

---

#### Step 1.5: Deploy Security Rules
```bash
# Login to Firebase (if not already)
firebase login

# Deploy rules
npm run security:deploy
```

**Verify in Firebase Console:**
1. Go to Firestore Database → Rules
2. Check the rules were updated (timestamp should be recent)
3. Test in Rules Playground:
   - Try cross-org access (should fail)
   - Try same-org access (should succeed)

---

## 🔧 Environment & Configuration

### 2. Environment Variables Setup

#### Step 2.1: Create production .env file
Create `.env.production` (or configure in Coolify):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (Server-side only - DO NOT expose publicly)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**⚠️ IMPORTANT:**
- Never commit `.env.production` to git
- In Coolify, set these as Environment Variables in the app settings
- For `FIREBASE_PRIVATE_KEY`, ensure newlines are properly escaped (`\n`)

---

#### Step 2.2: Firebase Configuration Checklist
- [ ] Firebase project is in production mode (not test/development)
- [ ] Firebase Authentication enabled
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Custom claims setup for user roles
- [ ] Email templates configured
- [ ] Authorized domains includes your production domain

**Add production domain to Firebase:**
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain
3. Add: `yourdomain.com` (your actual domain)

---

### 3. DNS & Domain Configuration

#### Step 3.1: Verify DNS Propagation
```bash
# Check if DNS has propagated
nslookup yourdomain.com

# Or use online tools:
# https://www.whatsmydns.net/
```

**Wait until:**
- [ ] A record points to your Hetzner VPS IP
- [ ] Propagation is complete globally (can take 24-48 hours)

---

#### Step 3.2: SSL/TLS Certificate
Coolify should handle this automatically via Let's Encrypt, but verify:
- [ ] HTTPS is enabled in Coolify settings
- [ ] Certificate auto-renewal is enabled
- [ ] Domain is correctly configured in Coolify

---

## 🏗️ Build & Test

### 4. Local Production Build Test

```bash
# Clean build
rm -rf .next
npm run build
```

**Check for errors:**
- [ ] Build completes without errors
- [ ] No TypeScript errors (except pre-existing ones)
- [ ] PWA assets generated correctly

**Known acceptable errors:**
```
Type error in src/app/api/reports/generate/route.ts (pre-existing)
```

---

### 5. Test Production Build Locally

```bash
# Start production server
npm start
```

**Test these critical paths:**
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard accessible after login
- [ ] Can create/view sites
- [ ] Can create/view assets
- [ ] Can complete a check
- [ ] PWA manifest loads (check Network tab)
- [ ] Service worker registers (in production mode)

**Check browser console (F12):**
- [ ] No permission denied errors
- [ ] No Firebase errors
- [ ] PWA loads correctly

---

## 📦 Coolify Deployment Preparation

### 6. Coolify Configuration

#### Step 6.1: Create Coolify Project
1. Login to Coolify dashboard
2. Create new project
3. Connect to your Hetzner VPS
4. Add new application
5. Select "GitHub" as source
6. Connect to: `mdollan-source/fire-safety-platform`
7. Branch: `master`

---

#### Step 6.2: Configure Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:**
```
3000
```

---

#### Step 6.3: Set Environment Variables in Coolify

Go to: Application → Environment Variables

Add all variables from Step 2.1 above.

**Tips:**
- Use "Secret" option for sensitive values
- Double-check `FIREBASE_PRIVATE_KEY` formatting
- Ensure no extra spaces or quotes

---

### 7. Database & Storage Limits

#### Step 7.1: Check Firebase Quotas
Firebase Console → Usage and Billing

**Verify you have headroom:**
- [ ] Firestore: Not close to document read/write limits
- [ ] Storage: Not close to storage limits
- [ ] Authentication: Not close to user limits

**Consider upgrading plan if:**
- You're on Spark (free) plan
- Expecting high traffic
- Need more than 1GB storage

---

#### Step 7.2: Set up Billing Alerts
1. Firebase Console → Settings → Usage and Billing
2. Set up budget alerts
3. Recommended: Alert at 50%, 80%, 100% of budget

---

## 🔐 Security Final Checks

### 8. Security Verification

#### Step 8.1: Firestore Rules
```bash
# View current rules
cat firestore.rules | grep "allow read"
```

**Verify these are protected:**
- [ ] sites: `isOrgMember(resource.data.orgId)`
- [ ] assets: `isOrgMember(resource.data.orgId)`
- [ ] defects: `isOrgMember(resource.data.orgId)`
- [ ] entries: `isOrgMember(resource.data.orgId)`

---

#### Step 8.2: Storage Rules
```bash
# View current rules
cat storage.rules | grep "evidence"
```

**Verify:**
- [ ] Evidence files require orgId match
- [ ] 25MB file size limit enforced

---

#### Step 8.3: API Keys
- [ ] Firebase API key is restricted (if production)
- [ ] Resend API key has correct permissions
- [ ] No secrets in git history
- [ ] No secrets in environment variables exposed to client

**Restrict Firebase API Key (Recommended):**
1. Google Cloud Console → APIs & Services → Credentials
2. Find your Firebase API key
3. Add restrictions:
   - HTTP referrers: `yourdomain.com/*`
   - APIs: Only Firebase services

---

### 9. User Testing Accounts

Create test accounts for verification:

```bash
# Account A - Org 1
Email: test-org-a@yourdomain.com
Password: [secure password]
Role: responsible_person
Org: Create new org

# Account B - Org 2
Email: test-org-b@yourdomain.com
Password: [secure password]
Role: responsible_person
Org: Create new org
```

**After deployment, test:**
- [ ] Account A cannot see Account B's data
- [ ] Account B cannot see Account A's data
- [ ] Both can complete checks
- [ ] Offline mode works

---

## 📊 Monitoring & Logging

### 10. Set Up Monitoring

#### Step 10.1: Firebase Monitoring
- [ ] Enable Firebase Performance Monitoring
- [ ] Enable Firebase Crashlytics (optional)
- [ ] Set up email alerts for errors

#### Step 10.2: Coolify Monitoring
- [ ] Enable application logs in Coolify
- [ ] Set up resource monitoring
- [ ] Configure restart policies

#### Step 10.3: Uptime Monitoring
Consider setting up:
- UptimeRobot (free)
- Pingdom
- Better Uptime

Monitor:
- [ ] Homepage
- [ ] API health endpoint
- [ ] Login page

---

## 🎯 Pre-Flight Checklist Summary

### Critical (MUST DO):
- [ ] ✅ Data migration complete (all docs have orgId)
- [ ] ✅ Security rules deployed to Firebase
- [ ] ✅ Query audit shows zero critical issues
- [ ] ✅ Environment variables configured in Coolify
- [ ] ✅ Firebase authorized domains includes production domain
- [ ] ✅ DNS propagated to Hetzner VPS
- [ ] ✅ Local production build successful
- [ ] ✅ Production build tested locally

### Important (SHOULD DO):
- [ ] 🔒 Firebase API key restrictions set
- [ ] 📧 Email service (Resend) configured and tested
- [ ] 📊 Monitoring and alerts set up
- [ ] 💾 Database backup created
- [ ] 📱 PWA icons generated (icon-512.png)
- [ ] 🧪 Test accounts created in different orgs

### Nice to Have:
- [ ] 📈 Firebase Performance Monitoring enabled
- [ ] 🚨 Uptime monitoring configured
- [ ] 📝 Rollback plan documented
- [ ] 👥 Team notified of deployment

---

## 🚀 Deployment Day Checklist

### Just Before Deployment:

1. **Final git check:**
   ```bash
   git status  # Should be clean
   git log -1  # Verify latest commit
   ```

2. **Verify Coolify connection:**
   - [ ] GitHub webhook configured
   - [ ] Auto-deploy enabled (or manual trigger ready)

3. **Deploy:**
   - Push to master (already done ✅)
   - OR trigger manual deploy in Coolify

4. **Watch deployment logs:**
   - Monitor Coolify build logs
   - Watch for any errors
   - Typical deploy time: 5-10 minutes

---

### Immediately After Deployment:

1. **Verify app is accessible:**
   ```bash
   curl -I https://yourdomain.com
   # Should return: HTTP/2 200
   ```

2. **Check critical paths:**
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Can create/view data
   - [ ] PWA manifest available at /manifest.json

3. **Test cross-org security:**
   - [ ] Login with test Account A
   - [ ] Create test data
   - [ ] Login with test Account B
   - [ ] Verify cannot see Account A's data ✅

4. **Monitor for errors:**
   - Firebase Console → Logs
   - Coolify → Application Logs
   - Browser console (F12)

5. **Test offline mode (production build only):**
   - [ ] Turn off network
   - [ ] Complete a check
   - [ ] Turn on network
   - [ ] Verify sync occurs

---

## 📞 Emergency Contacts & Rollback

### If Deployment Fails:

**Rollback in Coolify:**
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

**Or revert git:**
```bash
git revert HEAD
git push
```

**Emergency Firebase Rules Rollback:**
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

---

## 📋 Post-Deployment

**Within 24 hours:**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backups are working
- [ ] Test all critical user flows
- [ ] Gather initial user feedback

**Within 1 week:**
- [ ] Review security logs
- [ ] Check resource usage
- [ ] Optimize if needed
- [ ] Plan next features

---

## 🎉 Ready to Deploy?

**You're ready when ALL critical items are checked! ✅**

**Good luck with your deployment! 🚀**

---

## Quick Commands Reference

```bash
# Security checks
npm run security:migrate:check    # Check data migration
npm run security:audit            # Audit queries
npm run security:deploy           # Deploy rules

# Build & test
npm run build                     # Production build
npm start                         # Test production locally

# Firebase
firebase login                    # Login to Firebase
firebase deploy --only firestore:rules,storage

# Git
git status                        # Check status
git push                          # Push to remote (already done ✅)
```
