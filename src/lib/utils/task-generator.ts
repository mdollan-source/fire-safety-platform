/**
 * Task Generation Utility
 * Generates check tasks from schedules based on RRULE recurrence patterns
 */

import { CheckSchedule, CheckTask, CheckTemplate } from '@/types';
import { addDays, addWeeks, addMonths, addYears, startOfDay, isAfter, isBefore } from 'date-fns';

/**
 * Calculate the next due date from a schedule
 */
export function calculateNextDueDate(
  schedule: CheckSchedule,
  fromDate: Date = new Date()
): Date | null {
  const scheduleAny = schedule as any;

  if (!scheduleAny.active) {
    return null;
  }

  const start = scheduleAny.startDate instanceof Date
    ? scheduleAny.startDate
    : scheduleAny.startDate.toDate();

  const from = startOfDay(fromDate);

  // If start date is in the future, that's the next due date
  if (isAfter(start, from)) {
    return start;
  }

  // Calculate next occurrence based on frequency
  let nextDate = start;

  switch (scheduleAny.frequency) {
    case 'daily':
      while (isBefore(nextDate, from) || nextDate.getTime() === from.getTime()) {
        nextDate = addDays(nextDate, 1);
      }
      break;

    case 'weekly':
      while (isBefore(nextDate, from) || nextDate.getTime() === from.getTime()) {
        nextDate = addWeeks(nextDate, 1);
      }
      break;

    case 'monthly':
      while (isBefore(nextDate, from) || nextDate.getTime() === from.getTime()) {
        nextDate = addMonths(nextDate, 1);
      }
      break;

    case 'quarterly':
      while (isBefore(nextDate, from) || nextDate.getTime() === from.getTime()) {
        nextDate = addMonths(nextDate, 3);
      }
      break;

    case 'annual':
      while (isBefore(nextDate, from) || nextDate.getTime() === from.getTime()) {
        nextDate = addYears(nextDate, 1);
      }
      break;

    default:
      return null;
  }

  return nextDate;
}

/**
 * Generate a task from a schedule
 */
export function generateTaskFromSchedule(
  schedule: CheckSchedule,
  dueDate: Date,
  template?: Omit<CheckTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'> | CheckTemplate,
  taskIndexInCycle?: number
): Omit<CheckTask, 'id' | 'createdAt' | 'updatedAt'> {
  const scheduleAny = schedule as any;

  // Determine assetId based on strategy
  let assetId = scheduleAny.assetId; // Legacy single asset support

  if (template && scheduleAny.assetIds && scheduleAny.assetIds.length > 0) {
    if (template.strategy === 'rotate') {
      // For rotation strategy: pick one asset based on rotation index
      const rotationIndex = scheduleAny.rotationIndex || 0;
      const offset = taskIndexInCycle || 0;
      const assetIndex = (rotationIndex + offset) % scheduleAny.assetIds.length;
      assetId = scheduleAny.assetIds[assetIndex];
    } else if (template.strategy === 'all') {
      // For 'all' strategy: set assetId to undefined (task covers all assets)
      assetId = undefined;
    }
  }

  return {
    orgId: scheduleAny.orgId,
    siteId: scheduleAny.siteId,
    assetId: assetId,
    scheduleId: scheduleAny.id,
    templateId: scheduleAny.templateId,
    dueDate: dueDate,
    status: 'pending',
    assigneeId: null, // Can be assigned later
    priority: calculatePriority(dueDate),
  } as any;
}

/**
 * Calculate task priority based on due date
 */
function calculatePriority(dueDate: Date): 'low' | 'medium' | 'high' | 'urgent' {
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'urgent'; // Overdue
  } else if (diffDays === 0) {
    return 'urgent'; // Due today
  } else if (diffDays <= 1) {
    return 'high'; // Due tomorrow
  } else if (diffDays <= 3) {
    return 'medium'; // Due within 3 days
  } else {
    return 'low'; // Due later
  }
}

/**
 * Check if a task already exists for a schedule and due date
 */
export function taskExistsForDate(
  existingTasks: CheckTask[],
  scheduleId: string,
  dueDate: Date
): boolean {
  const dueDateStr = startOfDay(dueDate).toISOString();

  return existingTasks.some((task) => {
    const taskDueDateStr = startOfDay(
      task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate()
    ).toISOString();

    return task.scheduleId === scheduleId && taskDueDateStr === dueDateStr;
  });
}

/**
 * Generate tasks for a schedule for the next N days
 */
export function generateTasksForSchedule(
  schedule: CheckSchedule,
  existingTasks: CheckTask[],
  daysAhead: number = 30,
  template?: Omit<CheckTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'> | CheckTemplate
): Array<Omit<CheckTask, 'id' | 'createdAt' | 'updatedAt'>> {
  const tasks: Array<Omit<CheckTask, 'id' | 'createdAt' | 'updatedAt'>> = [];

  if (!(schedule as any).active) {
    return tasks;
  }

  const endDate = addDays(new Date(), daysAhead);
  let currentDueDate = calculateNextDueDate(schedule, new Date());
  let taskIndexInCycle = 0;

  // Generate tasks up to the end date
  while (currentDueDate && isBefore(currentDueDate, endDate)) {
    // Only create task if it doesn't already exist
    if (!taskExistsForDate(existingTasks, schedule.id, currentDueDate)) {
      tasks.push(generateTaskFromSchedule(schedule, currentDueDate, template, taskIndexInCycle));
      taskIndexInCycle++;
    }

    // Calculate next due date
    currentDueDate = calculateNextDueDate(schedule, addDays(currentDueDate, 1));
  }

  return tasks;
}

/**
 * Get the next rotation index for a schedule
 * Call this after creating tasks to update the schedule's rotation
 */
export function getNextRotationIndex(
  schedule: CheckSchedule,
  tasksCreated: number
): number {
  const scheduleAny = schedule as any;
  const currentIndex = scheduleAny.rotationIndex || 0;
  const assetCount = scheduleAny.assetIds?.length || 1;

  return (currentIndex + tasksCreated) % assetCount;
}
