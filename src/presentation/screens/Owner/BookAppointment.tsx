import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Doctor, TimeSlot } from '../../../domain/entities/Doctor';
import { AppointmentCreate } from '../../../domain/entities/Appointment';
import { useAppState } from '../../hooks/useAppState';
import { formatDateTime } from '../../../shared/utils/date';

interface RouteParams {
  doctor: Doctor;
  selectedSlot: TimeSlot;
}

export default function BookAppointment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedSlot } = route.params as RouteParams;
  const { bookAppointmentUseCase, refreshData } = useAppState();
  
  const [ownerName, setOwnerName] = useState('');
  const [petName, setPetName] = useState('');
  const [disease, setDisease] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const handleBookAppointment = async () => {
    // Validate required fields
    if (!ownerName.trim()) {
      Alert.alert('Missing Information', 'Please enter the owner name.');
      return;
    }

    if (!petName.trim()) {
      Alert.alert('Missing Information', 'Please enter the pet name.');
      return;
    }

    if (!bookAppointmentUseCase) {
      Alert.alert('Error', 'Booking service is not available.');
      return;
    }

    setIsBooking(true);

    try {
      const appointmentData: AppointmentCreate = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        ownerName: ownerName.trim(),
        petName: petName.trim(),
        disease: disease.trim() || undefined,
        startDateISO: selectedSlot.startISO,
        endDateISO: selectedSlot.endISO,
        location: doctor.location,
        notes: notes.trim() || undefined,
      };

      const result = await bookAppointmentUseCase.execute(appointmentData);

      if (result.success) {
        // Refresh data to update the UI
        await refreshData();
        
        Alert.alert(
          'Appointment Booked!',
          `Your appointment with ${doctor.name} has been successfully booked for ${formatDateTime(selectedSlot.startISO)}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to the doctor list
                navigation.navigate('DoctorList' as never);
              }
            }
          ]
        );
      } else {
        // Handle booking failure
        if (result.nextAvailableSlots && result.nextAvailableSlots.length > 0) {
          const alternatives = result.nextAvailableSlots
            .map(slot => formatDateTime(slot.startISO))
            .join('\n');
          
          Alert.alert(
            'Slot No Longer Available',
            `${result.error}\n\nNext available slots:\n${alternatives}`,
            [
              { text: 'OK' },
              {
                text: 'Go Back',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } else {
          Alert.alert('Booking Failed', result.error || 'Unknown error occurred');
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderAppointmentSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Appointment Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Doctor:</Text>
          <Text style={styles.summaryValue}>{doctor.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Location:</Text>
          <Text style={styles.summaryValue}>{doctor.location}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date & Time:</Text>
          <Text style={styles.summaryValue}>{formatDateTime(selectedSlot.startISO)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>30 minutes</Text>
        </View>
      </View>
    );
  };

  const renderForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Pet & Owner Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Owner Name *</Text>
          <TextInput
            style={styles.textInput}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Enter owner's full name"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pet Name *</Text>
          <TextInput
            style={styles.textInput}
            value={petName}
            onChangeText={setPetName}
            placeholder="Enter pet's name"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Condition/Reason for Visit</Text>
          <TextInput
            style={styles.textInput}
            value={disease}
            onChangeText={setDisease}
            placeholder="e.g., dental cleaning, checkup, vaccination"
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional information or special requests"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAppointmentSummary()}
        {renderForm()}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
          onPress={handleBookAppointment}
          disabled={isBooking}
        >
          {isBooking ? (
            <View style={styles.bookingIndicator}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Booking...</Text>
            </View>
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isBooking}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
});