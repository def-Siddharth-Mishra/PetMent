import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Appointment } from '../../../domain/entities/Appointment';
import { Doctor } from '../../../domain/entities/Doctor';
import { useAppState } from '../../hooks/useAppState';
import { formatDateTime, formatDate, isToday, isTomorrow, isPastDate } from '../../../shared/utils/date';

export default function DoctorAppointments() {
  const navigation = useNavigation();
  const { appointments, doctors, cancelAppointmentUseCase, refreshData, isLoading } = useAppState();
  
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedDoctorId, dateFilter]);

  const filterAppointments = () => {
    let filtered = appointments.filter(appointment => 
      selectedDoctorId ? appointment.doctorId === selectedDoctorId : true
    );

    // Filter by date if specified
    if (dateFilter.trim()) {
      const query = dateFilter.toLowerCase();
      filtered = filtered.filter(appointment => {
        const appointmentDate = formatDate(appointment.startDateISO).toLowerCase();
        return appointmentDate.includes(query) ||
               appointment.ownerName.toLowerCase().includes(query) ||
               appointment.petName.toLowerCase().includes(query);
      });
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => 
      new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime()
    );

    setFilteredAppointments(filtered);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment for ${appointment.petName} (${appointment.ownerName}) on ${formatDateTime(appointment.startDateISO)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelAppointment(appointment.id)
        }
      ]
    );
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!cancelAppointmentUseCase) {
      Alert.alert('Error', 'Cancel service is not available.');
      return;
    }

    try {
      const result = await cancelAppointmentUseCase.execute(appointmentId, 'Cancelled by doctor');
      
      if (result.success) {
        await refreshData();
        Alert.alert('Success', 'Appointment has been cancelled.');
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel appointment.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#007AFF';
      case 'confirmed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      case 'completed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getDateLabel = (dateISO: string) => {
    if (isToday(dateISO)) return 'Today';
    if (isTomorrow(dateISO)) return 'Tomorrow';
    return formatDate(dateISO);
  };

  const renderDoctorSelector = () => {
    if (doctors.length <= 1) return null;

    return (
      <View style={styles.doctorSelector}>
        <Text style={styles.selectorLabel}>Select Doctor:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.doctorButton,
                selectedDoctorId === item.id && styles.selectedDoctorButton,
              ]}
              onPress={() => setSelectedDoctorId(item.id)}
            >
              <Text style={[
                styles.doctorButtonText,
                selectedDoctorId === item.id && styles.selectedDoctorButtonText,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.doctorList}
        />
      </View>
    );
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    const isPast = isPastDate(item.startDateISO);
    const canCancel = !isPast && item.status !== 'cancelled' && item.status !== 'completed';

    return (
      <View style={[styles.appointmentCard, isPast && styles.pastAppointmentCard]}>
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentInfo}>
            <Text style={styles.petName}>{item.petName}</Text>
            <Text style={styles.ownerName}>Owner: {item.ownerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>
              {getDateLabel(item.startDateISO)} at {formatDateTime(item.startDateISO).split(' at ')[1]}
            </Text>
          </View>
          
          {item.disease && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>{item.disease}</Text>
            </View>
          )}
          
          {item.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{item.notes}</Text>
            </View>
          )}
        </View>

        {canCancel && (
          <View style={styles.appointmentActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelAppointment(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    
    return (
      <View style={styles.header}>
        <Text style={styles.title}>
          {selectedDoctor ? `${selectedDoctor.name}'s Appointments` : 'Doctor Appointments'}
        </Text>
        
        {renderDoctorSelector()}
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date, owner, or pet name..."
          value={dateFilter}
          onChangeText={setDateFilter}
          clearButtonMode="while-editing"
        />
        
        <View style={styles.headerActions}>
          <Text style={styles.appointmentCount}>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </Text>
          
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={() => navigation.navigate('DoctorScheduleSetup' as never)}
          >
            <Text style={styles.scheduleButtonText}>Setup Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Appointments Found</Text>
        <Text style={styles.emptyStateText}>
          {dateFilter.trim() 
            ? 'No appointments match your search criteria.'
            : 'You have no appointments scheduled.'
          }
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  doctorSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  doctorList: {
    paddingRight: 16,
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
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appointmentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastAppointmentCard: {
    opacity: 0.7,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  appointmentActions: {
    alignItems: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});