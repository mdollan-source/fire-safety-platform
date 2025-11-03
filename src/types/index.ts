// Core domain types for Fire Safety Log Book platform

export type UserRole =
  | 'super_admin'           // Vendor admin
  | 'responsible_person'    // Owns compliance per premises
  | 'site_manager'          // Manages sites
  | 'technician'            // Completes checks
  | 'fire_marshal'          // Completes checks + training
  | 'competent_person'      // External contractor
  | 'auditor';              // Read-only access

export type AssetType =
  | 'fire_door'
  | 'fire_alarm'
  | 'call_point'
  | 'emergency_lighting'
  | 'extinguisher'
  | 'sprinkler_system'
  | 'fire_blanket'
  | 'dry_riser'
  | 'hose_reel'
  | 'smoke_vent'
  | 'fire_curtain'
  | 'evacuation_chair'
  | 'assembly_point'
  | 'other';

export type CheckFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export type DefectSeverity = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

export type ReportType = 'compliance_pack' | 'checks_report' | 'defects_report' | 'assets_report' | 'drills_report' | 'training_report';

// =============================================================================
// ORGANISATION & TENANCY
// =============================================================================

export interface Organisation {
  id: string;
  name: string;
  domain?: string;                    // For white-label subdomain
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings: {
    retentionYears: number;           // Default 6
    timezone: string;                 // Default 'Europe/London'
    features: {
      whiteLabel: boolean;
      sso: boolean;
      auditorPortal: boolean;
      hrbPack: boolean;
    };
  };
  billing?: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    maxUsers: number;
    maxSites: number;
    storageGB: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// USERS & AUTH
// =============================================================================

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  siteIds?: string[];                 // Scope access to specific sites
  mfaEnabled: boolean;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SITES & LOCATIONS
// =============================================================================

export interface Site {
  id: string;
  orgId: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  location?: {
    lat: number;
    lng: number;
    what3words?: string;
    geoFence?: {                      // Optional geo-fencing for checks
      radius: number;                 // meters
    };
  };
  managerIds: string[];               // Site managers
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  siteId: string;
  name: string;
  floors?: number;
  hierarchy?: {
    parent?: string;                  // For complex site structures
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  level: number;                      // 0 = ground, -1 = basement, etc.
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ASSETS
// =============================================================================

export interface Asset {
  id: string;
  orgId: string;
  siteId: string;
  buildingId?: string;
  floorId?: string;
  type: AssetType;
  name?: string;                      // Optional asset name/description
  tag: string;                        // Asset identifier (e.g., "FD-001", "EXT-G-01")
  location: string;                   // Human-readable location
  attributes: Record<string, any>;    // Type-specific attributes
  typeSpecific?: any;                 // Legacy field for type-specific data
  serviceDates?: {
    installed?: Date;
    lastService?: Date;
    nextService?: Date;
  };
  qrCode?: string;                    // Optional QR code for scanning
  status: 'active' | 'inactive' | 'decommissioned';
  createdAt: Date;
  updatedAt: Date;
}

// Type-specific asset attributes
export interface ExtinguisherAttributes {
  type: 'water' | 'foam' | 'co2' | 'powder' | 'wet_chemical';
  size: string;                       // e.g., "6L", "2kg"
  manufacturer?: string;
  serialNumber?: string;
}

export interface FireDoorAttributes {
  fdRating: '30' | '60' | '90' | '120'; // Minutes
  hasCloser: boolean;
  hasIntumescentStrips: boolean;
  hasSmokeSeal: boolean;
  hasGlazing: boolean;
}

// =============================================================================
// CHECK TEMPLATES
// =============================================================================

export interface CheckTemplate {
  id: string;
  orgId?: string;                     // null = system default, can be cloned
  name: string;
  description?: string;
  assetType?: AssetType;              // null = applies to all
  frequency: CheckFrequency;
  rrule: string;                      // RFC 5545 recurrence rule
  fields: CheckField[];
  requiresEvidence: boolean;
  requiresGPS: boolean;
  requiresSignature: boolean;
  guidance?: string;                  // Micro-guidance for staff
  references?: string[];              // e.g., ["BS 5839-1:2017", "RRO Article 17"]
  version: number;                    // Template versioning
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'enum' | 'multiselect' | 'date';
  required: boolean;
  options?: string[];                 // For enum/multiselect
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
  };
  guidance?: string;
}

// =============================================================================
// SCHEDULES & TASKS
// =============================================================================

export interface Schedule {
  id: string;
  siteId: string;
  templateId: string;
  assetIds?: string[];                // null = all assets of type
  rrule: string;
  assignees: string[];                // User IDs
  sla?: {
    dueDays: number;
    escalateToManagerHours?: number;
    escalateToRPHours?: number;
  };
  active: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  scheduleId: string;
  templateId: string;
  siteId: string;
  assetId?: string;
  assigneeId: string;
  dueAt: Date;
  status: TaskStatus;
  completedAt?: Date;
  completedById?: string;
  claimedBy?: string;              // User ID who claimed the task
  claimedByName?: string;          // Name of user who claimed
  claimedAt?: Date;                // When task was claimed
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// ENTRIES (Completed Checks)
// =============================================================================

export interface Entry {
  id: string;
  taskId: string;
  templateId: string;
  assetId?: string;
  siteId: string;
  createdBy: string;
  createdAt: Date;
  deviceId?: string;                  // Device fingerprint
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  hash: string;                       // SHA-256 of entry data for immutability
  signature?: string;                 // Digital signature
  items: EntryItem[];
  evidenceIds: string[];
  version: number;                    // For tracking edits
  editReason?: string;                // Required if edited after submission
}

export interface EntryItem {
  fieldId: string;
  value: any;
  passFail?: 'pass' | 'fail' | 'n/a';
}

// =============================================================================
// EVIDENCE
// =============================================================================

export interface Evidence {
  id: string;
  entryId: string;
  fileUri: string;                    // Firebase Storage path
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;                       // SHA-256 of file
  exif?: Record<string, any>;         // Preserved EXIF data
  gps?: {
    lat: number;
    lng: number;
  };
  uploadedBy: string;
  uploadedAt: Date;
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export type DocumentCategory =
  | 'certificate'
  | 'manual'
  | 'plan'
  | 'insurance'
  | 'policy'
  | 'risk_assessment'
  | 'other';

export type DocumentEntityType = 'site' | 'asset' | 'organization' | 'training' | 'user';

export interface Document {
  id: string;
  orgId: string;
  entityType: DocumentEntityType;
  entityId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;                    // MIME type
  fileSize: number;                    // bytes
  storageUrl: string;                  // Firebase Storage path
  expiryDate?: Date;                   // For certificates
  expiryNotified?: boolean;            // Track if expiry notification sent
  version?: number;                    // For version control
  replacesDocumentId?: string;         // If this is a new version
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  updatedAt: Date;
}

// =============================================================================
// REPORTS
// =============================================================================

export interface Report {
  id: string;
  orgId: string;
  type: ReportType;
  siteId?: string;                     // null if 'all sites'
  siteName?: string;
  startDate: Date;
  endDate: Date;
  fileUri: string;                     // Firebase Storage path
  fileName: string;
  sizeBytes: number;
  generatedBy: string;
  generatedByName: string;
  generatedAt: Date;
}

// =============================================================================
// DEFECTS
// =============================================================================

export interface Defect {
  id: string;
  orgId: string;
  siteId: string;
  assetId?: string;
  sourceEntryId?: string;             // Entry that raised the defect
  severity: DefectSeverity;
  title: string;
  description: string;
  status: DefectStatus;
  assignedTo?: string;                // Assigned remediation owner
  targetDate?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  evidenceUrls: string[];             // Firebase Storage URLs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TRAINING & DRILLS
// =============================================================================

export interface TrainingRecord {
  id: string;
  siteId: string;
  orgId: string;
  date: Date;
  type: 'induction' | 'refresher' | 'drill' | 'specialist';
  syllabus: string;
  assessor: string;
  attendeeIds: string[];
  duration?: number;                  // minutes
  outcomes?: string;
  nextDue?: Date;
  evidenceIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// INSPECTOR VISITS
// =============================================================================

export interface InspectorVisit {
  id: string;
  siteId: string;
  date: Date;
  organisation: string;               // Fire service, HSE, etc.
  officerName: string;
  notes: string;
  actions?: {
    description: string;
    dueDate?: Date;
    completedAt?: Date;
  }[];
  outcome: 'pass' | 'advisory' | 'enforcement_notice' | 'prohibition_notice';
  evidenceIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// AUDIT TRAIL (Immutable)
// =============================================================================

export interface AuditEvent {
  id: string;
  orgId: string;
  actor: string;                      // User ID
  action: string;                     // e.g., "entry.create", "defect.resolve"
  entity: string;                     // e.g., "Entry", "Defect"
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    deviceId?: string;
  };
  timestamp: Date;
}

// =============================================================================
// KPI & ANALYTICS
// =============================================================================

export interface KPISnapshot {
  id: string;
  orgId: string;
  siteId?: string;                    // null = org-level
  date: Date;
  metrics: {
    checksScheduled: number;
    checksCompleted: number;
    checksOverdue: number;
    completionRate: number;
    defectsOpen: number;
    defectsCritical: number;
    defectsHigh: number;
    defectsMedium: number;
    defectsLow: number;
    avgTimeToCloseDefects?: number;   // days
    falseAlarmsCount?: number;
    trainingCoverage?: number;        // percentage
  };
  createdAt: Date;
}

// =============================================================================
// REPORTS & EXPORTS
// =============================================================================

export interface CompliancePack {
  id: string;
  orgId: string;
  siteId: string;
  startDate: Date;
  endDate: Date;
  generatedBy: string;
  generatedAt: Date;
  fileUri: string;                    // PDF storage path
  hash: string;                       // SHA-256 for verification
  includesData: {
    entries: number;
    defects: number;
    training: number;
    visits: number;
    evidence: number;
  };
}

// =============================================================================
// TYPE ALIASES (for app compatibility)
// =============================================================================

export type CheckSchedule = Schedule;
export type CheckTask = Task;
