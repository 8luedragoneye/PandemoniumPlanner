import { formatInTimeZone } from 'date-fns-tz';
import { Activity, Signup } from '../types';
import { TIMEZONE_CET, DEFAULT_ACTIVITY_DURATION_HOURS } from './constants';

/**
 * Format date in Central European Time for datetime-local input
 */
export function formatCETDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE_CET, 'yyyy-MM-dd\'T\'HH:mm');
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE_CET, 'dd.MM.yyyy HH:mm');
}

/**
 * Check if two activities have overlapping timeframes
 * Assumes activities have a duration (default 2 hours)
 */
export function checkOverlap(
  activity1: Activity,
  activity2: Activity,
  durationHours: number = DEFAULT_ACTIVITY_DURATION_HOURS
): boolean {
  const start1 = new Date(activity1.date).getTime();
  const end1 = start1 + durationHours * 60 * 60 * 1000;
  
  const start2 = new Date(activity2.date).getTime();
  const end2 = start2 + durationHours * 60 * 60 * 1000;

  return (start1 < end2 && start2 < end1);
}

/**
 * Check if activity is in the past
 */
export function isPast(activity: Activity): boolean {
  return new Date(activity.date) < new Date();
}

/**
 * Check if activity is upcoming
 */
export function isUpcoming(activity: Activity): boolean {
  return new Date(activity.date) >= new Date();
}

/**
 * Get current signup count for a role
 */
export function getSignupCount(roleId: string, signups: Signup[]): number {
  return signups.filter(s => s.role === roleId).length;
}

/**
 * Check if role is full
 */
export function isRoleFull(roleId: string, slots: number, signups: Signup[]): boolean {
  return getSignupCount(roleId, signups) >= slots;
}
