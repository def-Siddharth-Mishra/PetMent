import { Appointment } from '../../domain/entities/Appointment';
// Use a simple UUID generator for React Native compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Converts a Date to iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICal(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Parses iCal date format to Date object
 */
function parseICalDate(icalDate: string): Date {
  // Handle both YYYYMMDDTHHMMSSZ and YYYYMMDDTHHMMSS formats
  const cleanDate = icalDate.replace(/[TZ]/g, '');
  const year = parseInt(cleanDate.substring(0, 4));
  const month = parseInt(cleanDate.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(cleanDate.substring(6, 8));
  const hour = parseInt(cleanDate.substring(8, 10)) || 0;
  const minute = parseInt(cleanDate.substring(10, 12)) || 0;
  const second = parseInt(cleanDate.substring(12, 14)) || 0;
  
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Escapes special characters for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Unescapes iCal text
 */
function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Exports an appointment to iCal format (.ics)
 * @param appointment - The appointment to export
 * @returns iCal string
 */
export function exportAppointmentToIcs(appointment: Appointment): string {
  const startDate = new Date(appointment.startDateISO);
  const endDate = new Date(appointment.endDateISO);
  const now = new Date();
  
  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetSlot//Pet Appointment App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@petslot.app`,
    `DTSTAMP:${formatDateForICal(now)}`,
    `DTSTART:${formatDateForICal(startDate)}`,
    `DTEND:${formatDateForICal(endDate)}`,
    `SUMMARY:${escapeICalText(`Pet Appointment - ${appointment.petName}`)}`,
    `DESCRIPTION:${escapeICalText(createAppointmentDescription(appointment))}`,
    `LOCATION:${escapeICalText(appointment.location || '')}`,
    `STATUS:${appointment.status.toUpperCase()}`,
    `ORGANIZER:CN=${escapeICalText(appointment.doctorName)}`,
    `ATTENDEE:CN=${escapeICalText(appointment.ownerName)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  
  return icalLines.join('\r\n');
}

/**
 * Creates a detailed description for the appointment
 */
function createAppointmentDescription(appointment: Appointment): string {
  const parts = [
    `Pet: ${appointment.petName}`,
    `Owner: ${appointment.ownerName}`,
    `Doctor: ${appointment.doctorName}`
  ];
  
  if (appointment.disease) {
    parts.push(`Condition: ${appointment.disease}`);
  }
  
  if (appointment.notes) {
    parts.push(`Notes: ${appointment.notes}`);
  }
  
  parts.push(`Status: ${appointment.status}`);
  
  return parts.join('\\n');
}

/**
 * Imports an iCal string and converts it to appointment data
 * @param icalString - The iCal string to parse
 * @returns Partial appointment data (without IDs)
 */
export function importIcsToAppointment(icalString: string): Partial<Appointment> {
  const lines = icalString.split(/\r?\n/);
  const appointment: Partial<Appointment> = {};
  
  let inEvent = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      continue;
    }
    
    if (trimmedLine === 'END:VEVENT') {
      inEvent = false;
      break;
    }
    
    if (!inEvent) continue;
    
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;
    
    const property = trimmedLine.substring(0, colonIndex);
    const value = trimmedLine.substring(colonIndex + 1);
    
    switch (property) {
      case 'UID':
        // Extract appointment ID if it's from our app
        if (value.includes('@petslot.app')) {
          appointment.id = value.split('@')[0];
        }
        break;
        
      case 'DTSTART':
        appointment.startDateISO = parseICalDate(value).toISOString();
        break;
        
      case 'DTEND':
        appointment.endDateISO = parseICalDate(value).toISOString();
        break;
        
      case 'SUMMARY':
        const summary = unescapeICalText(value);
        // Try to extract pet name from summary
        const petMatch = summary.match(/Pet Appointment - (.+)/);
        if (petMatch) {
          appointment.petName = petMatch[1];
        }
        break;
        
      case 'DESCRIPTION':
        parseDescription(unescapeICalText(value), appointment);
        break;
        
      case 'LOCATION':
        appointment.location = unescapeICalText(value);
        break;
        
      case 'STATUS':
        const status = value.toLowerCase();
        if (['scheduled', 'confirmed', 'cancelled', 'completed'].includes(status)) {
          appointment.status = status as any;
        }
        break;
        
      case 'ORGANIZER':
        // Extract doctor name from organizer
        const doctorMatch = value.match(/CN=([^;]+)/);
        if (doctorMatch) {
          appointment.doctorName = unescapeICalText(doctorMatch[1]);
        }
        break;
        
      case 'ATTENDEE':
        // Extract owner name from attendee
        const ownerMatch = value.match(/CN=([^;]+)/);
        if (ownerMatch) {
          appointment.ownerName = unescapeICalText(ownerMatch[1]);
        }
        break;
    }
  }
  
  // Generate new ID if not present
  if (!appointment.id) {
    appointment.id = generateUUID();
  }
  
  return appointment;
}

/**
 * Parses the description field to extract appointment details
 */
function parseDescription(description: string, appointment: Partial<Appointment>): void {
  const lines = description.split('\\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    
    switch (key.toLowerCase()) {
      case 'pet':
        appointment.petName = value;
        break;
      case 'owner':
        appointment.ownerName = value;
        break;
      case 'doctor':
        appointment.doctorName = value;
        break;
      case 'condition':
        appointment.disease = value;
        break;
      case 'notes':
        appointment.notes = value;
        break;
    }
  }
}

/**
 * Validates if a string is a valid iCal format
 * @param icalString - String to validate
 * @returns boolean indicating if valid
 */
export function isValidICalString(icalString: string): boolean {
  const requiredLines = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'END:VEVENT', 'END:VCALENDAR'];
  
  return requiredLines.every(line => icalString.includes(line));
}

/**
 * Exports multiple appointments to a single iCal file
 * @param appointments - Array of appointments to export
 * @returns iCal string with multiple events
 */
export function exportMultipleAppointmentsToIcs(appointments: Appointment[]): string {
  const now = new Date();
  
  const icalLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetSlot//Pet Appointment App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  
  // Add each appointment as an event
  for (const appointment of appointments) {
    const startDate = new Date(appointment.startDateISO);
    const endDate = new Date(appointment.endDateISO);
    
    icalLines.push(
      'BEGIN:VEVENT',
      `UID:${appointment.id}@petslot.app`,
      `DTSTAMP:${formatDateForICal(now)}`,
      `DTSTART:${formatDateForICal(startDate)}`,
      `DTEND:${formatDateForICal(endDate)}`,
      `SUMMARY:${escapeICalText(`Pet Appointment - ${appointment.petName}`)}`,
      `DESCRIPTION:${escapeICalText(createAppointmentDescription(appointment))}`,
      `LOCATION:${escapeICalText(appointment.location || '')}`,
      `STATUS:${appointment.status.toUpperCase()}`,
      `ORGANIZER:CN=${escapeICalText(appointment.doctorName)}`,
      `ATTENDEE:CN=${escapeICalText(appointment.ownerName)}`,
      'END:VEVENT'
    );
  }
  
  icalLines.push('END:VCALENDAR');
  
  return icalLines.join('\r\n');
}