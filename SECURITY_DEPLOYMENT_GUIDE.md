# 🔒 Security Deployment Guide

**⚠️  CRITICAL: Follow this guide exactly before deploying to production**

---

## Overview

This guide walks you through securing the Fire Safety Log application by:
1. Ensuring all data has proper `orgId` fields
2. Deploying updated security rules
3. Auditing and fixing insecure queries
4. Testing multi-tenant isolation

---

## 🚨 Pre-Flight Check

Before starting, ensure:

- [ ] You have a **full backup** of your Firestore database
- [ ] You have Firebase Admin SDK credentials
- [ ] `firebase-tools` is installed (`npm install -g firebase-tools`)
- [ ] You're logged in to Firebase (`firebase login`)
- [ ] You have `ts-node` installed (`npm install -D ts-node`)

---

## Phase 1: Data Migration

### Step 1: Set Up Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely
6. Set environment variable:

```bash
# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"

# Windows CMD
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json

# Mac/Linux
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

### Step 2: Check for Missing orgId Fields (Dry Run)

```bash
npm run security:migrate:check
```

**Expected Output:**
```
🔍 Data Migration Check
Mode: DRY RUN (no changes)
────────────────────────────────────────────────────────────────────────────────

📁 Checking sites...
   Total documents: 5
   ✓ All documents have orgId

📁 Checking assets...
   Total documents: 12
   ⚠️  Missing orgId: asset_123456
      → Inferred from site: org_abc123
   ⚠️  Missing orgId: asset_789012
      → Inferred from site: org_abc123

📊 MIGRATION SUMMARY
════════════════════════════════════════════════════════════════════════════════
┌─────────────────────┬───────┬─────────┬─────────┬────────┐
│ Collection          │ Total │ Missing │ Updated │ Errors │
├─────────────────────┼───────┼─────────┼─────────┼────────┤
│ sites               │     5 │       0 │       0 │      0 │
│ assets              │    12 │       2 │       0 │      0 │
│ defects             │     3 │       0 │       0 │      0 │
└─────────────────────┴───────┴─────────┴─────────┴────────┘

ℹ️  This was a DRY RUN - No changes were made
⚠️  Found 2 documents missing orgId
   Run with --live flag to apply changes:
   npm run security:migrate -- --live
```

### Step 3: Review the Results

**If all documents have orgId:**
- ✅ Skip to Phase 2

**If documents are missing orgId:**
- Review the inferred orgId values
- Verify they're correct
- Proceed to Step 4

**If errors occurred:**
- Review error details
- Manually fix documents that couldn't be inferred
- Re-run the check

### Step 4: Run Migration (LIVE MODE)

⚠️  **WARNING**: This will modify your database!

```bash
npm run security:migrate -- --live
```

The script will:
- Wait 5 seconds (press Ctrl+C to cancel)
- Update documents with missing orgId
- Show a summary of changes

### Step 5: Verify Migration

Re-run the dry run to confirm all documents now have orgId:

```bash
npm run security:migrate:check
```

**Expected:**
```
✅ All documents have orgId - Safe to deploy security rules
```

---

## Phase 2: Security Rules Deployment

### Step 6: Review Security Changes

Check what was fixed:

```bash
git diff firestore.rules
```

**Key changes:**
- Sites: Now filtered by orgId
- Assets: Now filtered by orgId
- Defects: Now filtered by orgId
- Evidence: Now filtered by orgId

### Step 7: Deploy Rules to Firebase

```bash
npm run security:deploy
```

Or manually:
```bash
firebase deploy --only firestore:rules,storage
```

**Expected Output:**
```
=== Deploying to 'your-project'...

i  deploying firestore, storage
i  firestore: reading rules from firestore.rules...
i  storage: reading rules from storage.rules...
✔  firestore: rules file firestore.rules compiled successfully
✔  storage: rules file storage.rules compiled successfully
i  firestore: uploading rules firestore.rules...
i  storage: uploading rules storage.rules...
✔  firestore: released rules firestore.rules
✔  storage: released rules storage.rules

✔  Deploy complete!
```

### Step 8: Test Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database → Rules
4. Click "Rules Playground"
5. Test a read operation:

```
// Simulate user from org_abc123 trying to read asset from org_xyz789
Location: /databases/(default)/documents/assets/asset_123
Authenticated: Yes
Custom Claims: { "orgId": "org_abc123", "role": "responsible_person" }
```

**Expected**: ❌ Permission denied

```
// Simulate user from org_abc123 trying to read asset from org_abc123
Location: /databases/(default)/documents/assets/asset_123
Authenticated: Yes
Custom Claims: { "orgId": "org_abc123", "role": "responsible_person" }
```

**Expected**: ✅ Allowed

---

## Phase 3: Client-Side Query Audit

### Step 9: Audit Existing Queries

```bash
npm run security:audit
```

**Expected Output:**
```
🔍 FIRESTORE QUERY SECURITY AUDIT
═══════════════════════════════════════════════════════════════════════════════

Found 8 potential security issues:

  🔴 Critical: 5
  ⚠️  Warning:  2
  ℹ️  Info:     1

🔴 CRITICAL ISSUES (Must Fix):

1. src/app/dashboard/assets/page.tsx:45
   Collection: assets
   Issue: Collection query without orgId filter
   Code: const snapshot = await getDocs(collection(db, 'assets'));

2. src/app/dashboard/defects/page.tsx:67
   Collection: defects
   Issue: Query without orgId filter
   Code: const q = query(collection(db, 'defects'), where('status', '==', 'open'));
```

### Step 10: Fix Insecure Queries

For each critical issue found:

**Before:**
```typescript
const snapshot = await getDocs(collection(db, 'assets'));
```

**After (Option 1 - Use Helper):**
```typescript
import { querySecure } from '@/lib/firebase/secure-query';

const assets = await querySecure('assets', userData.orgId);
```

**After (Option 2 - Manual Filter):**
```typescript
const q = query(
  collection(db, 'assets'),
  where('orgId', '==', userData.orgId)
);
const snapshot = await getDocs(q);
```

### Step 11: Re-Audit After Fixes

```bash
npm run security:audit
```

**Target:**
```
✅ No security issues found! All queries appear to be properly filtered.
```

---

## Phase 4: Testing & Verification

### Step 12: Create Test Accounts

Create 2 test accounts in different orgs:

**Account A:**
- Email: test-org-a@example.com
- Custom Claims: `{ orgId: "test_org_a", role: "responsible_person" }`

**Account B:**
- Email: test-org-b@example.com
- Custom Claims: `{ orgId: "test_org_b", role: "responsible_person" }`

### Step 13: Create Test Data

**As Account A:**
1. Create a site
2. Create an asset
3. Create a defect
4. Complete a check

**As Account B:**
1. Create a site
2. Create an asset

### Step 14: Test Cross-Org Access

**As Account A, try to:**
- ❌ View Account B's sites (should fail)
- ❌ View Account B's assets (should fail)
- ❌ Edit Account B's data (should fail)
- ✅ View own data (should work)

**As Account B, try to:**
- ❌ View Account A's sites (should fail)
- ❌ View Account A's assets (should fail)
- ✅ View own data (should work)

### Step 15: Check Browser Console

Open browser DevTools (F12) and check for errors:

**✅ Expected: No permission errors**

**❌ If you see:**
```
FirebaseError: Missing or insufficient permissions
```

This means:
1. Some queries aren't filtered by orgId
2. Some documents are missing orgId
3. Rules have an issue

---

## Phase 5: Production Deployment

### Step 16: Pre-Deployment Checklist

- [ ] All migrations completed
- [ ] Security rules deployed
- [ ] Query audit shows 0 critical issues
- [ ] Cross-org testing passed
- [ ] No console errors
- [ ] Database backup created
- [ ] Rollback plan ready

### Step 17: Deploy Application

```bash
npm run build
# Deploy to your hosting provider
```

### Step 18: Monitor Production

After deployment, monitor for:

**In Firebase Console:**
- Spike in permission denied errors
- Users unable to access their data

**In Application Logs:**
- Firestore permission errors
- Missing orgId errors

**From Users:**
- Reports of "can't see my data"
- Permission denied errors

---

## 🚨 Rollback Procedure

If issues occur after deployment:

### Immediate Rollback (Security Rules)

```bash
# Restore previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Full Rollback

1. Restore database from backup
2. Revert security rules
3. Revert application code
4. Investigate issues

---

## 📊 Security Monitoring

### Ongoing Monitoring

1. **Weekly:** Run security audit
   ```bash
   npm run security:audit
   ```

2. **Monthly:** Review Firebase rules usage
   - Go to Firebase Console → Usage
   - Check for unusual patterns

3. **Per Release:** Test cross-org isolation
   - Use test accounts
   - Verify data isolation

### Alerts to Set Up

- Firebase Rules: Denied requests > 100/hour
- Application: Permission errors > 10/hour
- Database: Failed reads > 50/hour

---

## 🎯 Success Criteria

Security is properly deployed when:

- [✅] All documents have `orgId` field
- [✅] Security rules deployed
- [✅] No critical issues in query audit
- [✅] Cross-org testing passed
- [✅] No permission errors in production
- [✅] Users can only see their org data
- [✅] Zero data leakage between orgs

---

## 📞 Support

If you encounter issues:

1. Check SECURITY_AUDIT.md for known issues
2. Run `npm run security:audit` for diagnostics
3. Check Firebase Console → Firestore → Rules → Logs
4. Review browser console for client errors

---

## 🔐 Security Best Practices

Going forward:

1. **Always use secure query helpers:**
   ```typescript
   import { querySecure, createSecureQuery } from '@/lib/firebase/secure-query';
   ```

2. **Never skip orgId filtering:**
   ```typescript
   // ❌ BAD
   const q = query(collection(db, 'assets'));

   // ✅ GOOD
   const q = createSecureQuery('assets', orgId);
   ```

3. **Test with multiple orgs:**
   - Always test new features with 2+ orgs
   - Verify data isolation

4. **Run security audit before deploys:**
   ```bash
   npm run security:audit
   ```

5. **Review security rules quarterly:**
   - Check for new collections
   - Verify all have orgId filtering

---

**Remember: Security is not a one-time fix, it's an ongoing practice!**

🔒 Stay secure!
