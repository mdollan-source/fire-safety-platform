# Fire Safety Notification System

This document describes the complete notification system implementation for the Fire Safety SaaS platform, including both **email notifications** and **mobile push notifications** (iOS, Android, and Web).

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup & Configuration](#setup--configuration)
5. [User Experience](#user-experience)
6. [API Usage](#api-usage)
7. [Scheduled Notifications](#scheduled-notifications)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The notification system provides multi-channel alerts to keep users informed about:
- Task assignments
- Task reminders (24h and 1h before due)
- Overdue tasks
- Critical defects
- Weekly digest summaries

**Channels:**
- 📧 **Email** (via Resend)
- 📱 **Push Notifications** (via Firebase Cloud Messaging)
  - iOS devices (via APNS)
  - Android devices (via FCM)
  - Web browsers (Chrome, Firefox, Safari, Edge)

---

## Features

### Email Notifications

- ✅ Professional HTML email templates
- ✅ Task assignment notifications
- ✅ 24-hour and 1-hour task reminders
- ✅ Overdue task alerts
- ✅ Critical defect reports
- ✅ Weekly activity digest
- ✅ User-configurable preferences

### Push Notifications

- ✅ Cross-platform support (iOS, Android, Web)
- ✅ Foreground notifications (when app is open)
- ✅ Background notifications (when app is closed)
- ✅ Notification click handling (deep linking)
- ✅ Device token management
- ✅ Topic-based notifications (future expansion)
- ✅ User-configurable preferences

### User Preferences

- ✅ Enable/disable email notifications
- ✅ Enable/disable push notifications
- ✅ Granular control over notification types
- ✅ Easy-to-use settings UI in user profile
- ✅ Persistent across devices

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ Email Service│      │  FCM Service │                     │
│  │   (Resend)   │      │  (Firebase)  │                     │
│  └──────────────┘      └──────────────┘                     │
│         │                      │                             │
│         └──────────┬───────────┘                             │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │ Notification Service │                             │
│         │   (Unified API)      │                             │
│         └──────────────────────┘                             │
│                    │                                         │
│         ┌──────────┴───────────┐                            │
│         │                      │                             │
│    ┌────▼─────┐         ┌─────▼────┐                       │
│    │ API      │         │ Scheduled │                       │
│    │ Routes   │         │ Processor │                       │
│    └──────────┘         └──────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/
│   └── notifications/
│       ├── email.ts                    # Email service (Resend)
│       ├── fcm-admin.ts                # Server-side FCM
│       ├── fcm-client.ts               # Client-side FCM
│       └── notification-service.ts     # Unified notification API
│
├── components/
│   └── notifications/
│       ├── NotificationPermissionPrompt.tsx  # Permission request UI
│       └── NotificationPreferences.tsx       # Settings UI
│
├── app/
│   └── api/
│       └── notifications/
│           ├── task-assignment/route.ts
│           ├── defect-reported/route.ts
│           ├── weekly-digest/route.ts
│           └── process-scheduled/route.ts
│
└── public/
    └── firebase-messaging-sw.js        # Service worker for FCM
```

---

## Setup & Configuration

### Prerequisites

1. **Resend Account** (for email)
   - Sign up at https://resend.com
   - Get API key from dashboard
   - Verify your sending domain (optional, for production)

2. **Firebase Project** (for push notifications)
   - Enable Firebase Cloud Messaging in console
   - Download service account credentials
   - Generate VAPID keys for web push

### Environment Variables

Add these to your `.env.local`:

```bash
# Resend (Email)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="Fire Safety <onboarding@resend.dev>"

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# Firebase Client (Already in .env.local)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:xxxxx"

# VAPID Key (for Web Push) - Generate in Firebase Console
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-vapid-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Cron job authentication
CRON_SECRET="your-secret-key-here"
```

### Generating VAPID Keys

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the key and add to `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Notification Icons

The system expects notification icons at:
- `/icons/icon-192x192.png` - Main notification icon
- `/icons/badge-72x72.png` - Badge icon

Create these in your `public/icons/` directory.

---

## User Experience

### First-Time Setup

1. **User logs in** to the dashboard
2. After 5 seconds, a **notification permission prompt** appears in the bottom-right
3. User clicks **"Enable"** to grant notification permission
4. System requests browser permission (native prompt)
5. On approval:
   - FCM token is generated
   - Token is saved to Firestore (`users/{userId}/fcmTokens/{token}`)
   - User preferences are initialized

### Managing Preferences

Users can manage their notification preferences in **Profile → Notification Preferences**:

**Email Notifications:**
- Toggle email notifications on/off
- Choose notification types:
  - Task Assignments
  - Task Reminders
  - Overdue Tasks
  - Defect Reports
  - Weekly Digest

**Push Notifications:**
- Enable/disable push notifications
- Choose notification types:
  - Task Assignments
  - Task Reminders
  - Overdue Tasks
  - Defect Reports

### Notification Delivery

**Email:**
- Delivered to user's registered email address
- Professional HTML templates with branding
- Includes direct links to relevant pages
- Respects user preferences

**Push:**
- Delivered to all registered devices
- Shows browser/system notification
- Plays sound and vibrates (if enabled)
- Clicking opens the app to the relevant page
- Works even when app is closed (via service worker)

---

## API Usage

### Sending Task Assignment Notification

```typescript
// Client-side example
await fetch('/api/notifications/task-assignment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipient: {
      userId: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
    },
    taskId: 'task456',
    taskTitle: 'Weekly Fire Extinguisher Check',
    siteName: 'Main Building',
    assetName: 'Fire Extinguisher FE-001',
    dueDate: '15/01/2025',
  }),
});
```

### Sending Defect Notification

```typescript
await fetch('/api/notifications/defect-reported', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'org123',
    defectId: 'defect789',
    defectTitle: 'Fire extinguisher pressure low',
    severity: 'critical', // 'critical' | 'high' | 'medium' | 'low'
    siteName: 'Main Building',
    assetName: 'Fire Extinguisher FE-001',
    reportedBy: 'Jane Smith',
  }),
});
```

### Sending Weekly Digest

```typescript
await fetch('/api/notifications/weekly-digest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipient: {
      userId: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
    },
    weekStart: '01/01/2025',
    weekEnd: '07/01/2025',
    stats: {
      tasksCompleted: 12,
      tasksDue: 5,
      tasksOverdue: 2,
      newDefects: 3,
      openDefects: 7,
    },
  }),
});
```

---

## Scheduled Notifications

The system includes an API endpoint for processing scheduled notifications (task reminders and overdue alerts).

### Endpoint

```
POST /api/notifications/process-scheduled
```

### How It Works

1. Queries all pending/in-progress tasks
2. For each task, checks:
   - **24h reminder**: 23-25 hours before due
   - **1h reminder**: 0.5-1.5 hours before due
   - **Overdue**: Past due date
3. Sends appropriate notifications via email and push
4. Prevents duplicate sends by tracking last notification time

### Setting Up Cron Job

#### Option 1: Vercel Cron (Recommended for Vercel deployment)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process-scheduled",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour.

#### Option 2: GitHub Actions

Create `.github/workflows/cron-notifications.yml`:

```yaml
name: Process Scheduled Notifications

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Call notification processor
        run: |
          curl -X POST https://your-domain.com/api/notifications/process-scheduled \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 3: External Cron Service

Use a service like **cron-job.org**:
1. Sign up at https://cron-job.org
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/notifications/process-scheduled`
4. Set schedule: `0 * * * *` (every hour)
5. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### Testing

```bash
# Test the scheduled processor
curl -X POST http://localhost:3000/api/notifications/process-scheduled

# Health check
curl http://localhost:3000/api/notifications/process-scheduled
```

---

## Troubleshooting

### Email Not Sending

1. **Check Resend API key** in `.env.local`
2. **Verify email address** is valid
3. **Check Resend dashboard** for delivery status
4. **Look for errors** in server logs

### Push Notifications Not Working

#### Permission Issues
- Check browser console for permission status
- Ensure user granted notification permission
- Try different browser (some block notifications by default)

#### VAPID Key Issues
- Verify `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set correctly
- Check Firebase Console → Cloud Messaging → Web Push certificates

#### Service Worker Issues
```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistrations().then(console.log);

// Check for FCM token
// (In browser console after granting permission)
```

#### FCM Token Not Saving
- Check Firestore security rules allow writes to `users/{userId}/fcmTokens`
- Verify user is authenticated
- Check browser console for errors

### Notifications Not Arriving on Mobile

1. **iOS**:
   - Ensure APNS certificates are configured in Firebase
   - Check iOS app capabilities include "Push Notifications"
   - Verify app is built with correct provisioning profile

2. **Android**:
   - Ensure `google-services.json` is included in app
   - Check FCM sender ID matches Firebase project
   - Verify app has notification permission

### Scheduled Notifications Not Running

1. **Check cron job configuration**
2. **Verify endpoint is accessible** (not behind auth)
3. **Check server logs** for errors
4. **Test manually** with curl/Postman

---

## Best Practices

### Email

- ✅ Keep email templates concise
- ✅ Include clear call-to-action buttons
- ✅ Test emails in different clients (Gmail, Outlook, Apple Mail)
- ✅ Use alt text for images
- ✅ Respect user preferences

### Push Notifications

- ✅ Request permission at appropriate time (not immediately on login)
- ✅ Explain why notifications are useful before requesting
- ✅ Keep notification text brief and actionable
- ✅ Use notification data for deep linking
- ✅ Handle notification clicks gracefully
- ✅ Clean up invalid tokens periodically

### Security

- ✅ Never expose Firebase Admin private key client-side
- ✅ Validate all API inputs
- ✅ Use authentication for sensitive notification endpoints
- ✅ Respect user notification preferences
- ✅ Rate limit notification sends to prevent abuse

---

## Future Enhancements

- [ ] SMS notifications (Twilio integration)
- [ ] In-app notification center
- [ ] Notification history/archive
- [ ] Do Not Disturb hours
- [ ] Notification batching/grouping
- [ ] Rich push notifications (images, actions)
- [ ] Topic-based subscriptions
- [ ] Notification analytics

---

## Support

For issues or questions about the notification system:
1. Check this documentation
2. Review server logs (`npm run dev`)
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
5. Test with curl/Postman to isolate frontend vs backend issues

---

**Last Updated:** January 2025
