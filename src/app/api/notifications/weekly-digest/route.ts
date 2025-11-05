import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigestNotification } from '@/lib/notifications/notification-service';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

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

    const body = await request.json();

    const { recipient, weekStart, weekEnd, stats } = body;

    // Validate required fields
    if (!recipient || !weekStart || !weekEnd || !stats) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send weekly digest
    await sendWeeklyDigestNotification({
      recipient,
      weekStart,
      weekEnd,
      stats,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
