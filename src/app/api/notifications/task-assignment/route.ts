import { NextRequest, NextResponse } from 'next/server';
import { sendTaskAssignmentNotification } from '@/lib/notifications/notification-service';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { recipient, taskId, taskTitle, siteName, assetName, dueDate } = body;

    // Validate required fields
    if (!recipient || !taskId || !taskTitle || !siteName || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send notification
    await sendTaskAssignmentNotification({
      recipient,
      taskId,
      taskTitle,
      siteName,
      assetName,
      dueDate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
