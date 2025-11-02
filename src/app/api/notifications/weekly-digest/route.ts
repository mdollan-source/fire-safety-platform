import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigestNotification } from '@/lib/notifications/notification-service';

export async function POST(request: NextRequest) {
  try {
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
