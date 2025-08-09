import { RRule } from 'rrule';
import { Availability } from '../../domain/entities/Doctor';

/**
 * Expands availability with rrule patterns into concrete dates
 * @param availability - The availability configuration
 * @param fromDate - Start date for expansion
 * @param toDate - End date for expansion
 * @returns Array of dates when the availability applies
 */
export function expandAvailabilityToDates(
  availability: Availability,
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = [];
  
  // If no rrule, generate weekly occurrences for the specified weekday
  if (!availability.rrule) {
    const current = new Date(fromDate);
    
    // Find the first occurrence of the weekday
    while (current.getDay() !== availability.weekday && current <= toDate) {
      current.setDate(current.getDate() + 1);
    }
    
    // Generate weekly occurrences
    while (current <= toDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return dates;
  }
  
  try {
    // Parse the rrule and generate occurrences
    const rule = RRule.fromString(availability.rrule);
    const occurrences = rule.between(fromDate, toDate, true);
    
    // Return all occurrences (rrule already handles weekday filtering)
    return occurrences;
  } catch (error) {
    console.error('Error parsing rrule:', error);
    // Fallback to weekly pattern
    return expandAvailabilityToDates(
      { ...availability, rrule: undefined },
      fromDate,
      toDate
    );
  }
}

/**
 * Generates time slots for a given date and time block
 * @param startDatetime - Start datetime
 * @param endDatetime - End datetime
 * @param slotDurationMinutes - Duration of each slot in minutes
 * @returns Array of time slots with start and end times
 */
export function generateSlotsForBlock(
  startDatetime: Date,
  endDatetime: Date,
  slotDurationMinutes: number = 30
): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = [];
  const current = new Date(startDatetime);
  
  while (current < endDatetime) {
    const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);
    
    // Only add slot if it doesn't exceed the end time
    if (slotEnd <= endDatetime) {
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd)
      });
    }
    
    current.setTime(current.getTime() + slotDurationMinutes * 60 * 1000);
  }
  
  return slots;
}

/**
 * Combines date and time string to create a Date object
 * @param date - The date
 * @param timeString - Time in HH:MM format
 * @returns Combined Date object
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

/**
 * Creates an rrule string for weekly recurrence
 * @param weekday - Day of week (0-6)
 * @param interval - Interval between occurrences (default: 1 for weekly)
 * @returns RRule string
 */
export function createWeeklyRRule(weekday: number, interval: number = 1): string {
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${weekdays[weekday]}`;
}

/**
 * Creates an rrule string for bi-weekly recurrence
 * @param weekday - Day of week (0-6)
 * @returns RRule string
 */
export function createBiWeeklyRRule(weekday: number): string {
  return createWeeklyRRule(weekday, 2);
}