// Date utilities for UK timezone handling

import { format, formatDistanceToNow, parseISO, isAfter, isBefore, addDays, addHours } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const UK_TIMEZONE = 'Europe/London';

/**
 * Format date in UK timezone
 */
export function formatUKDate(date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, UK_TIMEZONE, formatStr);
}

/**
 * Get current UK time
 */
export function nowUK(): Date {
  return toZonedTime(new Date(), UK_TIMEZONE);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isBefore(dateObj, new Date());
}

/**
 * Calculate escalation times
 */
export function calculateEscalation(dueDate: Date, hoursBeforeDue: number): Date {
  return addHours(dueDate, -hoursBeforeDue);
}

/**
 * Add days to date
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Format date for file names
 */
export function formatForFileName(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd_HHmmss');
}
