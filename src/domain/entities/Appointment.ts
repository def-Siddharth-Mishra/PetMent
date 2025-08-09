export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  ownerName: string;
  petName: string;
  disease?: string;
  startDateISO: string;
  endDateISO: string;
  status: AppointmentStatus;
  location?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentCreate {
  doctorId: string;
  doctorName: string;
  ownerName: string;
  petName: string;
  disease?: string;
  startDateISO: string;
  endDateISO: string;
  location?: string;
  notes?: string;
}
