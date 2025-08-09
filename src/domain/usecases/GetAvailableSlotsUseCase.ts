import { Appointment } from '../entities/Appointment';
import { Doctor, TimeSlot } from '../entities/Doctor';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository';
import { 
  expandAvailabilityToDates, 
  generateSlotsForBlock, 
  combineDateAndTime 
} from '../../shared/utils/rruleHelpers';

/**
 * Use case for getting available appointment slots for a doctor
 * Handles recurring availability patterns and existing bookings
 */
export class GetAvailableSlotsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Gets available appointment slots for a doctor within a date range
   * @param doctorId - The doctor's ID
   * @param fromDate - Start date (ISO string)
   * @param toDate - End date (ISO string)
   * @param slotDurationMinutes - Duration of each slot in minutes (default: 30)
   * @returns Promise<TimeSlot[]> - Array of available time slots
   */
  async execute(
    doctorId: string,
    fromDate: string,
    toDate: string,
    slotDurationMinutes: number = 30
  ): Promise<TimeSlot[]> {
    try {
      // Get doctor information
      const doctor = await this.appointmentRepository.getDoctorById(doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${doctorId} not found`);
      }

      // Get existing appointments for the doctor in the date range
      const existingAppointments = await this.appointmentRepository.getAppointmentsByDoctorAndDateRange(
        doctorId,
        fromDate,
        toDate
      );

      // Convert date strings to Date objects
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      // Generate all possible slots from doctor's availability
      const allPossibleSlots = this.generateAllPossibleSlots(
        doctor,
        startDate,
        endDate,
        slotDurationMinutes
      );

      // Filter out booked slots
      const availableSlots = this.filterBookedSlots(allPossibleSlots, existingAppointments);

      // Sort slots by start time
      return availableSlots.sort((a, b) => 
        new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
      );

    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Generates all possible slots from doctor's weekly availability
   * @param doctor - The doctor
   * @param startDate - Start date
   * @param endDate - End date
   * @param slotDurationMinutes - Slot duration in minutes
   * @returns Array of all possible time slots
   */
  private generateAllPossibleSlots(
    doctor: Doctor,
    startDate: Date,
    endDate: Date,
    slotDurationMinutes: number
  ): TimeSlot[] {
    const allSlots: TimeSlot[] = [];

    // Process each availability pattern
    for (const availability of doctor.weeklyAvailability) {
      // Expand availability to concrete dates using rrule
      const availableDates = expandAvailabilityToDates(availability, startDate, endDate);

      // For each available date, generate time slots
      for (const date of availableDates) {
        const startDateTime = combineDateAndTime(date, availability.startTime);
        const endDateTime = combineDateAndTime(date, availability.endTime);

        // Skip if the availability is in the past
        if (endDateTime < new Date()) {
          continue;
        }

        // Generate slots for this time block
        const timeSlots = generateSlotsForBlock(startDateTime, endDateTime, slotDurationMinutes);

        // Convert to TimeSlot format
        for (const slot of timeSlots) {
          // Skip slots that are in the past
          if (slot.start < new Date()) {
            continue;
          }

          allSlots.push({
            startISO: slot.start.toISOString(),
            endISO: slot.end.toISOString(),
            doctorId: doctor.id
          });
        }
      }
    }

    return allSlots;
  }

  /**
   * Filters out slots that are already booked
   * @param allSlots - All possible slots
   * @param existingAppointments - Existing appointments
   * @returns Available slots after filtering
   */
  private filterBookedSlots(allSlots: TimeSlot[], existingAppointments: Appointment[]): TimeSlot[] {
    return allSlots.filter(slot => {
      const slotStart = new Date(slot.startISO);
      const slotEnd = new Date(slot.endISO);

      // Check if this slot conflicts with any existing appointment
      const hasConflict = existingAppointments.some(appointment => {
        // Skip cancelled appointments
        if (appointment.status === 'cancelled') {
          return false;
        }

        const appointmentStart = new Date(appointment.startDateISO);
        const appointmentEnd = new Date(appointment.endDateISO);

        // Check for time overlap
        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });

      return !hasConflict;
    });
  }

  /**
   * Gets the next N available slots for a doctor
   * @param doctorId - The doctor's ID
   * @param count - Number of slots to return
   * @param slotDurationMinutes - Duration of each slot in minutes
   * @returns Promise<TimeSlot[]> - Next available slots
   */
  async getNextAvailableSlots(
    doctorId: string,
    count: number = 3,
    slotDurationMinutes: number = 30
  ): Promise<TimeSlot[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30); // Look ahead 30 days

    const allSlots = await this.execute(
      doctorId,
      now.toISOString(),
      futureDate.toISOString(),
      slotDurationMinutes
    );

    return allSlots.slice(0, count);
  }
}