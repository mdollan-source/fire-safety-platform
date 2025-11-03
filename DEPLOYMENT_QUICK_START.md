# 🚀 Quick Deployment Checklist

**For full details, see: PRE_DEPLOYMENT_CHECKLIST.md**

---

## ⚡ Critical Path (Do These First)

### 1. 🔒 Security Migration (15 mins)
```bash
# Install dependencies
npm install -D ts-node @types/node

# Check data migration status
npm run security:migrate:check

# If needed, run migration
npm run security:migrate -- --live

# Audit queries
npm run security:audit

# Deploy security rules
firebase login
npm run security:deploy
```

**✅ Must be GREEN before proceeding!**

---

### 2. 🔧 Environment Setup (10 mins)

**In Coolify, add these Environment Variables:**

```env
# Firebase Public (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server - KEEP SECRET)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**Get Firebase values from:**
- Firebase Console → Project Settings → General (scroll down)
- Service Account tab → Generate New Private Key

---

### 3. 🌐 Firebase Domain Setup (5 mins)

**Add your domain to Firebase:**
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain
3. Add: `yourdomain.com`

---

### 4. 🏗️ Build Test (5 mins)

```bash
# Clean build
rm -rf .next
npm run build

# Test locally
npm start
# Open http://localhost:3000
# Verify login works
```

---

### 5. 🚀 Coolify Setup (10 mins)

**Application Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`
- **Branch**: `master`
- **Auto Deploy**: Enable

**Add Environment Variables** (from Step 2)

---

## ✅ Pre-Deploy Verification

Before you click "Deploy":

- [ ] ✅ Data migration complete
- [ ] ✅ Security rules deployed
- [ ] ✅ Query audit passed
- [ ] ✅ Environment vars in Coolify
- [ ] ✅ Domain in Firebase authorized domains
- [ ] ✅ DNS propagated to VPS
- [ ] ✅ Local production build works

---

## 🎯 Deploy!

1. **In Coolify**: Click "Deploy" or push to master (already done ✅)
2. **Watch logs**: Monitor for errors
3. **Wait**: ~5-10 minutes for build + deploy

---

## 📊 Post-Deploy (First 10 Minutes)

### Immediate Checks:

```bash
# 1. Check site is up
curl -I https://yourdomain.com
# Should return: HTTP/2 200

# 2. Check PWA manifest
curl https://yourdomain.com/manifest.json
# Should return JSON
```

**In Browser:**
- [ ] Homepage loads
- [ ] Can login
- [ ] Dashboard accessible
- [ ] Can create site
- [ ] No console errors (F12)

---

## 🧪 Security Test (Next 15 Minutes)

### Create 2 test accounts:

**Account A:**
```
Email: test-a@yourdomain.com
Create new org → Add test site
```

**Account B:**
```
Email: test-b@yourdomain.com
Create new org → Add test site
```

**Verify:**
- [ ] Account A CANNOT see Account B's site
- [ ] Account B CANNOT see Account A's site
- [ ] Both can complete checks
- [ ] No permission errors in console

**✅ If all checks pass = SECURE DEPLOYMENT SUCCESS!**

---

## 🚨 If Something Goes Wrong

### Quick Rollback:

**In Coolify:**
1. Deployments tab
2. Find previous working deployment
3. Click "Redeploy"

**Or revert security rules:**
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

---

## 📞 Critical Issues to Watch

**First 24 Hours:**
1. **Permission errors**: Check Firebase Console → Logs
2. **Build failures**: Check Coolify logs
3. **User reports**: "Can't see my data" = possible orgId issue

**If you see many permission errors:**
```bash
# Check which docs are missing orgId
npm run security:migrate:check
```

---

## 🎉 Success Criteria

**Deployment is successful when:**
- ✅ Site loads at your domain
- ✅ Users can login
- ✅ Data is org-isolated (test accounts verify)
- ✅ No critical errors in logs
- ✅ Offline mode works (turn off network, complete check)
- ✅ PWA can be installed on mobile

---

## 📋 Next Steps After Successful Deploy

**Day 1:**
- Monitor error logs
- Test with real users
- Verify backups working

**Week 1:**
- Review performance
- Optimize if needed
- Plan next features

**Ongoing:**
- Run `npm run security:audit` before each deploy
- Monitor Firebase usage/costs
- Keep dependencies updated

---

## 🔥 You're Ready!

**Time to deploy: ~45 minutes**
- Security checks: 15 min
- Configuration: 20 min
- Deploy + verify: 10 min

**Good luck! 🚀**

---

## Quick Reference

| Task | Command |
|------|---------|
| Check migration | `npm run security:migrate:check` |
| Run migration | `npm run security:migrate -- --live` |
| Audit queries | `npm run security:audit` |
| Deploy rules | `npm run security:deploy` |
| Build | `npm run build` |
| Test locally | `npm start` |
| Check logs | Coolify dashboard → Logs |

**Need help? See: PRE_DEPLOYMENT_CHECKLIST.md**
