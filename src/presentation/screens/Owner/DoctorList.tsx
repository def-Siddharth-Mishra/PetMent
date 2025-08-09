import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Doctor, TimeSlot } from '../../../domain/entities/Doctor';
import DoctorCard from '../../components/DoctorCard';
import { useAppState } from '../../hooks/useAppState';

export default function DoctorList() {
  const navigation = useNavigation();
  const { doctors, getAvailableSlotsUseCase, isLoading } = useAppState();
  
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [doctorsWithAvailability, setDoctorsWithAvailability] = useState<Set<string>>(new Set());
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const specialties = ['all', 'dental', 'surgery', 'emergency', 'dermatology', 'general'];

  useEffect(() => {
    checkDoctorAvailability();
  }, [doctors]);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, selectedSpecialty, doctorsWithAvailability]);

  const checkDoctorAvailability = async () => {
    if (!getAvailableSlotsUseCase || doctors.length === 0) return;
    
    setIsCheckingAvailability(true);
    const availableDoctors = new Set<string>();
    
    // Check next 30 days for availability
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30);

    try {
      await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const slots = await getAvailableSlotsUseCase.execute(
              doctor.id,
              now.toISOString(),
              futureDate.toISOString()
            );
            
            if (slots.length > 0) {
              availableDoctors.add(doctor.id);
            }
          } catch (error) {
            console.error(`Error checking availability for doctor ${doctor.id}:`, error);
          }
        })
      );
      
      setDoctorsWithAvailability(availableDoctors);
    } catch (error) {
      console.error('Error checking doctor availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.location.toLowerCase().includes(query) ||
        doctor.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        )
      );
    }

    // Filter by specialty
    if (selectedSpecialty && selectedSpecialty !== 'all') {
      filtered = filtered.filter(doctor =>
        doctor.specialties.some(specialty =>
          specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
        )
      );
    }

    // Sort by availability (available doctors first) and then by rating
    filtered.sort((a, b) => {
      const aHasAvailability = doctorsWithAvailability.has(a.id);
      const bHasAvailability = doctorsWithAvailability.has(b.id);
      
      if (aHasAvailability && !bHasAvailability) return -1;
      if (!aHasAvailability && bHasAvailability) return 1;
      
      return b.rating - a.rating;
    });

    setFilteredDoctors(filtered);
  };

  const handleDoctorPress = (doctor: Doctor) => {
    const hasAvailability = doctorsWithAvailability.has(doctor.id);
    
    if (!hasAvailability) {
      Alert.alert(
        'No Availability',
        'This doctor has no available appointments in the next 30 days. Please try again later or contact the clinic directly.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('DoctorDetail' as never, { doctor } as never);
  };

  const renderSpecialtyFilter = () => {
    return (
      <View style={styles.specialtyContainer}>
        <Text style={styles.filterLabel}>Filter by specialty:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={specialties}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.specialtyButton,
                selectedSpecialty === item && styles.selectedSpecialtyButton,
              ]}
              onPress={() => setSelectedSpecialty(item === 'all' ? '' : item)}
            >
              <Text style={[
                styles.specialtyButtonText,
                selectedSpecialty === item && styles.selectedSpecialtyButtonText,
              ]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.specialtyList}
        />
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Find a Doctor</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specialties, or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {renderSpecialtyFilter()}
        
        {isCheckingAvailability && (
          <View style={styles.availabilityCheck}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.availabilityCheckText}>Checking availability...</Text>
          </View>
        )}
        
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          </Text>
          <Text style={styles.availabilityNote}>
            {doctorsWithAvailability.size} with upcoming availability
          </Text>
        </View>
      </View>
    );
  };

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const hasAvailability = doctorsWithAvailability.has(item.id);
    
    return (
      <DoctorCard
        doctor={item}
        onPress={() => handleDoctorPress(item)}
        hasAvailability={hasAvailability}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctor}
        ListHeaderComponent={renderHeader}
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
    marginBottom: 16,
  },
  specialtyContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  specialtyList: {
    paddingRight: 16,
  },
  specialtyButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedSpecialtyButton: {
    backgroundColor: '#007AFF',
  },
  specialtyButtonText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedSpecialtyButtonText: {
    color: '#FFFFFF',
  },
  availabilityCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityCheckText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  availabilityNote: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
});