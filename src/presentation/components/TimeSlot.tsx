import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TimeSlot as TimeSlotType } from '../../domain/entities/Doctor';
import { formatTime } from '../../shared/utils/date';

interface TimeSlotProps {
  slot: TimeSlotType;
  onPress: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export default function TimeSlot({ slot, onPress, isSelected = false, isDisabled = false }: TimeSlotProps) {
  const startTime = formatTime(slot.startISO);
  const endTime = formatTime(slot.endISO);

  return (
    <TouchableOpacity
      style={[
        styles.slot,
        isSelected && styles.selectedSlot,
        isDisabled && styles.disabledSlot,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Text style={[
        styles.timeText,
        isSelected && styles.selectedTimeText,
        isDisabled && styles.disabledTimeText,
      ]}>
        {startTime}
      </Text>
      <Text style={[
        styles.durationText,
        isSelected && styles.selectedDurationText,
        isDisabled && styles.disabledDurationText,
      ]}>
        {endTime}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledSlot: {
    backgroundColor: '#F2F2F7',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  disabledTimeText: {
    color: '#8E8E93',
  },
  durationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectedDurationText: {
    color: '#FFFFFF',
  },
  disabledDurationText: {
    color: '#C7C7CC',
  },
});