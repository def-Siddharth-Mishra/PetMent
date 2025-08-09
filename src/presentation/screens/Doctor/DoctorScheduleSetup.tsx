import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
// Use a simple UUID generator for React Native compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import { Doctor, Availability } from '../../../domain/entities/Doctor';
import { useAppState } from '../../hooks/useAppState';
import { getWeekdayName, getShortWeekdayName } from '../../../shared/utils/date';
import { createWeeklyRRule, createBiWeeklyRRule } from '../../../shared/utils/rruleHelpers';

interface AvailabilityForm {
  weekday: number;
  startTime: string;
  endTime: string;
  useRRule: boolean;
  rruleType: 'weekly' | 'biweekly';
}

export default function DoctorScheduleSetup() {
  const { doctors, repository, refreshData, isLoading } = useAppState();
  
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availabilityForms, setAvailabilityForms] = useState<AvailabilityForm[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const weekdays = [
    { value: 0, name: 'Sunday', short: 'Sun' },
    { value: 1, name: 'Monday', short: 'Mon' },
    { value: 2, name: 'Tuesday', short: 'Tue' },
    { value: 3, name: 'Wednesday', short: 'Wed' },
    { value: 4, name: 'Thursday', short: 'Thu' },
    { value: 5, name: 'Friday', short: 'Fri' },
    { value: 6, name: 'Saturday', short: 'Sat' },
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors]);

  useEffect(() => {
    if (selectedDoctorId) {
      const doctor = doctors.find(d => d.id === selectedDoctorId);
      setSelectedDoctor(doctor || null);
      
      if (doctor) {
        // Convert existing availability to forms
        const forms = doctor.weeklyAvailability.map(availability => ({
          weekday: availability.weekday,
          startTime: availability.startTime,
          endTime: availability.endTime,
          useRRule: !!availability.rrule,
          rruleType: availability.rrule?.includes('INTERVAL=2') ? 'biweekly' as const : 'weekly' as const
        }));
        
        setAvailabilityForms(forms);
      }
    }
  }, [selectedDoctorId, doctors]);

  const addAvailabilitySlot = () => {
    const newForm: AvailabilityForm = {
      weekday: 1, // Monday
      startTime: '09:00',
      endTime: '17:00',
      useRRule: false,
      rruleType: 'weekly'
    };
    
    setAvailabilityForms([...availabilityForms, newForm]);
  };

  const removeAvailabilitySlot = (index: number) => {
    const updated = availabilityForms.filter((_, i) => i !== index);
    setAvailabilityForms(updated);
  };

  const updateAvailabilityForm = (index: number, updates: Partial<AvailabilityForm>) => {
    const updated = availabilityForms.map((form, i) => 
      i === index ? { ...form, ...updates } : form
    );
    setAvailabilityForms(updated);
  };

  const validateForms = (): boolean => {
    for (let i = 0; i < availabilityForms.length; i++) {
      const form = availabilityForms[i];
      
      // Check if end time is after start time
      if (form.startTime >= form.endTime) {
        Alert.alert('Invalid Time', `Slot ${i + 1}: End time must be after start time.`);
        return false;
      }
      
      // Check for overlapping slots on the same day
      for (let j = i + 1; j < availabilityForms.length; j++) {
        const otherForm = availabilityForms[j];
        if (form.weekday === otherForm.weekday) {
          const startTime1 = form.startTime;
          const endTime1 = form.endTime;
          const startTime2 = otherForm.startTime;
          const endTime2 = otherForm.endTime;
          
          // Check for overlap
          if ((startTime1 < endTime2 && endTime1 > startTime2)) {
            Alert.alert(
              'Overlapping Times', 
              `Slots ${i + 1} and ${j + 1} overlap on ${getWeekdayName(form.weekday)}.`
            );
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const saveSchedule = async () => {
    if (!selectedDoctor || !repository) {
      Alert.alert('Error', 'Doctor or repository not available.');
      return;
    }

    if (availabilityForms.length === 0) {
      Alert.alert('No Schedule', 'Please add at least one availability slot.');
      return;
    }

    if (!validateForms()) {
      return;
    }

    setIsSaving(true);

    try {
      // Convert forms to availability objects
      const newAvailability: Availability[] = availabilityForms.map(form => {
        let rrule: string | undefined;
        
        if (form.useRRule) {
          rrule = form.rruleType === 'biweekly' 
            ? createBiWeeklyRRule(form.weekday)
            : createWeeklyRRule(form.weekday);
        }
        
        return {
          id: generateUUID(),
          weekday: form.weekday,
          startTime: form.startTime,
          endTime: form.endTime,
          rrule
        };
      });

      // Update doctor with new availability
      const updatedDoctor: Doctor = {
        ...selectedDoctor,
        weeklyAvailability: newAvailability
      };

      await repository.updateDoctor(updatedDoctor);
      await refreshData();

      Alert.alert(
        'Schedule Updated',
        'Your availability schedule has been successfully updated.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDoctorSelector = () => {
    if (doctors.length <= 1) return null;

    return (
      <View style={styles.doctorSelector}>
        <Text style={styles.sectionTitle}>Select Doctor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {doctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={[
                styles.doctorButton,
                selectedDoctorId === doctor.id && styles.selectedDoctorButton,
              ]}
              onPress={() => setSelectedDoctorId(doctor.id)}
            >
              <Text style={[
                styles.doctorButtonText,
                selectedDoctorId === doctor.id && styles.selectedDoctorButtonText,
              ]}>
                {doctor.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAvailabilityForm = (form: AvailabilityForm, index: number) => {
    return (
      <View key={index} style={styles.availabilityForm}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Availability Slot {index + 1}</Text>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => removeAvailabilitySlot(index)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday Selector */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Day of Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weekdays.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.weekdayButton,
                  form.weekday === day.value && styles.selectedWeekdayButton,
                ]}
                onPress={() => updateAvailabilityForm(index, { weekday: day.value })}
              >
                <Text style={[
                  styles.weekdayButtonText,
                  form.weekday === day.value && styles.selectedWeekdayButtonText,
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selectors */}
        <View style={styles.timeSection}>
          <View style={styles.timeSelector}>
            <Text style={styles.formLabel}>Start Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    form.startTime === time && styles.selectedTimeButton,
                  ]}
                  onPress={() => updateAvailabilityForm(index, { startTime: time })}
                >
                  <Text style={[
                    styles.timeButtonText,
                    form.startTime === time && styles.selectedTimeButtonText,
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeSelector}>
            <Text style={styles.formLabel}>End Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    form.endTime === time && styles.selectedTimeButton,
                  ]}
                  onPress={() => updateAvailabilityForm(index, { endTime: time })}
                >
                  <Text style={[
                    styles.timeButtonText,
                    form.endTime === time && styles.selectedTimeButtonText,
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* RRule Options */}
        <View style={styles.rruleSection}>
          <View style={styles.rruleToggle}>
            <Text style={styles.formLabel}>Use Recurring Pattern</Text>
            <Switch
              value={form.useRRule}
              onValueChange={(value) => updateAvailabilityForm(index, { useRRule: value })}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {form.useRRule && (
            <View style={styles.rruleOptions}>
              <TouchableOpacity
                style={[
                  styles.rruleButton,
                  form.rruleType === 'weekly' && styles.selectedRruleButton,
                ]}
                onPress={() => updateAvailabilityForm(index, { rruleType: 'weekly' })}
              >
                <Text style={[
                  styles.rruleButtonText,
                  form.rruleType === 'weekly' && styles.selectedRruleButtonText,
                ]}>
                  Every Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rruleButton,
                  form.rruleType === 'biweekly' && styles.selectedRruleButton,
                ]}
                onPress={() => updateAvailabilityForm(index, { rruleType: 'biweekly' })}
              >
                <Text style={[
                  styles.rruleButtonText,
                  form.rruleType === 'biweekly' && styles.selectedRruleButtonText,
                ]}>
                  Every 2 Weeks
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule Setup</Text>
          <Text style={styles.subtitle}>
            Configure your weekly availability for appointments
          </Text>
        </View>

        {renderDoctorSelector()}

        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>Availability Slots</Text>
          
          {availabilityForms.map((form, index) => 
            renderAvailabilityForm(form, index)
          )}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={addAvailabilitySlot}
          >
            <Text style={styles.addButtonText}>+ Add Availability Slot</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveSchedule}
          disabled={isSaving}
        >
          {isSaving ? (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Schedule</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  doctorSelector: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  doctorButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedDoctorButton: {
    backgroundColor: '#007AFF',
  },
  doctorButtonText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedDoctorButtonText: {
    color: '#FFFFFF',
  },
  availabilitySection: {
    padding: 16,
  },
  availabilityForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  weekdayButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  selectedWeekdayButton: {
    backgroundColor: '#007AFF',
  },
  weekdayButtonText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedWeekdayButtonText: {
    color: '#FFFFFF',
  },
  timeSection: {
    marginBottom: 16,
  },
  timeSelector: {
    marginBottom: 12,
  },
  timeButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTimeButton: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedTimeButtonText: {
    color: '#FFFFFF',
  },
  rruleSection: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 16,
  },
  rruleToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rruleOptions: {
    flexDirection: 'row',
  },
  rruleButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedRruleButton: {
    backgroundColor: '#34C759',
  },
  rruleButtonText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedRruleButtonText: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});