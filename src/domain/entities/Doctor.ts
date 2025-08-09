export interface Doctor {
  id: string;
  name: string;
  specialties: string[];
  weeklyAvailability: Availability[];
  rating: number;
  location: string;
}

export interface Availability {
  id: string;
  weekday: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  rrule?: string; // RFC rrule string for recurring patterns
}

export interface TimeSlot {
  startISO: string;
  endISO: string;
  doctorId: string;
}
