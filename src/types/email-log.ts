// Email logging types for super admin

export type EmailStatus = 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';

export type EmailType = 'welcome' | 'invitation' | 'password_reset' | 'defect_alert' | 'task_assignment' | 'weekly_digest';

export interface EmailLog {
  id: string;
  type: EmailType;
  to: string;
  from: string;
  subject: string;
  status: EmailStatus;
  orgId?: string;                    // Optional - some emails not org-specific
  userId?: string;                   // User who triggered the email
  resendId?: string;                 // Resend email ID for tracking
  error?: string;                    // Error message if failed
  metadata?: Record<string, any>;    // Additional context (e.g., template variables)
  webhookData?: {                    // Raw webhook data from Resend
    type: string;
    bounce_type?: string;
    complaint_type?: string;
    error?: string;
    timestamp: Date;
  };
  sentAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
