import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, template = 'invitation' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const testName = name || 'Test User';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let subject = '';
    let htmlContent = '';

    switch (template) {
      case 'invitation':
        subject = 'Test Invitation - Fire Safety Log Book';
        htmlContent = generateInvitationEmail(testName, appUrl);
        break;
      case 'welcome':
        subject = 'Welcome to Fire Safety Log Book';
        htmlContent = generateWelcomeEmail(testName, 'Test Organisation');
        break;
      case 'password_reset':
        subject = 'Reset Your Password - Fire Safety Log Book';
        htmlContent = generatePasswordResetEmail(testName, appUrl);
        break;
      case 'defect_alert':
        subject = 'Critical Defect Alert - Fire Safety Log Book';
        htmlContent = generateDefectAlertEmail(testName, appUrl);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid template type' },
          { status: 400 }
        );
    }

    // Send test email
    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>',
      to: [email],
      subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: emailResponse.data?.id,
      sentTo: email,
      template,
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}

// Base email wrapper
function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fire Safety Log Book</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Header component
function getHeader(subtitle?: string): string {
  return `
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Fire Safety Log Book</h1>
        ${subtitle ? `<p style="margin: 10px 0 0 0; color: #cccccc; font-size: 14px; font-weight: 500;">${subtitle}</p>` : ''}
      </td>
    </tr>
  `;
}

// Footer component
function getFooter(): string {
  return `
    <tr>
      <td style="padding: 24px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
          © ${new Date().getFullYear()} Fire Safety Log Book. All rights reserved.
        </p>
        <p style="margin: 8px 0 0 0; color: #8a8a8a; font-size: 11px;">
          Test email sent at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </p>
      </td>
    </tr>
  `;
}

// Button component
function getButton(url: string, text: string): string {
  return `
    <table role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

// Test warning banner
function getTestWarning(message: string): string {
  return `
    <div style="background-color: #f5f5f5; border-left: 4px solid #000000; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; color: #000000; font-size: 14px; font-weight: 600;">
        ⚠️ This is a TEST email
      </p>
      <p style="margin: 8px 0 0 0; color: #333333; font-size: 13px; line-height: 1.5;">
        ${message}
      </p>
    </div>
  `;
}

// 1. INVITATION EMAIL
function generateInvitationEmail(userName: string, appUrl: string): string {
  const invitationUrl = `${appUrl}/sign-up?token=TEST_${Date.now()}&email=test@example.com`;

  const content = `
    ${getHeader('TEST INVITATION EMAIL')}

    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">You've been invited!</h2>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Hi ${userName},
        </p>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Fire Safety Admin has invited you to join their organisation on Fire Safety Log Book as a <strong>Site Manager</strong>.
        </p>

        <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Fire Safety Log Book helps you manage fire safety compliance, track inspections, and maintain comprehensive records for regulatory requirements.
        </p>

        ${getButton(invitationUrl, 'Accept Invitation')}

        <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #6a6a6a; font-size: 13px; word-break: break-all;">
          ${invitationUrl}
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

        ${getTestWarning('This email was sent to test the invitation system. The invitation link uses a test token and will not work.')}

        <p style="margin: 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>

    ${getFooter()}
  `;

  return wrapEmail(content);
}

// 2. WELCOME EMAIL
function generateWelcomeEmail(userName: string, orgName: string): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

  const content = `
    ${getHeader('WELCOME')}

    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome to Fire Safety Log Book!</h2>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Hi ${userName},
        </p>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Congratulations! Your organisation <strong>${orgName}</strong> has been successfully set up on Fire Safety Log Book.
        </p>

        <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          You can now start managing your fire safety compliance, tracking inspections, and maintaining comprehensive records.
        </p>

        ${getButton(dashboardUrl, 'Go to Dashboard')}

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Quick Start Guide</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
            <li>Add your sites and premises</li>
            <li>Register fire safety assets</li>
            <li>Set up check templates</li>
            <li>Schedule recurring checks</li>
            <li>Invite team members</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

        ${getTestWarning('This is a test welcome email. In production, this would be sent when a new organisation is created.')}

        <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
          Need help getting started? Contact our support team or visit our help center.
        </p>
      </td>
    </tr>

    ${getFooter()}
  `;

  return wrapEmail(content);
}

// 3. PASSWORD RESET EMAIL
function generatePasswordResetEmail(userName: string, appUrl: string): string {
  const resetUrl = `${appUrl}/reset-password?token=TEST_RESET_${Date.now()}`;

  const content = `
    ${getHeader('PASSWORD RESET')}

    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h2>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Hi ${userName},
        </p>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          We received a request to reset the password for your Fire Safety Log Book account.
        </p>

        <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Click the button below to create a new password:
        </p>

        ${getButton(resetUrl, 'Reset Password')}

        <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #6a6a6a; font-size: 13px; word-break: break-all;">
          ${resetUrl}
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #856404; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600;">
            ⏱️ This link expires in 1 hour
          </p>
          <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px; line-height: 1.5;">
            For security reasons, this password reset link will only work once and expires after 1 hour.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

        ${getTestWarning('This is a test password reset email. The reset link uses a test token and will not work.')}

        <p style="margin: 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
          <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </td>
    </tr>

    ${getFooter()}
  `;

  return wrapEmail(content);
}

// 4. CRITICAL DEFECT ALERT
function generateDefectAlertEmail(userName: string, appUrl: string): string {
  const defectUrl = `${appUrl}/dashboard/defects/defect_${Date.now()}`;

  const content = `
    ${getHeader('CRITICAL ALERT')}

    <tr>
      <td style="padding: 40px;">
        <div style="background-color: #fee; border-left: 4px solid #dc3545; padding: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; color: #dc3545; font-size: 24px; font-weight: 700;">⚠️ Critical Defect Raised</h2>
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            Immediate action required
          </p>
        </div>

        <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Hi ${userName},
        </p>

        <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          A critical fire safety defect has been raised and requires immediate attention.
        </p>

        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px; width: 120px;">Defect:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Emergency Exit Blocked</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Severity:</td>
              <td style="padding: 8px 0;">
                <span style="display: inline-block; padding: 4px 8px; background-color: #dc3545; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600;">CRITICAL</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Site:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Main Office Building</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Raised:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Raised by:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">John Smith (Technician)</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">
            Description:
          </p>
          <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
            Fire exit on ground floor (East wing) is blocked by storage pallets. This creates an immediate safety hazard in the event of an emergency evacuation.
          </p>
        </div>

        ${getButton(defectUrl, 'View Defect Details')}

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

        ${getTestWarning('This is a test critical defect alert. In production, this would be sent when a critical defect is raised.')}

        <p style="margin: 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
          Critical defects require immediate action to maintain compliance and ensure safety.
        </p>
      </td>
    </tr>

    ${getFooter()}
  `;

  return wrapEmail(content);
}
