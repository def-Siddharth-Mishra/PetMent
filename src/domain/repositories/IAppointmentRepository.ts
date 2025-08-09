import { Appointment } from '../entities/Appointment';
import { Doctor } from '../entities/Doctor';

/**
 * Repository interface for appointment and doctor data operations
 */
export interface IAppointmentRepository {
  // Doctor operations
  getDoctors(): Promise<Doctor[]>;
  getDoctorById(id: string): Promise<Doctor | null>;
  createDoctor(doctor: Doctor): Promise<void>;
  updateDoctor(doctor: Doctor): Promise<void>;
  getDoctorsBySpecialty(specialty: string): Promise<Doctor[]>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | null>;
  createAppointment(appointment: Appointment): Promise<void>;
  updateAppointment(appointment: Appointment): Promise<void>;
  deleteAppointment(id: string): Promise<void>;
  
  // Query operations
  getAppointmentsByDoctorId(doctorId: string): Promise<Appointment[]>;
  getAppointmentsByOwner(ownerName: string): Promise<Appointment[]>;
  getAppointmentsByDoctorAndDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]>;
  getAppointmentsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Appointment[]>;

  // Utility operations
  seedInitialData(): Promise<void>;
  clearAllData(): Promise<void>;
}