import { NextRequest, NextResponse } from 'next/server';
import { notifyResponsiblePersonsAboutDefect } from '@/lib/notifications/notification-service';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { orgId, defectId, defectTitle, severity, siteName, assetName, reportedBy } = body;

    // Validate required fields
    if (!orgId || !defectId || !defectTitle || !severity || !siteName || !reportedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send notification to all responsible persons
    await notifyResponsiblePersonsAboutDefect({
      orgId,
      defectId,
      defectTitle,
      severity,
      siteName,
      assetName,
      reportedBy,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending defect notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
