import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defectId, defectTitle, siteName, severity, orgId } = body;

    // Validation
    if (!defectId || !defectTitle || !siteName || !severity || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only send alerts for critical defects
    if (severity !== 'critical') {
      return NextResponse.json({
        success: true,
        message: 'Alert not sent - only critical defects trigger alerts',
      });
    }

    // Get all users in the organization using Admin SDK
    const usersSnapshot = await adminDb.collection('users')
      .where('orgId', '==', orgId)
      .where('status', '==', 'active')
      .get();

    if (usersSnapshot.empty) {
      console.log('No users found for organization:', orgId);
      return NextResponse.json({
        success: true,
        message: 'No users to notify',
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defectUrl = `${appUrl}/dashboard/defects/${defectId}`;

    // Send email to all active users (org admins and site managers)
    const emailPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();

      try {
        const emailResponse = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>',
          to: [userData.email],
          subject: `🚨 Critical Defect Alert - ${siteName}`,
          html: generateDefectAlertEmail(
            userData.name || 'User',
            defectTitle,
            siteName,
            severity,
            defectUrl
          ),
        });

        return emailResponse;
      } catch (error) {
        console.error(`Failed to send email to ${userData.email}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      message: `Critical defect alert sent to ${successCount} users`,
      emailsSent: successCount,
    });

  } catch (error: any) {
    console.error('Error sending defect alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send defect alert' },
      { status: 500 }
    );
  }
}

// Generate critical defect alert email HTML
function generateDefectAlertEmail(
  userName: string,
  defectTitle: string,
  siteName: string,
  severity: string,
  defectUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Critical Defect Alert</title>
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
              <table role="presentation" style="width: 100%; background-color: #dc2626; padding: 16px 40px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                      🚨 CRITICAL DEFECT ALERT
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Immediate Action Required</h2>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>

              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                A critical fire safety defect has been identified and requires your immediate attention.
              </p>

              <!-- Defect Details Table -->
              <table role="presentation" style="width: 100%; background-color: #f9f9f9; border-radius: 6px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Defect Details</h3>

                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Defect:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                          <span style="color: #1a1a1a; font-size: 14px;">${defectTitle}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Site:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                          <span style="color: #1a1a1a; font-size: 14px;">${siteName}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #6a6a6a; font-size: 14px;">Severity:</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 12px; text-transform: uppercase;">
                            ${severity}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgency Notice -->
              <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong style="display: block; margin-bottom: 4px;">⚠️ Urgent Action Required</strong>
                      Critical defects must be addressed within 24 hours to maintain fire safety compliance.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${defectUrl}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Defect Details</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #6a6a6a; font-size: 13px; word-break: break-all;">
                ${defectUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

              <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px; line-height: 1.5;">
                <strong>Next Steps:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                <li>Review the defect details immediately</li>
                <li>Assign responsibility for resolution</li>
                <li>Update status as work progresses</li>
                <li>Document resolution with photos</li>
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
