import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Doctor } from '../../domain/entities/Doctor';
import { formatTime } from '../../shared/utils/date';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  hasAvailability?: boolean;
}

export default function DoctorCard({ doctor, onPress, hasAvailability = true }: DoctorCardProps) {
  const renderSpecialties = () => {
    return doctor.specialties.map((specialty, index) => (
      <View key={index} style={styles.specialtyTag}>
        <Text style={styles.specialtyText}>{specialty}</Text>
      </View>
    ));
  };

  const renderAvailability = () => {
    if (doctor.weeklyAvailability.length === 0) {
      return <Text style={styles.noAvailability}>No availability set</Text>;
    }

    const nextAvailability = doctor.weeklyAvailability[0];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Text style={styles.availabilityText}>
        Next: {weekdays[nextAvailability.weekday]} {nextAvailability.startTime}-{nextAvailability.endTime}
      </Text>
    );
  };

  const renderRating = () => {
    const stars = '★'.repeat(Math.floor(doctor.rating)) + '☆'.repeat(5 - Math.floor(doctor.rating));
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, !hasAvailability && styles.cardDisabled]} 
      onPress={onPress}
      disabled={!hasAvailability}
    >
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.location}>{doctor.location}</Text>
        </View>
        {renderRating()}
      </View>
      
      <View style={styles.specialtiesContainer}>
        {renderSpecialties()}
      </View>
      
      <View style={styles.footer}>
        {renderAvailability()}
        {!hasAvailability && (
          <Text style={styles.noAvailabilityWarning}>No upcoming availability</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#8E8E93',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 16,
    color: '#FF9500',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#E5F4FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  noAvailability: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  noAvailabilityWarning: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
});