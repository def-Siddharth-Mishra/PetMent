export interface Availability {
  id: string;
  weekday: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  rrule?: string; // Optional RFC rrule string for recurring patterns
}

export interface TimeSlot {
  startISO: string;
  endISO: string;
  doctorId: string;
}
