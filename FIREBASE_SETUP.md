# Firebase Setup - Step-by-Step Guide

## Your Firebase Project

- **Project ID:** `fire-235c2`
- **Console URL:** https://console.firebase.google.com/project/fire-235c2

---

## Step 1: Enable Firestore Database

1. Go to https://console.firebase.google.com/project/fire-235c2
2. Click **Firestore Database** in the left sidebar (under "Build")
3. Click **Create database**
4. Choose **Start in production mode**
   - Don't worry, we have custom security rules that will be deployed
5. Select location: **eur3 (europe-west)** or **europe-west2** for UK data residency
6. Click **Enable**
7. Wait 1-2 minutes for provisioning

**Result:** You'll see an empty Firestore database with a "Start collection" button.

---

## Step 2: Enable Firebase Storage

1. Still in Firebase Console, click **Storage** in the left sidebar
2. Click **Get started**
3. Review security rules, click **Next**
4. Select location: **europe-west2 (London)** for UK data residency
5. Click **Done**

**Result:** You'll see an empty storage bucket at `fire-235c2.firebasestorage.app`

---

## Step 3: Enable Authentication

1. Click **Authentication** in the left sidebar
2. Click **Get started**
3. Click **Email/Password** provider
4. Toggle **Enable** to ON
5. Leave "Email link (passwordless sign-in)" OFF for now
6. Click **Save**

**Optional - Enable Google OAuth (for SSO later):**
1. Click **Google** provider
2. Toggle **Enable** to ON
3. Add support email: your@email.com
4. Click **Save**

**Result:** Email/Password authentication is now enabled.

---

## Step 4: Get Service Account Key

**Important:** This key gives admin access to your Firebase project. Never commit it to git!

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **Project settings**
3. Go to **Service accounts** tab
4. Click **Generate new private key**
5. Confirm by clicking **Generate key**
6. A JSON file will download (e.g., `fire-235c2-firebase-adminsdk-xxxxx.json`)
7. **SAVE THIS FILE SECURELY** - do not commit to git!

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "fire-235c2",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@fire-235c2.iam.gserviceaccount.com",
  ...
}
```

8. Open the file and copy two values:
   - `private_key` (the entire string including `-----BEGIN...`)
   - `client_email`

9. Add to your `.env.local` file:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_FULL_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"
```

**Important Notes:**
- The private key must keep the `\n` characters - don't replace them with actual newlines
- Wrap the entire key in quotes
- Add `firebase-service-account.json` to `.gitignore` (already done)

---

## Step 5: Deploy Security Rules

Our security rules enforce:
- Multi-tenant isolation (users only see their org's data)
- Role-based access control (Responsible Person, Site Manager, etc.)
- Immutable audit records
- Site-level permissions

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

This will open a browser window. Sign in with the same Google account you used for Firebase Console.

### Initialize Firebase in Your Project

```bash
cd C:\Users\Mark\dev\Fire
firebase init
```

You'll see an interactive prompt:

1. **Which Firebase features?**
   - Use arrow keys to navigate
   - Press **Space** to select:
     - ✅ Firestore
     - ✅ Storage
   - Press **Enter** to confirm

2. **Use an existing project or create new?**
   - Select **Use an existing project**

3. **Select project:**
   - Choose **fire-235c2**

4. **Firestore rules file:**
   - Press **Enter** to accept default: `firestore.rules` (we already have this)

5. **Firestore indexes file:**
   - Press **Enter** to accept default: `firestore.indexes.json`

6. **Storage rules file:**
   - Press **Enter** to accept default: `storage.rules` (we already have this)

7. **Overwrite existing files?**
   - Type **N** (No) - we want to keep our custom rules

Result: A `firebase.json` file is created in your project root.

### Deploy the Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

You should see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/fire-235c2/overview
```

---

## Step 6: Verify Setup

### Check Firestore Rules

1. Go to https://console.firebase.google.com/project/fire-235c2/firestore/rules
2. You should see your custom rules deployed
3. Check the timestamp to ensure they're recent

### Check Storage Rules

1. Go to https://console.firebase.google.com/project/fire-235c2/storage/rules
2. You should see your custom rules deployed

### Test Connection

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000

You should see the homepage load without errors. Check the browser console (F12) - there should be no Firebase connection errors.

---

## Step 7: Create Firestore Indexes (Optional)

Some queries require composite indexes. Firebase will prompt you to create them when needed.

**Pre-create common indexes:**

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "siteId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "entries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "siteId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "defects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "siteId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause:** Security rules not deployed or incorrect.

**Fix:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Error: "PERMISSION_DENIED: Missing or insufficient permissions"

**Cause:** User doesn't have proper auth tokens or role.

**Fix:**
1. Check user is authenticated
2. Check user has `orgId` custom claim
3. Check user has correct `role` custom claim

### Error: "Firebase: No Firebase App '[DEFAULT]' has been created"

**Cause:** Firebase not initialized properly.

**Fix:**
1. Check `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables
2. Restart dev server: `npm run dev`

### Error: "Firebase Admin: Missing required environment variables"

**Cause:** Server-side Firebase Admin not configured.

**Fix:**
1. Check `FIREBASE_PRIVATE_KEY` in `.env.local`
2. Make sure key includes `\n` characters
3. Check `FIREBASE_CLIENT_EMAIL` is set

### Firestore rules test failing

**Cause:** Rules might not be deployed or test data doesn't match rules.

**Fix:**
1. Redeploy rules: `firebase deploy --only firestore:rules`
2. Check custom claims are set on test user
3. Verify orgId matches between user and document

---

## Firebase Console Quick Links

- **Project Overview:** https://console.firebase.google.com/project/fire-235c2/overview
- **Firestore Database:** https://console.firebase.google.com/project/fire-235c2/firestore
- **Storage:** https://console.firebase.google.com/project/fire-235c2/storage
- **Authentication:** https://console.firebase.google.com/project/fire-235c2/authentication/users
- **Project Settings:** https://console.firebase.google.com/project/fire-235c2/settings/general
- **Usage Dashboard:** https://console.firebase.google.com/project/fire-235c2/usage

---

## Security Checklist

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Service account key stored securely (not in git)
- [ ] `.gitignore` includes `*-service-account.json`
- [ ] Authentication enabled
- [ ] Database in EU region (GDPR compliance)
- [ ] Storage in EU region (GDPR compliance)
- [ ] Test users have proper custom claims (orgId, role, siteIds)

---

## Next Steps

1. ✅ Firebase setup complete
2. ⏳ Set up Resend for emails (see SETUP.md)
3. ⏳ Create first organisation and user
4. ⏳ Build authentication UI
5. ⏳ Test offline sync
6. ⏳ Deploy to production

---

## Production Checklist (When Ready)

- [ ] Upgrade to Firebase Blaze plan (pay-as-you-go)
- [ ] Set up billing alerts
- [ ] Enable Firebase App Check (prevents API abuse)
- [ ] Add production domain to Firebase Auth
- [ ] Set up custom domain for hosting (if using Firebase Hosting)
- [ ] Configure CORS for Storage
- [ ] Set up Firebase Analytics (optional)
- [ ] Enable audit logs (Firebase extensions)
- [ ] Set up automated backups
- [ ] Review and optimize security rules
- [ ] Set up monitoring alerts
