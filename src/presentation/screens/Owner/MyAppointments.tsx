import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TextInput,
  Share
} from 'react-native';
import { Appointment } from '../../../domain/entities/Appointment';
import { useAppState } from '../../hooks/useAppState';
import { formatDateTime, formatDate, isToday, isTomorrow, isPastDate } from '../../../shared/utils/date';
import { exportAppointmentToIcs } from '../../../shared/utils/icalHelpers';

export default function MyAppointments() {
  const { appointments, cancelAppointmentUseCase, refreshData, isLoading } = useAppState();
  const [ownerFilter, setOwnerFilter] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<{[key: string]: Appointment[]}>({});

  useEffect(() => {
    filterAndGroupAppointments();
  }, [appointments, ownerFilter]);

  const filterAndGroupAppointments = () => {
    let filtered = [...appointments];

    // Filter by owner name if specified
    if (ownerFilter.trim()) {
      const query = ownerFilter.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.ownerName.toLowerCase().includes(query) ||
        appointment.petName.toLowerCase().includes(query)
      );
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => 
      new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime()
    );

    setFilteredAppointments(filtered);

    // Group by pet name
    const grouped = filtered.reduce((groups, appointment) => {
      const key = `${appointment.ownerName} - ${appointment.petName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(appointment);
      return groups;
    }, {} as {[key: string]: Appointment[]});

    setGroupedAppointments(grouped);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment for ${appointment.petName} on ${formatDateTime(appointment.startDateISO)}?`,
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
      const result = await cancelAppointmentUseCase.execute(appointmentId, 'Cancelled by owner');
      
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

  const handleExportAppointment = async (appointment: Appointment) => {
    try {
      const icalString = exportAppointmentToIcs(appointment);
      
      await Share.share({
        message: icalString,
        title: `Pet Appointment - ${appointment.petName}`,
      });
    } catch (error) {
      console.error('Error exporting appointment:', error);
      Alert.alert('Error', 'Failed to export appointment.');
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

  const renderAppointmentCard = (appointment: Appointment) => {
    const isPast = isPastDate(appointment.startDateISO);
    const canCancel = !isPast && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
      <View style={[styles.appointmentCard, isPast && styles.pastAppointmentCard]}>
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentInfo}>
            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.location}>{appointment.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {getDateLabel(appointment.startDateISO)} at {formatDateTime(appointment.startDateISO).split(' at ')[1]}
            </Text>
          </View>
          
          {appointment.disease && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>{appointment.disease}</Text>
            </View>
          )}
          
          {appointment.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{appointment.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => handleExportAppointment(appointment)}
          >
            <Text style={styles.exportButtonText}>Export .ics</Text>
          </TouchableOpacity>
          
          {canCancel && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelAppointment(appointment)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPetGroup = ({ item }: { item: [string, Appointment[]] }) => {
    const [petKey, petAppointments] = item;
    
    return (
      <View style={styles.petGroup}>
        <Text style={styles.petGroupTitle}>{petKey}</Text>
        {petAppointments.map((appointment, index) => (
          <View key={appointment.id}>
            {renderAppointmentCard(appointment)}
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by owner or pet name..."
          value={ownerFilter}
          onChangeText={setOwnerFilter}
          clearButtonMode="while-editing"
        />
        <Text style={styles.appointmentCount}>
          {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Appointments Found</Text>
        <Text style={styles.emptyStateText}>
          {ownerFilter.trim() 
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

  const groupedData = Object.entries(groupedAppointments);

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedData}
        keyExtractor={(item) => item[0]}
        renderItem={renderPetGroup}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  appointmentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  petGroup: {
    marginBottom: 20,
  },
  petGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
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
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  location: {
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
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exportButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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