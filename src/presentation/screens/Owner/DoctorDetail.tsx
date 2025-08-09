import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Doctor, TimeSlot } from '../../../domain/entities/Doctor';
import CalendarView from '../../components/CalendarView';
import { useAppState } from '../../hooks/useAppState';
import { formatTime, getWeekdayName } from '../../../shared/utils/date';

interface RouteParams {
  doctor: Doctor;
}

export default function DoctorDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor } = route.params as RouteParams;
  const { getAvailableSlotsUseCase } = useAppState();
  
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = () => {
    if (!selectedSlot) {
      Alert.alert('No Slot Selected', 'Please select a time slot to book an appointment.');
      return;
    }

    navigation.navigate('BookAppointment' as never, { 
      doctor, 
      selectedSlot 
    } as never);
  };

  const getAvailableSlots = async (doctorId: string, fromDate: string, toDate: string) => {
    if (!getAvailableSlotsUseCase) {
      throw new Error('GetAvailableSlotsUseCase not available');
    }
    
    return await getAvailableSlotsUseCase.execute(doctorId, fromDate, toDate);
  };

  const renderDoctorInfo = () => {
    return (
      <View style={styles.doctorInfo}>
        <View style={styles.doctorHeader}>
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.location}>{doctor.location}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.stars}>
                {'★'.repeat(Math.floor(doctor.rating))}{'☆'.repeat(5 - Math.floor(doctor.rating))}
              </Text>
              <Text style={styles.ratingText}>{doctor.rating.toFixed(1)} rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.specialtiesSection}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {doctor.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>Regular Availability</Text>
          {doctor.weeklyAvailability.length === 0 ? (
            <Text style={styles.noAvailability}>No regular availability set</Text>
          ) : (
            doctor.weeklyAvailability.map((availability, index) => (
              <View key={index} style={styles.availabilityItem}>
                <Text style={styles.availabilityDay}>
                  {getWeekdayName(availability.weekday)}
                </Text>
                <Text style={styles.availabilityTime}>
                  {availability.startTime} - {availability.endTime}
                </Text>
                {availability.rrule && (
                  <Text style={styles.rruleNote}>Recurring pattern</Text>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderBookingSection = () => {
    return (
      <View style={styles.bookingSection}>
        <Text style={styles.sectionTitle}>Select Appointment Time</Text>
        <CalendarView
          doctorId={doctor.id}
          onSlotSelect={handleSlotSelect}
          selectedSlot={selectedSlot || undefined}
          getAvailableSlots={getAvailableSlots}
        />
        
        {selectedSlot && (
          <View style={styles.selectedSlotInfo}>
            <Text style={styles.selectedSlotTitle}>Selected Time:</Text>
            <Text style={styles.selectedSlotTime}>
              {formatTime(selectedSlot.startISO)} - {formatTime(selectedSlot.endISO)}
            </Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={handleBookAppointment}
            >
              <Text style={styles.bookButtonText}>Book This Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderDoctorInfo()}
      </ScrollView>
      
      <View style={styles.calendarContainer}>
        {renderBookingSection()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 0,
    maxHeight: 300,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  doctorInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 18,
    color: '#FF9500',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  specialtiesSection: {
    marginBottom: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#E5F4FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  availabilitySection: {
    marginBottom: 20,
  },
  noAvailability: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  availabilityDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 100,
  },
  availabilityTime: {
    fontSize: 16,
    color: '#34C759',
    flex: 1,
  },
  rruleNote: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  bookingSection: {
    flex: 1,
    padding: 16,
  },
  selectedSlotInfo: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  selectedSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  selectedSlotTime: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});