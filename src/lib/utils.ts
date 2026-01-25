import { formatInTimeZone } from 'date-fns-tz';
import { de } from 'date-fns/locale';
import { Activity, Signup, TransportSignupAttributes } from '../types';
import { TIMEZONE_CET, DEFAULT_ACTIVITY_DURATION_HOURS } from './constants';

/**
 * Format date in Central European Time for datetime-local input
 */
export function formatCETDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE_CET, 'yyyy-MM-dd\'T\'HH:mm');
}

/**
 * Format date for German date input (dd mm yyyy)
 */
export function formatDateInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE_CET, 'dd MM yyyy', { locale: de });
}

/**
 * Parse German date input (dd mm yyyy, dd.mm.yyyy, or dd/mm/yyyy) to Date object in CET
 */
export function parseDateInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Accept spaces, dots, or slashes as separators
  const parts = dateStr.trim().split(/[\s.\/]+/);
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
  
  // Create date string in ISO format and parse it
  // We'll create it in local time and let formatCETDate handle the conversion
  const dateStrISO = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const date = new Date(dateStrISO + 'T12:00:00');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date for display in German format (dd mm yyyy HH:mm Uhr)
 */
export function formatDisplayDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE_CET, 'dd MM yyyy HH:mm', { locale: de }) + ' Uhr';
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

/**
 * Get transport attributes from a signup
 */
export function getTransportAttributes(signup: Signup): TransportSignupAttributes | null {
  if (signup.attributes && typeof signup.attributes === 'object') {
    const attrs = signup.attributes as TransportSignupAttributes;
    if (attrs.role === 'Fighter' || attrs.role === 'Transporter') {
      return attrs;
    }
  }
  return null;
}

/**
 * Filter signups by transport role
 */
export function getFighters(signups: Signup[]): Signup[] {
  return signups.filter(s => {
    const attrs = getTransportAttributes(s);
    return attrs?.role === 'Fighter';
  });
}

/**
 * Filter signups by transport role
 */
export function getTransporters(signups: Signup[]): Signup[] {
  return signups.filter(s => {
    const attrs = getTransportAttributes(s);
    return attrs?.role === 'Transporter';
  });
}
