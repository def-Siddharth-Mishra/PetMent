/**
 * Date utility functions for the PetSlot app
 */

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Formats a time to a readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  return dateObj.toLocaleTimeString('en-US', defaultOptions);
}

/**
 * Formats a date and time together
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} at ${formatTime(dateObj)}`;
}

/**
 * Gets the start of day for a given date
 * @param date - Input date
 * @returns Date at start of day (00:00:00)
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Gets the end of day for a given date
 * @param date - Input date
 * @returns Date at end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Checks if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Gets the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates
 */
export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Adds days to a date
 * @param date - Input date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Gets the next occurrence of a specific weekday
 * @param weekday - Day of week (0-6, Sunday-Saturday)
 * @param fromDate - Starting date (default: today)
 * @returns Date of next occurrence
 */
export function getNextWeekday(weekday: number, fromDate?: Date): Date {
  const from = fromDate || new Date();
  const daysUntilWeekday = (weekday - from.getDay() + 7) % 7;
  const nextDate = new Date(from);
  nextDate.setDate(from.getDate() + (daysUntilWeekday || 7));
  return nextDate;
}

/**
 * Gets the weekday name
 * @param weekday - Day of week (0-6)
 * @returns Weekday name
 */
export function getWeekdayName(weekday: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[weekday] || 'Unknown';
}

/**
 * Gets the short weekday name
 * @param weekday - Day of week (0-6)
 * @returns Short weekday name
 */
export function getShortWeekdayName(weekday: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[weekday] || 'Unknown';
}

/**
 * Checks if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Checks if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Checks if a date is tomorrow
 * @param date - Date to check
 * @returns True if date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
}

/**
 * Gets a relative date string (Today, Tomorrow, or formatted date)
 * @param date - Date to format
 * @returns Relative date string
 */
export function getRelativeDateString(date: Date | string): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  return formatDate(date);
}

/**
 * Combines date and time strings into an ISO string
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format
 * @returns ISO string
 */
export function combineDateTime(dateString: string, timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(dateString);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/**
 * Gets the duration between two dates in minutes
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Duration in minutes
 */
export function getDurationInMinutes(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Formats duration in minutes to a readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}