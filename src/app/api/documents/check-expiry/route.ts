import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { addDays, differenceInDays } from 'date-fns';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Check for CRON secret authorization
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON secret' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = addDays(today, 30);
    const ninetyDaysFromNow = addDays(today, 90);

    // Find all documents with expiry dates within the next 90 days that haven't been notified
    const expiringDocsSnapshot = await adminDb().collection('documents')
      .where('expiryDate', '<=', ninetyDaysFromNow)
      .where('expiryDate', '>=', today)
      .get();

    if (expiringDocsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No expiring documents found',
        notificationsSent: 0,
      });
    }

    let notificationsSent = 0;
    const notifications: any[] = [];

    for (const docSnapshot of expiringDocsSnapshot.docs) {
      const document = docSnapshot.data();
      const expiryDate = document.expiryDate.toDate();
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      // Determine if we should send notification based on threshold
      let shouldNotify = false;
      let urgency: 'critical' | 'warning' | 'info' = 'info';

      if (daysUntilExpiry <= 0) {
        // Expired
        shouldNotify = true;
        urgency = 'critical';
      } else if (daysUntilExpiry <= 7) {
        // Expiring within 7 days - send every time
        shouldNotify = true;
        urgency = 'critical';
      } else if (daysUntilExpiry <= 30) {
        // Expiring within 30 days - send once
        if (!document.expiryNotified) {
          shouldNotify = true;
          urgency = 'warning';
        }
      } else if (daysUntilExpiry <= 90) {
        // Expiring within 90 days - send once
        if (!document.expiryNotified) {
          shouldNotify = true;
          urgency = 'info';
        }
      }

      if (!shouldNotify) continue;

      // Get users to notify (org admins and site managers for the entity)
      const usersToNotify = await getUsersToNotify(document);

      if (usersToNotify.length === 0) {
        console.log(`No users to notify for document: ${document.title}`);
        continue;
      }

      // Send email to each user
      for (const user of usersToNotify) {
        try {
          const emailResponse = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>',
            to: [user.email],
            subject: `${urgency === 'critical' ? '🚨 URGENT' : '⚠️'} Certificate Expiring - ${document.title}`,
            html: generateExpiryEmail(
              user.name,
              document.title,
              document.category,
              expiryDate,
              daysUntilExpiry,
              urgency,
              document.entityType,
              document.entityId
            ),
          });

          if (!emailResponse.error) {
            notificationsSent++;
            notifications.push({
              documentId: docSnapshot.id,
              documentTitle: document.title,
              recipientEmail: user.email,
              daysUntilExpiry,
              urgency,
            });
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }

      // Mark as notified (except for expired or very soon to expire - we'll keep notifying)
      if (daysUntilExpiry > 7 && !document.expiryNotified) {
        await adminDb().collection('documents').doc(docSnapshot.id).update({
          expiryNotified: true,
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Expiry check complete. Sent ${notificationsSent} notifications.`,
      notificationsSent,
      notifications,
    });

  } catch (error: any) {
    console.error('Error checking document expiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check document expiry' },
      { status: 500 }
    );
  }
}

async function getUsersToNotify(document: any): Promise<any[]> {
  try {
    // Get all org admins and responsible persons
    const usersSnapshot = await adminDb().collection('users')
      .where('orgId', '==', document.orgId)
      .where('status', '==', 'active')
      .get();

    const users = usersSnapshot.docs
      .map(doc => doc.data())
      .filter(user =>
        user.role === 'responsible_person' ||
        user.role === 'super_admin' ||
        user.role === 'site_manager'
      );

    return users;
  } catch (error) {
    console.error('Error getting users to notify:', error);
    return [];
  }
}

function generateExpiryEmail(
  userName: string,
  documentTitle: string,
  category: string,
  expiryDate: Date,
  daysUntilExpiry: number,
  urgency: 'critical' | 'warning' | 'info',
  entityType: string,
  entityId: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const entityUrl = `${appUrl}/dashboard/${entityType}s/${entityId}`;

  const getCategoryLabel = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const urgencyColor = urgency === 'critical' ? '#dc2626' : urgency === 'warning' ? '#f59e0b' : '#3b82f6';
  const urgencyBg = urgency === 'critical' ? '#fee2e2' : urgency === 'warning' ? '#fef3c7' : '#dbeafe';

  const statusText = daysUntilExpiry <= 0
    ? 'EXPIRED'
    : daysUntilExpiry <= 7
    ? `EXPIRES IN ${daysUntilExpiry} DAY${daysUntilExpiry !== 1 ? 'S' : ''}`
    : `EXPIRES IN ${daysUntilExpiry} DAYS`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate Expiry Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Fire Safety Log</h1>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; background-color: ${urgencyColor}; padding: 16px 40px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                      ${urgency === 'critical' ? '🚨' : '⚠️'} CERTIFICATE EXPIRY ALERT
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">${urgency === 'critical' ? 'Immediate Action Required' : 'Renewal Required'}</h2>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>

              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                A fire safety certificate ${daysUntilExpiry <= 0 ? 'has expired' : 'is expiring soon'} and requires your attention.
              </p>

              <!-- Document Details Table -->
              <table role="presentation" style="width: 100%; background-color: #f9f9f9; border-radius: 6px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Certificate Details</h3>

                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Document:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                          <span style="color: #1a1a1a; font-size: 14px;">${documentTitle}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Category:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                          <span style="color: #1a1a1a; font-size: 14px;">${getCategoryLabel(category)}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Expiry Date:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                          <span style="color: #1a1a1a; font-size: 14px;">${formatDate(expiryDate)}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Status:</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="display: inline-block; padding: 4px 12px; background-color: ${urgencyColor}; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 12px;">
                            ${statusText}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgency Notice -->
              <table role="presentation" style="width: 100%; background-color: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; border-radius: 4px; padding: 16px; margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: ${urgencyColor}; font-size: 14px; line-height: 1.5;">
                      <strong style="display: block; margin-bottom: 4px;">${urgency === 'critical' ? '⚠️ Critical Action Required' : urgency === 'warning' ? '⚠️ Action Required Soon' : 'ℹ️ Renewal Reminder'}</strong>
                      ${daysUntilExpiry <= 0
                        ? 'This certificate has expired. You may be in breach of fire safety regulations.'
                        : daysUntilExpiry <= 7
                        ? 'This certificate expires within the next 7 days. Immediate action is required.'
                        : daysUntilExpiry <= 30
                        ? 'This certificate expires within the next 30 days. Please arrange renewal.'
                        : 'This certificate will expire within the next 90 days. Plan for renewal.'
                      }
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${entityUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Document</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #6a6a6a; font-size: 13px; word-break: break-all;">
                ${entityUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

              <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px; line-height: 1.5;">
                <strong>Next Steps:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                <li>Contact your service provider to arrange renewal</li>
                <li>Upload the new certificate once renewed</li>
                <li>Update expiry dates in the system</li>
                <li>Maintain compliance records</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Fire Safety Log. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
