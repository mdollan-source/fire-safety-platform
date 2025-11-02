import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, organisationName } = body;

    // Validation
    if (!email || !name || !organisationName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, organisationName' },
        { status: 400 }
      );
    }

    // Generate welcome email HTML
    const htmlContent = generateWelcomeEmail(name, organisationName);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Fire Safety Log Book',
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return NextResponse.json(
        { error: 'Failed to send welcome email', details: emailResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      emailId: emailResponse.data?.id,
    });

  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}

// Generate welcome email HTML
function generateWelcomeEmail(userName: string, organisationName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fire Safety Log Book</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Fire Safety Log Book</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome aboard!</h2>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Congratulations on setting up <strong>${organisationName}</strong> on Fire Safety Log Book! Your organisation is now ready to manage fire safety compliance, inspections, and records.
              </p>

              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Here's a quick guide to help you get started:
              </p>

              <!-- Quick Start Guide -->
              <table role="presentation" style="width: 100%; background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Quick Start Guide</h3>

                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="width: 24px; padding-right: 12px; vertical-align: top;">
                                <div style="width: 20px; height: 20px; background-color: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">1</div>
                              </td>
                              <td>
                                <p style="margin: 0; color: #4a4a4a; font-size: 14px;"><strong>Add Assets:</strong> Register fire doors, alarms, extinguishers, and emergency lighting</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="width: 24px; padding-right: 12px; vertical-align: top;">
                                <div style="width: 20px; height: 20px; background-color: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">2</div>
                              </td>
                              <td>
                                <p style="margin: 0; color: #4a4a4a; font-size: 14px;"><strong>Schedule Checks:</strong> Set up recurring inspections based on compliance requirements</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="width: 24px; padding-right: 12px; vertical-align: top;">
                                <div style="width: 20px; height: 20px; background-color: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">3</div>
                              </td>
                              <td>
                                <p style="margin: 0; color: #4a4a4a; font-size: 14px;"><strong>Invite Team:</strong> Add site managers and inspectors to collaborate</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="width: 24px; padding-right: 12px; vertical-align: top;">
                                <div style="width: 20px; height: 20px; background-color: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">4</div>
                              </td>
                              <td>
                                <p style="margin: 0; color: #4a4a4a; font-size: 14px;"><strong>Complete Checks:</strong> Record your inspections and capture any defects</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0;">
                          <table role="presentation">
                            <tr>
                              <td style="width: 24px; padding-right: 12px; vertical-align: top;">
                                <div style="width: 20px; height: 20px; background-color: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">5</div>
                              </td>
                              <td>
                                <p style="margin: 0; color: #4a4a4a; font-size: 14px;"><strong>Generate Reports:</strong> Export compliance reports for regulatory requirements</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Get Started</a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

              <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px; line-height: 1.5;">
                Need help? Check out our documentation or contact support at any time.
              </p>

              <p style="margin: 0; color: #6a6a6a; font-size: 14px; line-height: 1.5;">
                We're here to help you maintain fire safety compliance effortlessly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Fire Safety Log Book. All rights reserved.
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
