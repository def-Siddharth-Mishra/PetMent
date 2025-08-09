import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { TimeSlot as TimeSlotType } from '../../domain/entities/Doctor';
import TimeSlot from './TimeSlot';
import { formatDate, addDays, isSameDay, getRelativeDateString } from '../../shared/utils/date';

interface CalendarViewProps {
  doctorId: string;
  onSlotSelect: (slot: TimeSlotType) => void;
  selectedSlot?: TimeSlotType;
  getAvailableSlots: (doctorId: string, fromDate: string, toDate: string) => Promise<TimeSlotType[]>;
}

export default function CalendarView({ 
  doctorId, 
  onSlotSelect, 
  selectedSlot,
  getAvailableSlots 
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlotType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState<Date[]>([]);

  // Generate next 14 days
  useEffect(() => {
    const nextDates: Date[] = [];
    for (let i = 0; i < 14; i++) {
      nextDates.push(addDays(new Date(), i));
    }
    setDates(nextDates);
  }, []);

  // Load slots when date or doctor changes
  useEffect(() => {
    loadSlotsForDate(selectedDate);
  }, [selectedDate, doctorId]);

  const loadSlotsForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const slots = await getAvailableSlots(
        doctorId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateSelector = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {dates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isPast = date < new Date() && !isSameDay(date, new Date());
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && styles.selectedDateItem,
                isPast && styles.pastDateItem,
              ]}
              onPress={() => setSelectedDate(date)}
              disabled={isPast}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                isPast && styles.pastDayText,
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.dateText,
                isSelected && styles.selectedDateText,
                isPast && styles.pastDateText,
              ]}>
                {date.getDate()}
              </Text>
              <Text style={[
                styles.relativeText,
                isSelected && styles.selectedRelativeText,
                isPast && styles.pastRelativeText,
              ]}>
                {getRelativeDateString(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderTimeSlots = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <View style={styles.noSlotsContainer}>
          <Text style={styles.noSlotsText}>No available slots for this date</Text>
          <Text style={styles.noSlotsSubtext}>Try selecting a different date</Text>
        </View>
      );
    }

    return (
      <View style={styles.slotsContainer}>
        <Text style={styles.slotsHeader}>
          Available times for {formatDate(selectedDate)}
        </Text>
        <View style={styles.slotsGrid}>
          {availableSlots.map((slot, index) => (
            <TimeSlot
              key={`${slot.startISO}-${index}`}
              slot={slot}
              onPress={() => onSlotSelect(slot)}
              isSelected={selectedSlot?.startISO === slot.startISO}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderDateSelector()}
      <ScrollView style={styles.slotsScrollView}>
        {renderTimeSlots()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  dateSelector: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 70,
  },
  selectedDateItem: {
    backgroundColor: '#007AFF',
  },
  pastDateItem: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  pastDayText: {
    color: '#C7C7CC',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginVertical: 2,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  pastDateText: {
    color: '#C7C7CC',
  },
  relativeText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  selectedRelativeText: {
    color: '#FFFFFF',
  },
  pastRelativeText: {
    color: '#C7C7CC',
  },
  slotsScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  noSlotsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noSlotsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  slotsContainer: {
    padding: 16,
  },
  slotsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});