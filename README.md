# Fire Safety Log Book

A professional digital fire safety compliance platform built for UK premises under the Fire Safety Order.

## Features

- **Offline-First PWA**: Complete checks offline, auto-sync when online
- **Multi-Tenant**: Organisation → Sites → Assets hierarchy with RBAC
- **Compliance Templates**: Pre-built check templates for fire alarms, emergency lighting, fire doors, extinguishers, sprinklers
- **Immutable Records**: Cryptographic hashing and audit trails for compliance evidence
- **KPI Dashboard**: Track completion rates, overdue checks, defects by severity
- **Evidence Capture**: Photos with EXIF/GPS preservation
- **PDF Compliance Packs**: Exportable audit-ready reports
- **Professional Design**: Clean, utilitarian interface (no gradients, no AI aesthetic)

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Email**: Resend
- **Styling**: Tailwind CSS (custom professional theme)
- **Scheduling**: RRule (RFC 5545 recurrence)
- **PDF Generation**: jsPDF
- **Offline**: Service Workers + IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Resend account (for emails)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

You already have Firebase configured in `.env.local`, but you need to:

1. Go to [Firebase Console](https://console.firebase.google.com/project/fire-235c2)
2. Navigate to **Project Settings → Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file securely (DO NOT commit to git)
5. Add these values to `.env.local`:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fire-235c2.iam.gserviceaccount.com"
```

### 3. Deploy Firestore Security Rules

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. Configure Resend

Add your Resend API key to `.env.local`:

```bash
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="Fire Safety <noreply@yourdomain.com>"
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
Fire/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Select.tsx
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts       # Client-side Firebase
│   │   │   └── admin.ts        # Server-side Firebase Admin
│   │   └── utils/
│   │       ├── hash.ts         # Cryptographic utilities
│   │       ├── date.ts         # UK timezone helpers
│   │       └── cn.ts           # Class name merger
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── data/
│       └── check-templates.ts  # Default compliance templates
├── public/
│   └── manifest.json           # PWA manifest
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage rules
├── .env.local                  # Environment variables (not in git)
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## Security Rules Summary

### Firestore Rules

- **Multi-tenant isolation**: All data scoped by `orgId`
- **Role-Based Access Control**: Super Admin, Responsible Person, Site Manager, Technician, etc.
- **Immutable entries**: Check entries cannot be deleted, only versioned edits with reasons
- **Site-level permissions**: Users can be scoped to specific sites

### Storage Rules

- **Organisation isolation**: Files stored per org (`/evidence/{orgId}/...`)
- **Max file sizes**: 25MB for evidence, 2MB for logos
- **Immutable evidence**: No updates or deletes allowed
- **Type restrictions**: Only images, PDFs, and videos allowed

## Data Model

The platform uses a hierarchical structure:

```
Organisation (tenant)
  ├── Users (with roles)
  ├── Sites
  │   ├── Buildings
  │   │   └── Floors
  │   └── Assets (fire doors, alarms, extinguishers, etc.)
  ├── Check Templates
  ├── Schedules (RRULE-based)
  ├── Tasks (generated from schedules)
  ├── Entries (completed checks - IMMUTABLE)
  ├── Evidence (photos, documents)
  ├── Defects (raised from failed checks)
  ├── Training Records
  └── Inspector Visits
```

All actions logged in `audit_events` collection.

## Default Check Templates

The platform includes 7 starter templates aligned to UK regulations:

1. **Fire Alarm – Weekly Test** (BS 5839-1)
2. **Emergency Lighting – Monthly** (BS 5266-1)
3. **Fire Doors – Routine Inspection**
4. **Extinguishers – Monthly Visual** (BS 5306-3)
5. **Sprinklers – Weekly Check** (BS EN 12845)
6. **False Alarm Log**
7. **Training & Drill Record**

## Design Principles

### What We DON'T Use

- ❌ Gradient backgrounds
- ❌ Glassmorphism effects
- ❌ Excessive rounded corners
- ❌ Floating cards with heavy shadows
- ❌ Emojis in UI
- ❌ Purple/pink/blue gradient schemes
- ❌ Over-animated transitions

### What We DO Use

- ✅ Solid, high-contrast colors
- ✅ Flat or minimal depth design
- ✅ Data-first layouts (tables, lists, clear hierarchy)
- ✅ System fonts for performance
- ✅ Status colors: Red = fail/critical, Green = pass, Orange = warning
- ✅ Professional, utilitarian aesthetic

## Development Workflow

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Production

```bash
npm run start
```

## MVP Scope (Phase 1)

**Must-Have:**
- ✅ Auth & RBAC (Org/Site/User)
- ✅ Sites, Assets, Templates
- ⏳ Scheduling & tasks (RRULE)
- ⏳ Offline capture + sync (PWA)
- ⏳ Evidence capture (photos + GPS)
- ⏳ KPI basics (completion, overdue, defects)
- ⏳ PDF Compliance Pack + CSV exports
- ⏳ Email reminders & escalations

**Should-Have:**
- False alarm analytics
- Training & drills records
- Inspector visits

**Could-Have:**
- Read-only auditor portal
- QR codes for assets

## Roadmap

- **Phase 2**: Enhanced dashboard, push notifications, mobile app wrappers
- **Phase 3**: FRA linkage, contractor portal, SSO, custom analytics
- **Phase 4**: White-label marketplace, billing, multi-language

## Environment Variables

See `.env.local` for full list. Key variables:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# Security
JWT_SECRET=
ENCRYPTION_KEY=
```

## Contributing

This is a proprietary project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
