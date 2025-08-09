import { create } from 'zustand';
import { Doctor } from '../../domain/entities/Doctor';
import { Appointment } from '../../domain/entities/Appointment';
import { LocalStorageDataSource } from '../../data/datasources/LocalStorageDataSource';
import { AppointmentRepositoryImpl } from '../../data/repositories/AppointmentRepositoryImpl';
import { GetAvailableSlotsUseCase } from '../../domain/usecases/GetAvailableSlotsUseCase';
import { BookAppointmentUseCase } from '../../domain/usecases/BookAppointmentUseCase';
import { CancelAppointmentUseCase } from '../../domain/usecases/CancelAppointmentUseCase';

interface AppState {
  // Data
  doctors: Doctor[];
  appointments: Appointment[];
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Use cases
  getAvailableSlotsUseCase: GetAvailableSlotsUseCase | null;
  bookAppointmentUseCase: BookAppointmentUseCase | null;
  cancelAppointmentUseCase: CancelAppointmentUseCase | null;
  
  // Repository
  repository: AppointmentRepositoryImpl | null;
  
  // Actions
  initialize: () => Promise<void>;
  loadDoctors: () => Promise<void>;
  loadAppointments: () => Promise<void>;
  refreshData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

// Create the data source and repository instances
const dataSource = new LocalStorageDataSource();
const repository = new AppointmentRepositoryImpl(dataSource);

// Create use case instances
const getAvailableSlotsUseCase = new GetAvailableSlotsUseCase(repository);
const bookAppointmentUseCase = new BookAppointmentUseCase(repository, getAvailableSlotsUseCase);
const cancelAppointmentUseCase = new CancelAppointmentUseCase(repository);

export const useAppState = create<AppState>((set, get) => ({
  // Initial state
  doctors: [],
  appointments: [],
  isLoading: false,
  isInitialized: false,
  
  // Use cases
  getAvailableSlotsUseCase,
  bookAppointmentUseCase,
  cancelAppointmentUseCase,
  repository,
  
  // Actions
  initialize: async () => {
    const state = get();
    if (state.isInitialized) return;
    
    set({ isLoading: true });
    
    try {
      // Seed initial data if needed
      await repository.seedInitialData();
      
      // Load initial data
      await state.loadDoctors();
      await state.loadAppointments();
      
      set({ isInitialized: true });
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadDoctors: async () => {
    try {
      const doctors = await repository.getDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  },
  
  loadAppointments: async () => {
    try {
      const appointments = await repository.getAppointments();
      set({ appointments });
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  },
  
  refreshData: async () => {
    const state = get();
    set({ isLoading: true });
    
    try {
      await Promise.all([
        state.loadDoctors(),
        state.loadAppointments()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));