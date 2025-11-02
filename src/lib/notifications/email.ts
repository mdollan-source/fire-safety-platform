import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'Fire Safety <onboarding@resend.dev>';

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailNotification) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email Templates
export const emailTemplates = {
  taskAssignment: ({
    userName,
    taskTitle,
    siteName,
    assetName,
    dueDate,
    taskUrl,
  }: {
    userName: string;
    taskTitle: string;
    siteName: string;
    assetName?: string;
    dueDate: string;
    taskUrl: string;
  }) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .task-details { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fire Safety</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>You have been assigned a new fire safety check task.</p>

              <div class="task-details">
                <h3>${taskTitle}</h3>
                <p><strong>Site:</strong> ${siteName}</p>
                ${assetName ? `<p><strong>Asset:</strong> ${assetName}</p>` : ''}
                <p><strong>Due Date:</strong> ${dueDate}</p>
              </div>

              <p>Please complete this task by the due date to maintain compliance.</p>

              <a href="${taskUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">View Task Details</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Fire Safety System</p>
              <p>If you have any questions, please contact your Responsible Person</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  taskReminder: ({
    userName,
    taskTitle,
    siteName,
    assetName,
    dueDate,
    hoursUntilDue,
    taskUrl,
  }: {
    userName: string;
    taskTitle: string;
    siteName: string;
    assetName?: string;
    dueDate: string;
    hoursUntilDue: number;
    taskUrl: string;
  }) => ({
    subject: `Reminder: Task Due ${hoursUntilDue < 2 ? 'in 1 hour' : 'in 24 hours'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .task-details { background-color: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
            .warning { color: #f59e0b; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fire Safety</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p class="warning">⏰ Task Due ${hoursUntilDue < 2 ? 'in 1 Hour' : 'in 24 Hours'}</p>
              <p>This is a reminder about your upcoming fire safety check task.</p>

              <div class="task-details">
                <h3>${taskTitle}</h3>
                <p><strong>Site:</strong> ${siteName}</p>
                ${assetName ? `<p><strong>Asset:</strong> ${assetName}</p>` : ''}
                <p><strong>Due Date:</strong> ${dueDate}</p>
              </div>

              <p>Please complete this task soon to avoid it becoming overdue.</p>

              <a href="${taskUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Complete Task Now</a>
            </div>
            <div class="footer">
              <p>This is an automated reminder from Fire Safety System</p>
              <p>If you have any questions, please contact your Responsible Person</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  taskOverdue: ({
    userName,
    taskTitle,
    siteName,
    assetName,
    dueDate,
    daysOverdue,
    taskUrl,
  }: {
    userName: string;
    taskTitle: string;
    siteName: string;
    assetName?: string;
    dueDate: string;
    daysOverdue: number;
    taskUrl: string;
  }) => ({
    subject: `URGENT: Task Overdue - ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .task-details { background-color: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
            .urgent { color: #ef4444; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fire Safety</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p class="urgent">🚨 URGENT: Task is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</p>
              <p>Your fire safety check task is overdue and requires immediate attention.</p>

              <div class="task-details">
                <h3>${taskTitle}</h3>
                <p><strong>Site:</strong> ${siteName}</p>
                ${assetName ? `<p><strong>Asset:</strong> ${assetName}</p>` : ''}
                <p><strong>Was Due:</strong> ${dueDate}</p>
                <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
              </div>

              <p><strong>Action Required:</strong> Please complete this task immediately to maintain fire safety compliance.</p>

              <a href="${taskUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Complete Task Now</a>
            </div>
            <div class="footer">
              <p>This is an automated escalation from Fire Safety System</p>
              <p>Please contact your Responsible Person if you need assistance</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  defectReported: ({
    userName,
    defectTitle,
    severity,
    siteName,
    assetName,
    reportedBy,
    defectUrl,
  }: {
    userName: string;
    defectTitle: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    siteName: string;
    assetName?: string;
    reportedBy: string;
    defectUrl: string;
  }) => ({
    subject: `${severity === 'critical' ? 'CRITICAL' : 'New'} Defect Reported: ${defectTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .defect-details { background-color: white; border-left: 4px solid ${severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#6b7280'}; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
            .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; background-color: ${severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : severity === 'medium' ? '#3b82f6' : '#6b7280'}; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fire Safety</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>A ${severity === 'critical' ? 'critical' : 'new'} defect has been reported.</p>

              <div class="defect-details">
                <h3>${defectTitle}</h3>
                <p><span class="severity">${severity.toUpperCase()}</span></p>
                <p><strong>Site:</strong> ${siteName}</p>
                ${assetName ? `<p><strong>Asset:</strong> ${assetName}</p>` : ''}
                <p><strong>Reported By:</strong> ${reportedBy}</p>
              </div>

              ${severity === 'critical' ? '<p><strong>⚠️ This is a critical defect requiring immediate attention.</strong></p>' : '<p>Please review and assign this defect for resolution.</p>'}

              <a href="${defectUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">View Defect Details</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Fire Safety System</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  weeklyDigest: ({
    userName,
    weekStart,
    weekEnd,
    stats,
    dashboardUrl,
  }: {
    userName: string;
    weekStart: string;
    weekEnd: string;
    stats: {
      tasksCompleted: number;
      tasksDue: number;
      tasksOverdue: number;
      newDefects: number;
      openDefects: number;
    };
    dashboardUrl: string;
  }) => ({
    subject: `Weekly Summary: ${weekStart} - ${weekEnd}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background-color: white; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #10b981; }
            .stat-label { font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fire Safety</h1>
              <p>Weekly Summary</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Here's your weekly fire safety summary for ${weekStart} - ${weekEnd}:</p>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${stats.tasksCompleted}</div>
                  <div class="stat-label">Tasks Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #f59e0b;">${stats.tasksDue}</div>
                  <div class="stat-label">Tasks Due</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #ef4444;">${stats.tasksOverdue}</div>
                  <div class="stat-label">Tasks Overdue</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #3b82f6;">${stats.newDefects}</div>
                  <div class="stat-label">New Defects</div>
                </div>
              </div>

              ${stats.openDefects > 0 ? `<p><strong>You have ${stats.openDefects} open defect${stats.openDefects > 1 ? 's' : ''} requiring attention.</strong></p>` : ''}
              ${stats.tasksOverdue > 0 ? `<p style="color: #ef4444;"><strong>⚠️ ${stats.tasksOverdue} task${stats.tasksOverdue > 1 ? 's are' : ' is'} overdue!</strong></p>` : ''}

              <a href="${dashboardUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">View Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated weekly summary from Fire Safety System</p>
              <p>You can manage your notification preferences in your profile settings</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
