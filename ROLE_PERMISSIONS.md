# Role-Based Access Control (RBAC) Documentation

This document explains the roles, permissions, and feature access in the Fire Safety Log Book platform.

---

## Table of Contents

1. [Role Definitions](#role-definitions)
2. [Permission Matrix](#permission-matrix)
3. [Feature Access by Role](#feature-access-by-role)
4. [Data Access Rules](#data-access-rules)
5. [Role Hierarchy](#role-hierarchy)
6. [Common Scenarios](#common-scenarios)

---

## Role Definitions

### 1. Super Admin
**Type:** Vendor/Platform Administrator
**Purpose:** Highest level of access for platform owners

**Responsibilities:**
- Manage all organizations across the platform
- Create and delete organizations
- Override all permissions
- Access all data across all organizations
- User management for all organizations

**Who should have this role:**
- Platform owners
- Core development team
- Support staff requiring full access

---

### 2. Responsible Person
**Type:** Compliance Owner
**Purpose:** Owns fire safety compliance for the entire organization/premises

**Responsibilities:**
- Overall fire safety compliance
- Manage users within their organization
- Manage all sites and assets
- Create and manage check schedules
- Review and approve defects
- Generate compliance reports
- Sign off on training records

**Who should have this role:**
- Building owners
- Facilities managers
- Duty holders under UK fire safety law
- Individuals with Article 5 responsibility

---

### 3. Site Manager
**Type:** Site-Level Manager
**Purpose:** Manages day-to-day operations at specific sites

**Responsibilities:**
- Manage assigned sites
- Create check schedules for their sites
- Manage assets at their sites
- Create and update training records
- Record fire drills
- Review site-specific defects

**Who should have this role:**
- Site facilities managers
- Building managers
- Regional managers
- On-site compliance coordinators

**Access Limitation:** Can be restricted to specific sites via `siteIds` field

---

### 4. Technician
**Type:** Operational User
**Purpose:** Performs fire safety checks and reports issues

**Responsibilities:**
- View and complete assigned checks
- Report defects
- View site and asset information
- Update task status
- Upload evidence photos

**Who should have this role:**
- Maintenance staff
- Fire safety technicians
- Facilities operatives
- Contracted service engineers

---

### 5. Fire Marshal
**Type:** Operational User + Training
**Purpose:** Same as Technician but can also manage training

**Responsibilities:**
- All Technician capabilities, plus:
- Record training activities
- Coordinate fire drills
- Lead evacuation exercises

**Who should have this role:**
- Designated fire wardens
- Floor wardens
- Fire marshals
- Emergency response team members

---

### 6. Competent Person
**Type:** External Contractor
**Purpose:** External fire safety professionals conducting inspections

**Responsibilities:**
- Conduct specialist inspections
- Record findings and recommendations
- Create defect reports
- Generate inspection reports

**Who should have this role:**
- Fire risk assessors
- External auditors
- Specialist contractors (fire alarm engineers, etc.)
- Consulting fire safety professionals

---

### 7. Auditor
**Type:** Read-Only Observer
**Purpose:** View-only access for oversight and auditing

**Responsibilities:**
- View all records (read-only)
- Generate reports
- Review compliance status
- No ability to create or modify data

**Who should have this role:**
- Insurance inspectors
- Regulatory inspectors
- Internal audit teams
- Compliance officers

---

## Permission Matrix

| Feature | Super Admin | Responsible Person | Site Manager | Technician | Fire Marshal | Competent Person | Auditor |
|---------|-------------|-------------------|--------------|------------|--------------|------------------|---------|
| **Organizations** |
| View Organization | ✅ All | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| Create Organization | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update Organization | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Organization | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Users** |
| View Users | ✅ All | ✅ Org | ✅ Org | ❌ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update User Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sites** |
| View Sites | ✅ All | ✅ All | ✅ Assigned | ✅ Assigned | ✅ Assigned | ✅ Assigned | ✅ Assigned |
| Create Sites | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Sites | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Sites | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Assets** |
| View Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Assets | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Check Schedules** |
| View Schedules | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Schedules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Schedules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Schedules | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tasks (Checks)** |
| View Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Complete Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Tasks | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Entries (History)** |
| View Entries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Entries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Entries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Entries | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Defects** |
| View Defects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Defects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Defects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Defects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Templates** |
| View Templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Templates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Templates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Training** |
| View Training Records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Training Records | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update Training Records | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Training Records | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Fire Drills** |
| View Drills | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Drills | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update Drills | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Drills | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Documents** |
| View Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update Documents | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Documents | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Events** |
| View Audit Logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Full access
- ❌ = No access
- **All** = Access to all organizations
- **Org** = Access to own organization only
- **Assigned** = Access to assigned sites only

---

## Feature Access by Role

### Dashboard
**Access:** All authenticated users
**What they see:**
- **Super Admin:** Global stats across all organizations
- **Responsible Person / Site Manager:** Organization-wide stats
- **Technician / Fire Marshal / Competent Person / Auditor:** Personal task stats and assigned sites

### Checks
**Access:** All authenticated users
**Capabilities by role:**
- **Create Schedules:** Responsible Person, Site Manager, Super Admin
- **Generate Tasks:** Responsible Person, Site Manager, Super Admin
- **Complete Tasks:** All except Auditor
- **Delete Tasks:** Responsible Person, Super Admin only

### History (Completed Checks)
**Access:** All authenticated users (read)
**Special rules:**
- **Immutable:** Entries cannot be deleted by anyone (compliance requirement)
- **Limited Updates:** Only for corrections/notes
- All roles can view their organization's history

### Defects
**Access:** All authenticated users
**Create:** All except Auditor
**Update:** All except Auditor
**Delete:** Responsible Person, Super Admin only

### Sites
**Access:** Restricted by `siteIds` field
**Create/Update:** Responsible Person, Site Manager, Super Admin
**Delete:** Responsible Person, Super Admin only
**Site Scoping:** Users with `siteIds` array can only access those specific sites. `null` = access all sites.

### Assets
**Access:** All authenticated users in organization
**Create:** All except Auditor
**Update:** All except Auditor
**Delete:** Responsible Person, Super Admin only

### Templates
**Access:** All authenticated users (read)
**Create/Update:** Responsible Person, Site Manager, Super Admin
**Delete:** Responsible Person, Super Admin only

### Training
**Access:** All authenticated users (read)
**Create/Update:** Responsible Person, Site Manager, Fire Marshal, Super Admin
**Delete:** Responsible Person, Super Admin only

### Fire Drills
**Access:** All authenticated users (read)
**Create/Update:** Responsible Person, Site Manager, Fire Marshal, Super Admin
**Delete:** Responsible Person, Super Admin only

### Reports
**Access:** All authenticated users can view and generate
**Delete:** Responsible Person, Super Admin only
**Immutable:** Reports cannot be modified once generated

### Users
**Access:** Responsible Person, Site Manager, Super Admin only
**Create:** Responsible Person, Super Admin
**Update:** Responsible Person, Super Admin (or self for profile)
**Delete:** Responsible Person, Super Admin

---

## Data Access Rules

### Organization Isolation
- All data is scoped to organizations via `orgId`
- Users can only access data within their own organization
- Exception: Super Admin can access all organizations

### Site-Level Access Control
Some roles can be restricted to specific sites:

```typescript
{
  role: 'technician',
  siteIds: ['site_123', 'site_456']  // Can only access these sites
}
```

OR

```typescript
{
  role: 'site_manager',
  siteIds: null  // Can access all sites in organization
}
```

**Roles that support site restrictions:**
- Technician
- Fire Marshal
- Competent Person
- Site Manager

**Roles that always see all sites:**
- Super Admin (all organizations)
- Responsible Person (their organization)
- Auditor (their organization)

### Authentication Requirements
- All routes require authentication
- Unauthenticated users are redirected to `/sign-in`
- Custom claims stored in Firebase Auth tokens contain:
  - `orgId` - Organization ID
  - `role` - User role
  - `siteIds` - Array of accessible site IDs (or null)

---

## Role Hierarchy

```
┌─────────────────────┐
│   SUPER ADMIN       │ ← Platform owner, all access
└──────────┬──────────┘
           │
           ├─────────────────────────────────────────┐
           │                                         │
┌──────────▼──────────┐                  ┌──────────▼──────────┐
│ RESPONSIBLE PERSON  │                  │    SUPER ADMIN      │
│ (Organization Owner)│                  │  (Other Org)        │
└──────────┬──────────┘                  └─────────────────────┘
           │
           ├───────────────┬──────────────────┬─────────────────┐
           │               │                  │                 │
┌──────────▼──────────┐ ┌─▼────────────┐ ┌──▼──────────┐ ┌───▼──────────┐
│   SITE MANAGER      │ │  COMPETENT   │ │  AUDITOR    │ │ FIRE MARSHAL │
│  (Manages Sites)    │ │   PERSON     │ │ (Read-Only) │ │ (+ Training) │
└──────────┬──────────┘ │ (Contractor) │ └─────────────┘ └──────┬───────┘
           │            └──────────────┘                         │
           │                                                     │
┌──────────▼──────────┐                              ┌──────────▼────────┐
│    TECHNICIAN       │                              │   TECHNICIAN      │
│ (Completes Checks)  │                              │ (Completes Checks)│
└─────────────────────┘                              └───────────────────┘
```

### Hierarchy Levels:

**Level 1: Platform Admin**
- Super Admin

**Level 2: Organization Admin**
- Responsible Person

**Level 3: Management**
- Site Manager
- Competent Person (external)
- Auditor (observer)

**Level 4: Operational**
- Fire Marshal (+ training capabilities)
- Technician

---

## Common Scenarios

### Scenario 1: Small Single-Site Business
**Setup:**
- 1 x Responsible Person (building owner)
- 2 x Technicians (maintenance staff)

**Access:**
- Responsible Person: Full access to create schedules, manage users, generate reports
- Technicians: Complete assigned checks, report defects

---

### Scenario 2: Multi-Site Corporate
**Setup:**
- 1 x Responsible Person (head of facilities)
- 3 x Site Managers (one per building)
- 10 x Technicians (various locations)
- 5 x Fire Marshals

**Access:**
- Responsible Person: Full organizational oversight
- Site Managers: Manage their specific buildings, restricted by `siteIds`
- Technicians: Complete checks at assigned sites
- Fire Marshals: Complete checks + record drills and training

---

### Scenario 3: Property Management Agency
**Setup:**
- 1 x Responsible Person (agency owner)
- 5 x Site Managers (property managers)
- 3 x Competent Persons (contracted fire risk assessors)
- 15 x Technicians

**Access:**
- Responsible Person: Manage all clients' properties
- Site Managers: Each assigned to specific client properties
- Competent Persons: Conduct audits and generate reports
- Technicians: Service equipment across multiple sites

---

### Scenario 4: External Audit
**Setup:**
- Add 1 x Auditor role for insurance inspector

**Access:**
- Auditor: Read-only access to all records
- Can generate reports but cannot modify data
- Time-limited access (remove after audit complete)

---

## Security Implementation

### Firebase Security Rules
All permissions are enforced at the database level using Firestore Security Rules.

**Key security principles:**
1. **Organization Isolation:** Users can only query data with their `orgId`
2. **Role-Based Access:** Write operations check user's role
3. **Custom Claims:** Roles and organization stored in Firebase Auth tokens
4. **Immutable Records:** Compliance records (entries) cannot be deleted
5. **Upload Attribution:** All documents tagged with uploader ID

### Example Security Rule:
```javascript
match /sites/{siteId} {
  // Read: authenticated users in same org
  allow read: if isAuthenticated() && isOrgMember(resource.data.orgId);

  // Create: RP, site manager, or super admin
  allow create: if isAuthenticated() &&
                  isOrgMember(request.resource.data.orgId) &&
                  hasAnyRole(['responsible_person', 'site_manager', 'super_admin']);

  // Delete: RP or super admin only
  allow delete: if isAuthenticated() &&
                  hasAnyRole(['responsible_person', 'super_admin']);
}
```

---

## Navigation & UI Access

### Current Implementation
**All authenticated users see all navigation menu items**, but:
- Backend security rules prevent unauthorized actions
- UI shows appropriate buttons based on role (e.g., "Create" button for managers only)
- Users without permission will get an error if they try unauthorized actions

### Recommended Enhancement
**Hide menu items based on role** to improve UX:

**Example implementation:**
```typescript
// Filter navigation based on user role
const getNavigationForRole = (role: UserRole) => {
  const baseNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Checks', href: '/dashboard/checks', icon: ClipboardCheck },
    { name: 'History', href: '/dashboard/entries', icon: History },
    { name: 'Defects', href: '/dashboard/defects', icon: AlertTriangle },
  ];

  const managerNav = [
    { name: 'Sites', href: '/dashboard/sites', icon: Building2 },
    { name: 'Assets', href: '/dashboard/assets', icon: Package },
    { name: 'Templates', href: '/dashboard/templates', icon: FileStack },
  ];

  const adminNav = [
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  ];

  // Build navigation based on role
  if (role === 'auditor') {
    return [...baseNav, ...managerNav, ...adminNav]; // Read-only
  }

  if (['responsible_person', 'super_admin', 'site_manager'].includes(role)) {
    return [...baseNav, ...managerNav, ...adminNav]; // Full access
  }

  if (role === 'fire_marshal') {
    return [
      ...baseNav,
      { name: 'Training', href: '/dashboard/training', icon: GraduationCap },
      { name: 'Drills', href: '/dashboard/drills', icon: Siren },
    ];
  }

  return baseNav; // Technician, Competent Person
};
```

---

## Best Practices

### Assigning Roles

1. **Principle of Least Privilege:** Assign the minimum role needed
2. **Site Scoping:** Use `siteIds` to restrict access to specific sites
3. **Regular Reviews:** Audit user roles quarterly
4. **Remove Access:** Delete or deactivate users when they leave

### Role Selection Guide

**Choose Responsible Person if:**
- Legal duty holder under UK fire safety law
- Building owner or managing agent
- Accountable for compliance

**Choose Site Manager if:**
- Manages day-to-day operations at specific sites
- Coordinates maintenance and checks
- Not the legal duty holder

**Choose Technician if:**
- Performs hands-on fire safety checks
- Reports to a manager
- No training responsibilities

**Choose Fire Marshal if:**
- Same as Technician, plus
- Leads fire drills
- Coordinates training activities

**Choose Competent Person if:**
- External contractor or consultant
- Conducts specialist inspections
- Provides expert advice

**Choose Auditor if:**
- Requires read-only access
- Insurance inspector or regulator
- Internal audit team

---

## Compliance Notes

### UK Fire Safety Law (Regulatory Reform Order 2005)

**Responsible Person (Article 3):**
- Must have the "Responsible Person" or "Super Admin" role in this system
- Cannot delegate ultimate responsibility
- Can appoint Competent Persons to assist (Article 18)

**Competent Person (Article 18):**
- Can be assigned "Competent Person" or "Site Manager" role
- Must have adequate training and experience
- Assists the Responsible Person

**Record Keeping (Article 9):**
- All check entries are **immutable** (cannot be deleted)
- Audit trail maintained automatically
- 6-year retention default (configurable)

---

## Future Enhancements

### Planned Improvements

1. **Custom Roles:** Allow organizations to define custom roles
2. **Granular Permissions:** More fine-grained control per feature
3. **Time-Based Access:** Temporary access for contractors
4. **Multi-Organization Users:** Users belonging to multiple organizations
5. **Delegation:** Temporary permission delegation during absences
6. **Approval Workflows:** Require approval for critical actions

---

## Support

**Questions about roles?**
- Review this document
- Check Firestore Security Rules: `firestore.rules`
- See role definitions: `src/types/index.ts`

**Need to change permissions?**
- Update `firestore.rules`
- Deploy new rules: `firebase deploy --only firestore:rules`
- Restart all sessions to pick up new custom claims

---

**Last Updated:** 2025-11-02
**Version:** 1.0
**Maintained By:** Development Team
