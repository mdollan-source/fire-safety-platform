import { sendEmail, emailTemplates } from './email';
import { sendPushNotification, sendMulticastPushNotification } from './fcm-admin';
import { adminDb } from '@/lib/firebase/admin';

export interface NotificationRecipient {
  userId: string;
  email: string;
  name: string;
}

/**
 * Get all FCM tokens for a user (using Admin SDK for server-side)
 */
async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokensSnapshot = await adminDb()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    return tokensSnapshot.docs.map((doc) => doc.data().token);
  } catch (error) {
    console.error('Error fetching user FCM tokens:', error);
    return [];
  }
}

/**
 * Get FCM tokens for multiple users
 */
async function getMultipleUsersFCMTokens(userIds: string[]): Promise<string[]> {
  const allTokens: string[] = [];

  for (const userId of userIds) {
    const tokens = await getUserFCMTokens(userId);
    allTokens.push(...tokens);
  }

  return allTokens;
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentNotification({
  recipient,
  taskId,
  taskTitle,
  siteName,
  assetName,
  dueDate,
}: {
  recipient: NotificationRecipient;
  taskId: string;
  taskTitle: string;
  siteName: string;
  assetName?: string;
  dueDate: string;
}) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checks/${taskId}`;

  // Send email
  try {
    const template = emailTemplates.taskAssignment({
      userName: recipient.name,
      taskTitle,
      siteName,
      assetName,
      dueDate,
      taskUrl,
    });

    await sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Error sending task assignment email:', error);
  }

  // Send push notification
  try {
    console.log('📱 Attempting to get FCM tokens for user:', recipient.userId);
    const fcmTokens = await getUserFCMTokens(recipient.userId);
    console.log('📱 Found FCM tokens:', fcmTokens.length, fcmTokens);

    if (fcmTokens.length > 0) {
      console.log('📱 Sending FCM push notification to', fcmTokens.length, 'token(s)');
      const result = await sendMulticastPushNotification({
        tokens: fcmTokens,
        title: 'New Task Assigned',
        body: `${taskTitle} - Due ${dueDate}`,
        data: {
          type: 'task_assignment',
          taskId,
          url: taskUrl,
        },
      });
      console.log('📱 FCM send result:', result);
    } else {
      console.log('📱 No FCM tokens found - skipping push notification');
    }
  } catch (error) {
    console.error('❌ Error sending task assignment push notification:', error);
  }
}

/**
 * Send task reminder notification
 */
export async function sendTaskReminderNotification({
  recipient,
  taskId,
  taskTitle,
  siteName,
  assetName,
  dueDate,
  hoursUntilDue,
}: {
  recipient: NotificationRecipient;
  taskId: string;
  taskTitle: string;
  siteName: string;
  assetName?: string;
  dueDate: string;
  hoursUntilDue: number;
}) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checks/${taskId}`;

  // Send email
  try {
    const template = emailTemplates.taskReminder({
      userName: recipient.name,
      taskTitle,
      siteName,
      assetName,
      dueDate,
      hoursUntilDue,
      taskUrl,
    });

    await sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Error sending task reminder email:', error);
  }

  // Send push notification
  try {
    const fcmTokens = await getUserFCMTokens(recipient.userId);

    if (fcmTokens.length > 0) {
      await sendMulticastPushNotification({
        tokens: fcmTokens,
        title: `Task Due ${hoursUntilDue < 2 ? 'in 1 Hour' : 'in 24 Hours'}`,
        body: `${taskTitle} at ${siteName}`,
        data: {
          type: 'task_reminder',
          taskId,
          url: taskUrl,
        },
      });
    }
  } catch (error) {
    console.error('Error sending task reminder push notification:', error);
  }
}

/**
 * Send task overdue notification
 */
export async function sendTaskOverdueNotification({
  recipient,
  taskId,
  taskTitle,
  siteName,
  assetName,
  dueDate,
  daysOverdue,
}: {
  recipient: NotificationRecipient;
  taskId: string;
  taskTitle: string;
  siteName: string;
  assetName?: string;
  dueDate: string;
  daysOverdue: number;
}) {
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checks/${taskId}`;

  // Send email
  try {
    const template = emailTemplates.taskOverdue({
      userName: recipient.name,
      taskTitle,
      siteName,
      assetName,
      dueDate,
      daysOverdue,
      taskUrl,
    });

    await sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Error sending task overdue email:', error);
  }

  // Send push notification
  try {
    const fcmTokens = await getUserFCMTokens(recipient.userId);

    if (fcmTokens.length > 0) {
      await sendMulticastPushNotification({
        tokens: fcmTokens,
        title: 'URGENT: Task Overdue',
        body: `${taskTitle} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
        data: {
          type: 'task_overdue',
          taskId,
          url: taskUrl,
        },
      });
    }
  } catch (error) {
    console.error('Error sending task overdue push notification:', error);
  }
}

/**
 * Send defect reported notification
 */
export async function sendDefectReportedNotification({
  recipient,
  defectId,
  defectTitle,
  severity,
  siteName,
  assetName,
  reportedBy,
}: {
  recipient: NotificationRecipient;
  defectId: string;
  defectTitle: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  siteName: string;
  assetName?: string;
  reportedBy: string;
}) {
  const defectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/defects/${defectId}`;

  // Send email
  try {
    const template = emailTemplates.defectReported({
      userName: recipient.name,
      defectTitle,
      severity,
      siteName,
      assetName,
      reportedBy,
      defectUrl,
    });

    await sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Error sending defect reported email:', error);
  }

  // Send push notification
  try {
    const fcmTokens = await getUserFCMTokens(recipient.userId);

    if (fcmTokens.length > 0) {
      await sendMulticastPushNotification({
        tokens: fcmTokens,
        title: severity === 'critical' ? 'CRITICAL Defect Reported' : 'New Defect Reported',
        body: `${defectTitle} - ${severity.toUpperCase()} severity`,
        data: {
          type: 'defect_reported',
          defectId,
          severity,
          url: defectUrl,
        },
      });
    }
  } catch (error) {
    console.error('Error sending defect reported push notification:', error);
  }
}

/**
 * Send weekly digest notification (email only)
 */
export async function sendWeeklyDigestNotification({
  recipient,
  weekStart,
  weekEnd,
  stats,
}: {
  recipient: NotificationRecipient;
  weekStart: string;
  weekEnd: string;
  stats: {
    tasksCompleted: number;
    tasksDue: number;
    tasksOverdue: number;
    newDefects: number;
    openDefects: number;
  };
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  try {
    const template = emailTemplates.weeklyDigest({
      userName: recipient.name,
      weekStart,
      weekEnd,
      stats,
      dashboardUrl,
    });

    await sendEmail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Error sending weekly digest email:', error);
  }
}

/**
 * Notify responsible persons about a new defect
 */
export async function notifyResponsiblePersonsAboutDefect({
  orgId,
  defectId,
  defectTitle,
  severity,
  siteName,
  assetName,
  reportedBy,
}: {
  orgId: string;
  defectId: string;
  defectTitle: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  siteName: string;
  assetName?: string;
  reportedBy: string;
}) {
  try {
    // Get all responsible persons in the organization using Admin SDK
    const usersSnapshot = await adminDb()
      .collection('users')
      .where('orgId', '==', orgId)
      .where('role', 'in', ['responsible_person', 'super_admin'])
      .get();

    // Send notification to each responsible person
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (userData.email && userData.name) {
        await sendDefectReportedNotification({
          recipient: {
            userId: userDoc.id,
            email: userData.email,
            name: userData.name,
          },
          defectId,
          defectTitle,
          severity,
          siteName,
          assetName,
          reportedBy,
        });
      }
    }
  } catch (error) {
    console.error('Error notifying responsible persons about defect:', error);
  }
}
