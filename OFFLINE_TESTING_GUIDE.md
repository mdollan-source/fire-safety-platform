# Offline Functionality Testing Guide

## Quick Setup

1. **Generate the 512x512 icon**:
   ```bash
   npm run dev
   # Open: http://localhost:3000/pwa-icon-generator.html
   # Click "Download Both PWA Icons"
   # Move icon-512.png to public/ directory
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Test Scenarios

### Scenario 1: Basic Offline Save

**Steps:**
1. Open app in Chrome: `http://localhost:3000`
2. Login and navigate to a check task
3. Open Chrome DevTools (F12) → Network tab
4. Set throttling to "Offline"
5. **Observe**: Amber banner appears "You're offline..."
6. Click "Complete Check"
7. Fill in check form with:
   - All required fields
   - Add 1-2 photos
   - Capture GPS (if required)
   - Add signature (if required)
8. Submit the form
9. **Expected**:
   - Alert: "Check saved offline. It will sync automatically when you're back online."
   - Redirected to checks page
   - Sync status badge appears in bottom-right

**Verification:**
```javascript
// Open browser console and run:
const db = await window.indexedDB.open('fire-safety-offline-db', 1);
// Check that data was saved
```

### Scenario 2: Automatic Sync on Reconnection

**Continuing from Scenario 1:**

10. In DevTools Network tab, change from "Offline" to "No throttling"
11. **Observe**:
    - Green banner: "Back online - Syncing changes..."
    - Sync status badge shows spinning icon
    - Pending count decreases
12. After a few seconds:
    - Sync badge disappears (or shows checkmark)
    - Entry appears in Firebase
    - Photos uploaded to Storage

**Verification:**
- Check Firebase Console → Firestore → `entries` collection
- Check Firebase Console → Storage → `evidence/{orgId}/` folder
- Check that task status changed to "completed"

### Scenario 3: Multiple Offline Entries

**Steps:**
1. Go offline (DevTools → Network → Offline)
2. Complete 3 different check entries
3. **Observe**: Sync badge shows "3 items to sync"
4. Go back online
5. **Observe**: All 3 entries sync sequentially

**Expected:**
- Pending count: 3 → 2 → 1 → 0
- All entries appear in Firestore
- All photos uploaded correctly

### Scenario 4: Offline Defect Creation

**Steps:**
1. Go offline
2. Complete a check entry
3. Toggle "Raise Defect" checkbox
4. Fill in defect details:
   - Title
   - Description
   - Severity level
5. Submit form
6. **Expected**: Both entry AND defect saved offline
7. Go back online
8. **Expected**:
   - Entry syncs first
   - Defect syncs second
   - Both appear in Firestore

### Scenario 5: Manual Sync Trigger

**Steps:**
1. Have 1-2 pending offline items
2. Stay online but don't wait for auto-sync
3. Click the sync status badge in bottom-right
4. **Observe**:
   - Immediate sync starts
   - Badge shows spinning animation
   - Items upload one by one

### Scenario 6: Service Worker Update

**Steps:**
1. Build and deploy app:
   ```bash
   npm run build
   npm start
   ```
2. Open app in browser
3. Make a small change to code
4. Rebuild and redeploy
5. Reload the app
6. **Observe**: Update notification appears
7. Click "Update Now"
8. **Expected**: Page reloads with new version

### Scenario 7: PWA Installation (Mobile)

**Steps:**
1. Deploy to production/staging server (HTTPS required)
2. Open on mobile device
3. Look for browser's "Add to Home Screen" prompt
4. Install the app
5. **Observe**:
   - App icon appears on home screen
   - Splash screen shows on launch
   - App runs in standalone mode (no browser UI)
6. Turn on Airplane Mode
7. Open app from home screen
8. **Expected**: App loads and works offline

### Scenario 8: Cache Verification

**Steps:**
1. Open app
2. Navigate around (dashboard, checks, assets)
3. Open DevTools → Application tab
4. Check "Cache Storage"
5. **Observe**:
   - Several caches created by Workbox
   - `firestore-cache` contains API responses
   - `firebase-storage-cache` contains images
   - `image-cache` contains UI images

### Scenario 9: Offline Read Operations

**Using the useOfflineCache hook:**

**Steps:**
1. Load a page with data (e.g., assets list)
2. Go offline
3. Refresh the page
4. **Expected**: Data loads from cache
5. **Observe**: Badge or indicator shows "Loading from cache"

### Scenario 10: Sync Error Recovery

**Steps:**
1. Create offline entry
2. Before going online, revoke Firebase permissions (or use incorrect credentials)
3. Go online
4. **Observe**:
   - Sync attempts
   - Fails after 3 retries
   - Entry removed from queue after max retries
   - Error shown in sync badge

## Browser DevTools Inspection

### IndexedDB Inspection
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB
4. Click "fire-safety-offline-db"
5. Inspect stores:
   - `syncQueue`: Pending actions
   - `cachedData`: Cached Firestore docs
   - `offlineEntries`: Offline entries
   - `offlineDefects`: Offline defects

### Service Worker Inspection
1. DevTools → Application tab
2. Click "Service Workers"
3. **Observe**:
   - Service worker registered
   - Status: activated
   - Source: `/sw.js`
4. Can "Unregister" to test fresh installation

### Cache Storage Inspection
1. DevTools → Application tab
2. Click "Cache Storage"
3. Expand to see all caches
4. Click individual caches to see cached resources

## Console Commands for Testing

### Check Offline Storage
```javascript
// Open browser console

// Get database
const request = indexedDB.open('fire-safety-offline-db', 1);
request.onsuccess = function() {
  const db = request.result;

  // Get all offline entries
  const tx = db.transaction('offlineEntries', 'readonly');
  const store = tx.objectStore('offlineEntries');
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    console.log('Offline entries:', getAll.result);
  };
};

// Check sync queue
const checkQueue = async () => {
  const { getSyncQueue } = await import('./src/lib/offline/db');
  const queue = await getSyncQueue();
  console.log('Sync queue:', queue);
};
```

### Trigger Manual Sync
```javascript
// In console
const { syncService } = await import('./src/lib/offline/sync');
syncService.sync();
```

### Check Network Status
```javascript
// Simple check
console.log('Online:', navigator.onLine);

// Listen for changes
window.addEventListener('online', () => console.log('ONLINE'));
window.addEventListener('offline', () => console.log('OFFLINE'));
```

## Common Issues & Solutions

### Issue: Icons not showing
**Solution**:
1. Verify icon-192.png and icon-512.png exist in `public/`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

### Issue: Service worker not registering
**Solution**:
1. Check that you're on HTTPS (or localhost)
2. Check browser console for errors
3. Verify `NODE_ENV=production` for production build
4. Unregister old service worker if upgrading

### Issue: Sync not triggering
**Solution**:
1. Check browser console for errors
2. Verify network came back online
3. Check Firebase permissions
4. Manually trigger: click sync badge

### Issue: Photos not uploading
**Solution**:
1. Check Firebase Storage rules
2. Verify storage quota not exceeded
3. Check photo file sizes
4. Verify Blob conversion working

## Performance Monitoring

### Monitor Sync Performance
```javascript
// Add to sync service for debugging
console.time('Sync Operation');
await syncService.sync();
console.timeEnd('Sync Operation');
```

### Monitor IndexedDB Size
```javascript
// Check database size
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', estimate.usage);
  console.log('Storage quota:', estimate.quota);
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});
```

## Success Checklist

- [ ] Offline banner appears when disconnected
- [ ] Check entries save to IndexedDB when offline
- [ ] Photos stored as Blobs
- [ ] Signature stored as data URL
- [ ] Sync badge shows pending count
- [ ] Automatic sync on reconnection
- [ ] Manual sync works via badge click
- [ ] All data appears in Firebase after sync
- [ ] Photos uploaded to Storage
- [ ] Task status updates
- [ ] Offline entries removed after successful sync
- [ ] PWA installable on mobile
- [ ] Service worker caches resources
- [ ] App works when revisited offline
- [ ] Update prompt appears when new version available

## Browser Compatibility

### Recommended Browsers
- ✅ Chrome/Edge (Best support)
- ✅ Firefox (Good support)
- ✅ Safari 15.4+ (iOS)
- ⚠️ Safari < 15.4 (Limited)

### Features by Browser
| Feature | Chrome | Firefox | Safari 15.4+ |
|---------|--------|---------|--------------|
| Service Workers | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ⚠️ | ❌ |
| Push Notifications | ✅ | ✅ | ✅ (16.4+) |
| Add to Home Screen | ✅ | ✅ | ✅ |

---

**Happy Testing! 🚀**

For issues or questions, check the console for detailed error messages.
