// Use a simple UUID generator for React Native compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import { Appointment, AppointmentCreate } from '../entities/Appointment';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository';
import { GetAvailableSlotsUseCase } from './GetAvailableSlotsUseCase';

export interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  nextAvailableSlots?: Array<{ startISO: string; endISO: string }>;
}

/**
 * Use case for booking appointments with conflict detection
 */
export class BookAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private getAvailableSlotsUseCase: GetAvailableSlotsUseCase
  ) {}

  /**
   * Books an appointment after validating availability
   * @param appointmentData - The appointment data to create
   * @returns Promise<BookingResult> - Result of the booking attempt
   */
  async execute(appointmentData: AppointmentCreate): Promise<BookingResult> {
    try {
      // Validate input
      if (!appointmentData.doctorId || !appointmentData.startDateISO || !appointmentData.endDateISO) {
        return {
          success: false,
          error: 'Missing required appointment data'
        };
      }

      // Validate that end time is after start time
      const startTime = new Date(appointmentData.startDateISO);
      const endTime = new Date(appointmentData.endDateISO);
      
      if (endTime <= startTime) {
        return {
          success: false,
          error: 'End time must be after start time'
        };
      }

      // Validate that appointment is not in the past
      if (startTime < new Date()) {
        return {
          success: false,
          error: 'Cannot book appointments in the past'
        };
      }

      // Check if the requested slot is still available
      const isSlotAvailable = await this.validateSlotAvailability(
        appointmentData.doctorId,
        appointmentData.startDateISO,
        appointmentData.endDateISO
      );

      if (!isSlotAvailable) {
        // Get next 3 available slots as alternatives
        const nextSlots = await this.getAvailableSlotsUseCase.getNextAvailableSlots(
          appointmentData.doctorId,
          3
        );

        return {
          success: false,
          error: 'Slot already booked',
          nextAvailableSlots: nextSlots.map(slot => ({
            startISO: slot.startISO,
            endISO: slot.endISO
          }))
        };
      }

      // Create the appointment
      const appointment: Appointment = {
        id: generateUUID(),
        ...appointmentData,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Persist the appointment
      await this.appointmentRepository.createAppointment(appointment);

      return {
        success: true,
        appointment
      };

    } catch (error) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validates if a specific time slot is still available
   * @param doctorId - The doctor's ID
   * @param startISO - Start time in ISO format
   * @param endISO - End time in ISO format
   * @returns Promise<boolean> - True if slot is available
   */
  private async validateSlotAvailability(
    doctorId: string,
    startISO: string,
    endISO: string
  ): Promise<boolean> {
    try {
      // Get available slots for the specific date
      const requestedDate = new Date(startISO);
      const dayStart = new Date(requestedDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(requestedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const availableSlots = await this.getAvailableSlotsUseCase.execute(
        doctorId,
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      // Check if the exact requested slot exists in available slots
      return availableSlots.some(slot => 
        slot.startISO === startISO && slot.endISO === endISO
      );

    } catch (error) {
      console.error('Error validating slot availability:', error);
      return false;
    }
  }

  /**
   * Books multiple appointments (batch booking)
   * @param appointmentsData - Array of appointment data
   * @returns Promise<BookingResult[]> - Results for each booking attempt
   */
  async executeMultiple(appointmentsData: AppointmentCreate[]): Promise<BookingResult[]> {
    const results: BookingResult[] = [];

    for (const appointmentData of appointmentsData) {
      const result = await this.execute(appointmentData);
      results.push(result);
    }

    return results;
  }

  /**
   * Reschedules an existing appointment
   * @param appointmentId - The appointment ID to reschedule
   * @param newStartISO - New start time
   * @param newEndISO - New end time
   * @returns Promise<BookingResult> - Result of the reschedule attempt
   */
  async reschedule(
    appointmentId: string,
    newStartISO: string,
    newEndISO: string
  ): Promise<BookingResult> {
    try {
      // Get the existing appointment
      const existingAppointment = await this.appointmentRepository.getAppointmentById(appointmentId);
      if (!existingAppointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }

      // Check if new slot is available
      const isSlotAvailable = await this.validateSlotAvailability(
        existingAppointment.doctorId,
        newStartISO,
        newEndISO
      );

      if (!isSlotAvailable) {
        const nextSlots = await this.getAvailableSlotsUseCase.getNextAvailableSlots(
          existingAppointment.doctorId,
          3
        );

        return {
          success: false,
          error: 'New slot already booked',
          nextAvailableSlots: nextSlots.map(slot => ({
            startISO: slot.startISO,
            endISO: slot.endISO
          }))
        };
      }

      // Update the appointment
      const updatedAppointment: Appointment = {
        ...existingAppointment,
        startDateISO: newStartISO,
        endDateISO: newEndISO,
        updatedAt: new Date().toISOString()
      };

      await this.appointmentRepository.updateAppointment(updatedAppointment);

      return {
        success: true,
        appointment: updatedAppointment
      };

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}