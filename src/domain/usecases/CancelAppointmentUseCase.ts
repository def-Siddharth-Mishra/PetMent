import { Appointment } from '../entities/Appointment';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository';

export interface CancelResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
}

/**
 * Use case for cancelling appointments
 */
export class CancelAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Cancels an appointment by ID
   * @param appointmentId - The appointment ID to cancel
   * @param reason - Optional cancellation reason
   * @returns Promise<CancelResult> - Result of the cancellation
   */
  async execute(appointmentId: string, reason?: string): Promise<CancelResult> {
    try {
      // Get the existing appointment
      const existingAppointment = await this.appointmentRepository.getAppointmentById(appointmentId);
      
      if (!existingAppointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }

      // Check if appointment is already cancelled
      if (existingAppointment.status === 'cancelled') {
        return {
          success: false,
          error: 'Appointment is already cancelled'
        };
      }

      // Check if appointment is in the past
      const appointmentStart = new Date(existingAppointment.startDateISO);
      if (appointmentStart < new Date()) {
        return {
          success: false,
          error: 'Cannot cancel past appointments'
        };
      }

      // Update appointment status to cancelled
      const cancelledAppointment: Appointment = {
        ...existingAppointment,
        status: 'cancelled',
        notes: reason ? `${existingAppointment.notes || ''}\nCancellation reason: ${reason}`.trim() : existingAppointment.notes,
        updatedAt: new Date().toISOString()
      };

      await this.appointmentRepository.updateAppointment(cancelledAppointment);

      return {
        success: true,
        appointment: cancelledAppointment
      };

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancels multiple appointments
   * @param appointmentIds - Array of appointment IDs to cancel
   * @param reason - Optional cancellation reason
   * @returns Promise<CancelResult[]> - Results for each cancellation
   */
  async executeMultiple(appointmentIds: string[], reason?: string): Promise<CancelResult[]> {
    const results: CancelResult[] = [];

    for (const appointmentId of appointmentIds) {
      const result = await this.execute(appointmentId, reason);
      results.push(result);
    }

    return results;
  }

  /**
   * Cancels all appointments for a doctor on a specific date
   * @param doctorId - The doctor's ID
   * @param date - The date (ISO string)
   * @param reason - Cancellation reason
   * @returns Promise<CancelResult[]> - Results for each cancellation
   */
  async cancelDoctorAppointmentsForDate(
    doctorId: string,
    date: string,
    reason: string
  ): Promise<CancelResult[]> {
    try {
      // Get all appointments for the doctor on the specified date
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const appointments = await this.appointmentRepository.getAppointmentsByDoctorAndDateRange(
        doctorId,
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      // Filter out already cancelled appointments
      const activateAppointments = appointments.filter(apt => apt.status !== 'cancelled');

      // Cancel each appointment
      const appointmentIds = activateAppointments.map(apt => apt.id);
      return await this.executeMultiple(appointmentIds, reason);

    } catch (error) {
      console.error('Error cancelling doctor appointments for date:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }];
    }
  }
}