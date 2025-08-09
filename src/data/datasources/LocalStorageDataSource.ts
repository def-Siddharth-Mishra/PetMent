import AsyncStorage from '@react-native-async-storage/async-storage';
// Use a simple UUID generator for React Native compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import { Doctor } from '../../domain/entities/Doctor';
import { Appointment } from '../../domain/entities/Appointment';
import { STORAGE_KEYS } from '../../shared/storageKeys';
import { createWeeklyRRule, createBiWeeklyRRule } from '../../shared/utils/rruleHelpers';

/**
 * Local storage data source using AsyncStorage
 */
export class LocalStorageDataSource {
  
  // Doctor operations
  async getDoctors(): Promise<Doctor[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOCTORS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting doctors:', error);
      return [];
    }
  }

  async saveDoctors(doctors: Doctor[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    } catch (error) {
      console.error('Error saving doctors:', error);
      throw error;
    }
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  }

  async saveAppointments(appointments: Appointment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
      throw error;
    }
  }

  // Initialization check
  async isInitialized(): Promise<boolean> {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);
      return initialized === 'true';
    } catch (error) {
      console.error('Error checking initialization:', error);
      return false;
    }
  }

  async setInitialized(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, 'true');
    } catch (error) {
      console.error('Error setting initialized:', error);
      throw error;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DOCTORS,
        STORAGE_KEYS.APPOINTMENTS,
        STORAGE_KEYS.APP_INITIALIZED,
        STORAGE_KEYS.USER_PREFERENCES
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Seeds initial data if not already initialized
   */
  async seedInitialData(): Promise<void> {
    try {
      const initialized = await this.isInitialized();
      if (initialized) {
        return;
      }

      // Create sample doctors with different specialties and availability patterns
      const sampleDoctors: Doctor[] = [
        {
          id: generateUUID(),
          name: 'Dr. Sarah Johnson',
          specialties: ['dental', 'general'],
          rating: 4.8,
          location: 'Downtown Clinic',
          weeklyAvailability: [
            {
              id: generateUUID(),
              weekday: 1, // Monday
              startTime: '09:00',
              endTime: '12:00',
              // Simple weekly recurrence
            },
            {
              id: generateUUID(),
              weekday: 3, // Wednesday
              startTime: '14:00',
              endTime: '17:00',
            },
            {
              id: generateUUID(),
              weekday: 5, // Friday
              startTime: '10:00',
              endTime: '15:00',
            }
          ]
        },
        {
          id: generateUUID(),
          name: 'Dr. Michael Chen',
          specialties: ['surgery', 'emergency'],
          rating: 4.9,
          location: 'Emergency Pet Hospital',
          weeklyAvailability: [
            {
              id: generateUUID(),
              weekday: 2, // Tuesday
              startTime: '08:00',
              endTime: '16:00',
              rrule: createWeeklyRRule(2), // Every Tuesday
            },
            {
              id: generateUUID(),
              weekday: 4, // Thursday
              startTime: '08:00',
              endTime: '16:00',
              rrule: createBiWeeklyRRule(4), // Every other Thursday
            }
          ]
        },
        {
          id: generateUUID(),
          name: 'Dr. Emily Rodriguez',
          specialties: ['dermatology', 'general'],
          rating: 4.7,
          location: 'Westside Animal Care',
          weeklyAvailability: [
            {
              id: generateUUID(),
              weekday: 1, // Monday
              startTime: '13:00',
              endTime: '18:00',
            },
            {
              id: generateUUID(),
              weekday: 2, // Tuesday
              startTime: '09:00',
              endTime: '14:00',
            },
            {
              id: generateUUID(),
              weekday: 4, // Thursday
              startTime: '10:00',
              endTime: '16:00',
              rrule: createWeeklyRRule(4), // Every Thursday
            }
          ]
        }
      ];

      // Save sample doctors
      await this.saveDoctors(sampleDoctors);

      // Create some sample appointments for demonstration
      const sampleAppointments: Appointment[] = [
        {
          id: generateUUID(),
          doctorId: sampleDoctors[0].id,
          doctorName: sampleDoctors[0].name,
          ownerName: 'John Smith',
          petName: 'Buddy',
          disease: 'dental cleaning',
          startDateISO: this.getNextMondayAt('09:00').toISOString(),
          endDateISO: this.getNextMondayAt('09:30').toISOString(),
          status: 'scheduled',
          location: sampleDoctors[0].location,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      await this.saveAppointments(sampleAppointments);
      await this.setInitialized();

      console.log('Initial data seeded successfully');
    } catch (error) {
      console.error('Error seeding initial data:', error);
      throw error;
    }
  }

  /**
   * Helper method to get next Monday at a specific time
   */
  private getNextMondayAt(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const nextMonday = new Date();
    
    // Find next Monday
    const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(hours, minutes, 0, 0);
    
    return nextMonday;
  }
}