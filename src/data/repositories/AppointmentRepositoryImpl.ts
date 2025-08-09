import { Appointment } from '../../domain/entities/Appointment';
import { Doctor } from '../../domain/entities/Doctor';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { LocalStorageDataSource } from '../datasources/LocalStorageDataSource';

/**
 * Implementation of the appointment repository using local storage
 */
export class AppointmentRepositoryImpl implements IAppointmentRepository {
  constructor(private dataSource: LocalStorageDataSource) {}

  // Doctor operations
  async getDoctors(): Promise<Doctor[]> {
    return await this.dataSource.getDoctors();
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    const doctors = await this.dataSource.getDoctors();
    return doctors.find(doctor => doctor.id === id) || null;
  }

  async createDoctor(doctor: Doctor): Promise<void> {
    const doctors = await this.dataSource.getDoctors();
    doctors.push(doctor);
    await this.dataSource.saveDoctors(doctors);
  }

  async updateDoctor(doctor: Doctor): Promise<void> {
    const doctors = await this.dataSource.getDoctors();
    const index = doctors.findIndex(d => d.id === doctor.id);
    
    if (index === -1) {
      throw new Error(`Doctor with ID ${doctor.id} not found`);
    }
    
    doctors[index] = doctor;
    await this.dataSource.saveDoctors(doctors);
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    const doctors = await this.dataSource.getDoctors();
    return doctors.filter(doctor => 
      doctor.specialties.some(s => 
        s.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await this.dataSource.getAppointments();
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const appointments = await this.dataSource.getAppointments();
    return appointments.find(appointment => appointment.id === id) || null;
  }

  async createAppointment(appointment: Appointment): Promise<void> {
    const appointments = await this.dataSource.getAppointments();
    appointments.push(appointment);
    await this.dataSource.saveAppointments(appointments);
  }

  async updateAppointment(appointment: Appointment): Promise<void> {
    const appointments = await this.dataSource.getAppointments();
    const index = appointments.findIndex(a => a.id === appointment.id);
    
    if (index === -1) {
      throw new Error(`Appointment with ID ${appointment.id} not found`);
    }
    
    appointments[index] = appointment;
    await this.dataSource.saveAppointments(appointments);
  }

  async deleteAppointment(id: string): Promise<void> {
    const appointments = await this.dataSource.getAppointments();
    const filteredAppointments = appointments.filter(a => a.id !== id);
    
    if (filteredAppointments.length === appointments.length) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    
    await this.dataSource.saveAppointments(filteredAppointments);
  }

  // Query operations
  async getAppointmentsByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await this.dataSource.getAppointments();
    return appointments.filter(appointment => appointment.doctorId === doctorId);
  }

  async getAppointmentsByOwner(ownerName: string): Promise<Appointment[]> {
    const appointments = await this.dataSource.getAppointments();
    return appointments.filter(appointment => 
      appointment.ownerName.toLowerCase().includes(ownerName.toLowerCase())
    );
  }

  async getAppointmentsByDoctorAndDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const appointments = await this.dataSource.getAppointments();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return appointments.filter(appointment => {
      if (appointment.doctorId !== doctorId) {
        return false;
      }
      
      const appointmentStart = new Date(appointment.startDateISO);
      const appointmentEnd = new Date(appointment.endDateISO);
      
      // Check if appointment overlaps with the date range
      return (
        (appointmentStart >= start && appointmentStart <= end) ||
        (appointmentEnd >= start && appointmentEnd <= end) ||
        (appointmentStart <= start && appointmentEnd >= end)
      );
    });
  }

  async getAppointmentsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const appointments = await this.dataSource.getAppointments();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return appointments.filter(appointment => {
      const appointmentStart = new Date(appointment.startDateISO);
      const appointmentEnd = new Date(appointment.endDateISO);
      
      // Check if appointment overlaps with the date range
      return (
        (appointmentStart >= start && appointmentStart <= end) ||
        (appointmentEnd >= start && appointmentEnd <= end) ||
        (appointmentStart <= start && appointmentEnd >= end)
      );
    });
  }

  // Utility operations
  async seedInitialData(): Promise<void> {
    await this.dataSource.seedInitialData();
  }

  async clearAllData(): Promise<void> {
    await this.dataSource.clearAllData();
  }
}