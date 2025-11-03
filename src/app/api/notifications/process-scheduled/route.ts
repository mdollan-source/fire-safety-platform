import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import {
  sendTaskReminderNotification,
  sendTaskOverdueNotification,
} from '@/lib/notifications/notification-service';
import { differenceInHours, differenceInDays, addHours } from 'date-fns';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

/**
 * Process scheduled notifications for task reminders and overdue alerts
 * This endpoint should be called by a cron job (e.g., every hour)
 *
 * For production, consider using:
 * - Vercel Cron Jobs
 * - GitHub Actions with scheduled workflows
 * - External cron service (cron-job.org)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET is not set in environment variables');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized attempt to access scheduled notifications endpoint');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      reminders24h: 0,
      reminders1h: 0,
      overdue: 0,
      errors: [] as string[],
    };

    // Get all pending/in_progress tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', 'in', ['pending', 'in_progress'])
    );

    const tasksSnapshot = await getDocs(tasksQuery);

    for (const taskDoc of tasksSnapshot.docs) {
      try {
        const taskData = taskDoc.data();
        const taskId = taskDoc.id;

        // Convert Firestore Timestamp to Date
        const dueDate = taskData.dueDate instanceof Timestamp
          ? taskData.dueDate.toDate()
          : new Date(taskData.dueDate);

        // Check if task is overdue
        if (dueDate < now) {
          const daysOverdue = differenceInDays(now, dueDate);

          // Only send overdue notification once per day
          const lastOverdueNotif = taskData.lastOverdueNotification instanceof Timestamp
            ? taskData.lastOverdueNotification.toDate()
            : null;

          const shouldSendOverdue = !lastOverdueNotif ||
            differenceInHours(now, lastOverdueNotif) >= 24;

          if (shouldSendOverdue && taskData.assignedTo) {
            // Get assigned user details
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('__name__', '==', taskData.assignedTo))
            );

            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();

              await sendTaskOverdueNotification({
                recipient: {
                  userId: taskData.assignedTo,
                  email: userData.email,
                  name: userData.name,
                },
                taskId,
                taskTitle: taskData.title || 'Fire Safety Check',
                siteName: taskData.siteName || 'Unknown Site',
                assetName: taskData.assetName,
                dueDate: dueDate.toLocaleDateString('en-GB'),
                daysOverdue,
              });

              results.overdue++;
            }
          }
        }
        // Check for 24-hour reminder
        else {
          const hoursUntilDue = differenceInHours(dueDate, now);

          // Send 24-hour reminder (between 23 and 25 hours before due)
          if (hoursUntilDue >= 23 && hoursUntilDue <= 25) {
            const lastReminder24h = taskData.lastReminder24h instanceof Timestamp
              ? taskData.lastReminder24h.toDate()
              : null;

            const shouldSend24h = !lastReminder24h;

            if (shouldSend24h && taskData.assignedTo) {
              const userDoc = await getDocs(
                query(collection(db, 'users'), where('__name__', '==', taskData.assignedTo))
              );

              if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();

                await sendTaskReminderNotification({
                  recipient: {
                    userId: taskData.assignedTo,
                    email: userData.email,
                    name: userData.name,
                  },
                  taskId,
                  taskTitle: taskData.title || 'Fire Safety Check',
                  siteName: taskData.siteName || 'Unknown Site',
                  assetName: taskData.assetName,
                  dueDate: dueDate.toLocaleDateString('en-GB'),
                  hoursUntilDue: 24,
                });

                results.reminders24h++;
              }
            }
          }
          // Send 1-hour reminder (between 0.5 and 1.5 hours before due)
          else if (hoursUntilDue >= 0.5 && hoursUntilDue <= 1.5) {
            const lastReminder1h = taskData.lastReminder1h instanceof Timestamp
              ? taskData.lastReminder1h.toDate()
              : null;

            const shouldSend1h = !lastReminder1h;

            if (shouldSend1h && taskData.assignedTo) {
              const userDoc = await getDocs(
                query(collection(db, 'users'), where('__name__', '==', taskData.assignedTo))
              );

              if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();

                await sendTaskReminderNotification({
                  recipient: {
                    userId: taskData.assignedTo,
                    email: userData.email,
                    name: userData.name,
                  },
                  taskId,
                  taskTitle: taskData.title || 'Fire Safety Check',
                  siteName: taskData.siteName || 'Unknown Site',
                  assetName: taskData.assetName,
                  dueDate: dueDate.toLocaleDateString('en-GB'),
                  hoursUntilDue: 1,
                });

                results.reminders1h++;
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`Error processing task ${taskDoc.id}:`, error);
        results.errors.push(`Task ${taskDoc.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: tasksSnapshot.size,
      results,
    });
  } catch (error: any) {
    console.error('Error processing scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications', details: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Scheduled notifications processor is ready',
    timestamp: new Date().toISOString(),
  });
}
