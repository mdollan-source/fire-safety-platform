# Cron Job Setup Guide for Hetzner VPS

This guide will help you set up automated task reminders and overdue notifications on your Hetzner VPS.

## What This Does

The cron job will run every hour and:
- Send 24-hour reminders for tasks due tomorrow
- Send 1-hour reminders for tasks due soon
- Send daily overdue alerts for late tasks
- Send both email AND push notifications to assigned users

## Prerequisites

- SSH access to your Hetzner VPS
- Your app deployed and running (via Coolify or Docker)
- The `CRON_SECRET` environment variable set in your production environment

## Step 1: Add CRON_SECRET to Production Environment

In Coolify (or your deployment system), add this environment variable:

```bash
CRON_SECRET=your_secure_random_secret_here
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANT:** Make sure to restart your app after adding this variable!

## Step 2: SSH into Your Hetzner VPS

```bash
ssh root@your-server-ip
```

## Step 3: Create the Cron Script

Create a script file that will run the cron job:

```bash
nano /root/fire-safety-cron.sh
```

Paste this content (replace `YOUR_DOMAIN` with your actual domain):

```bash
#!/bin/bash

# Fire Safety - Scheduled Notifications Cron Job
# Runs hourly to send task reminders and overdue alerts

LOG_FILE="/var/log/fire-safety-cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting scheduled notifications check..." >> $LOG_FILE

# Call the API endpoint with authentication
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://YOUR_DOMAIN/api/notifications/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "[$TIMESTAMP] SUCCESS: $BODY" >> $LOG_FILE
else
  echo "[$TIMESTAMP] ERROR (HTTP $HTTP_CODE): $BODY" >> $LOG_FILE
fi

echo "[$TIMESTAMP] Completed" >> $LOG_FILE
echo "" >> $LOG_FILE
```

**Make the script executable:**

```bash
chmod +x /root/fire-safety-cron.sh
```

## Step 4: Test the Script Manually

Before setting up the cron job, test that it works:

```bash
/root/fire-safety-cron.sh
```

Check the log file to verify it ran successfully:

```bash
cat /var/log/fire-safety-cron.log
```

You should see output like:
```
[2025-11-02 10:00:00] Starting scheduled notifications check...
[2025-11-02 10:00:01] SUCCESS: {"success":true,"processed":5,"results":{...}}
[2025-11-02 10:00:01] Completed
```

## Step 5: Set Up the Cron Job

Edit the crontab:

```bash
crontab -e
```

Add this line at the bottom (runs every hour at minute 0):

```bash
0 * * * * /root/fire-safety-cron.sh
```

**Cron Schedule Explanation:**
- `0 * * * *` = At minute 0 of every hour (e.g., 9:00, 10:00, 11:00)
- Adjust if you want different timing

**Alternative schedules you could use:**
```bash
# Every 30 minutes
*/30 * * * * /root/fire-safety-cron.sh

# Every 2 hours
0 */2 * * * /root/fire-safety-cron.sh

# Every day at 9am
0 9 * * * /root/fire-safety-cron.sh
```

Save and exit (in nano: Ctrl+X, then Y, then Enter).

## Step 6: Verify Cron Job is Active

Check that the cron job was added:

```bash
crontab -l
```

You should see your new cron job listed.

## Step 7: Monitor the Logs

After the cron job runs (wait for the next hour), check the logs:

```bash
tail -f /var/log/fire-safety-cron.log
```

This will show you real-time updates as the cron job runs.

## Troubleshooting

### Issue: HTTP 401 Unauthorized
**Solution:** Make sure `CRON_SECRET` in production matches the one in the script.

### Issue: HTTP 500 Server Error
**Solution:** Check your app logs. The `CRON_SECRET` might not be set in your production environment.

### Issue: Connection refused or timeout
**Solution:**
- Make sure your app is running
- Check your domain is correct and SSL is working
- Try accessing the URL manually in a browser (you'll get 401, but it proves the endpoint is reachable)

### Issue: No notifications being sent
**Solution:**
- Check that you have tasks with upcoming due dates
- Verify users have valid email addresses and FCM tokens
- Check your app logs for detailed error messages

## Viewing System Cron Logs

To see if cron is running your script:

```bash
# Ubuntu/Debian
grep CRON /var/log/syslog | tail -20

# CentOS/RHEL
grep CRON /var/log/cron | tail -20
```

## Rotating Logs (Optional)

To prevent the log file from getting too large, create a logrotate config:

```bash
nano /etc/logrotate.d/fire-safety
```

Paste:

```
/var/log/fire-safety-cron.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

## Security Notes

- The `CRON_SECRET` acts as authentication to prevent unauthorized access
- Keep this secret secure and never commit it to Git
- The secret is already in your `.env.local` file which is gitignored
- If you suspect the secret is compromised, generate a new one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Then update both your production environment and the cron script.

## Quick Reference Commands

```bash
# View logs
tail -f /var/log/fire-safety-cron.log

# Test script manually
/root/fire-safety-cron.sh

# Edit cron schedule
crontab -e

# List current cron jobs
crontab -l

# Disable cron job (add # at start of line)
crontab -e

# Remove all cron jobs
crontab -r
```

## Success Indicators

You'll know it's working when:
1. ✅ Log file shows successful API calls every hour
2. ✅ Users receive email notifications for upcoming/overdue tasks
3. ✅ Users receive push notifications (if they have FCM tokens)
4. ✅ No error messages in the logs

## Need Help?

If you run into issues:
1. Check the log file: `/var/log/fire-safety-cron.log`
2. Check your app logs in Coolify
3. Verify the environment variable is set: `echo $CRON_SECRET` (in your app container)
4. Test the endpoint manually with curl (shown in Step 4)
