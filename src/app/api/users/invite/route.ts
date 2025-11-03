import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, siteIds, orgId, invitedBy } = body;

    // Validation
    if (!name || !email || !role || !orgId || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate user ID and invitation token
    const userId = `user_${Date.now()}`;
    const invitationToken = generateToken();
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user document in Firestore with invitation status
    const userDoc: any = {
      id: userId,
      orgId,
      email: email.toLowerCase(),
      name: name,
      role: role,
      status: 'invited', // Changed from 'active' to 'invited'
      mfaEnabled: false,
      invitationToken,
      invitationExpiry,
      invitedBy,
      invitedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add site access if specified
    if (siteIds && siteIds.length > 0) {
      userDoc.siteIds = siteIds;
    }

    // Save to Firestore
    await setDoc(doc(db, 'users', userId), userDoc);

    // Generate invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${appUrl}/sign-up?token=${invitationToken}&email=${encodeURIComponent(email)}`;

    // Get role label for email
    const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Send invitation email using Resend
    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>',
      to: [email],
      subject: 'You\'ve been invited to Fire Safety Log',
      html: generateInvitationEmail(name, roleLabel, invitationUrl, invitedBy),
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      // Delete the user document if email fails
      // await deleteDoc(doc(db, 'users', userId));
      return NextResponse.json(
        { error: 'Failed to send invitation email', details: emailResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Invitation sent successfully',
      emailId: emailResponse.data?.id,
    });

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

// Generate random invitation token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate invitation email HTML
function generateInvitationEmail(
  userName: string,
  roleLabel: string,
  invitationUrl: string,
  invitedBy: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fire Safety Log Invitation</title>
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

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">You've been invited!</h2>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${invitedBy} has invited you to join their organisation on Fire Safety Log as a <strong>${roleLabel}</strong>.
              </p>

              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Fire Safety Log helps you manage fire safety compliance, track inspections, and maintain comprehensive records for regulatory requirements.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Accept Invitation</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #6a6a6a; font-size: 13px; word-break: break-all;">
                ${invitationUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

              <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
                <strong>Important:</strong> This invitation will expire in 7 days.
              </p>

              <p style="margin: 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
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
