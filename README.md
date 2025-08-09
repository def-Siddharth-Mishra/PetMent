# PetMent - Pet Appointment Scheduling App

A React Native appointment scheduling application for pet practices, built with Clean Architecture principles and TypeScript.

## Features

### Owner Features
- **Doctor Discovery**: Browse and filter doctors by specialty, location, and availability
- **Appointment Booking**: Select available time slots and book appointments
- **My Appointments**: View, manage, and cancel upcoming appointments
- **Export/Import**: Export appointments as .ics files for calendar integration

### Doctor Features
- **Schedule Management**: Set up weekly availability with recurring patterns using rrule
- **Appointment Overview**: View and manage all scheduled appointments
- **Availability Patterns**: Support for weekly and bi-weekly recurring schedules

### Technical Features
- **Clean Architecture**: Separation of presentation, domain, and data layers
- **Local Persistence**: All data stored locally using AsyncStorage
- **Recurring Patterns**: Advanced scheduling with rrule support
- **Conflict Detection**: Prevents double-booking with real-time availability checking
- **iCal Integration**: Export/import appointments in standard .ics format

## Architecture

```
src/
├── app.tsx                 # App entry point
├── navigation/             # Navigation configuration
├── presentation/           # UI layer
│   ├── screens/           # Screen components
│   ├── components/        # Reusable UI components
│   └── hooks/             # Custom hooks and state management
├── domain/                # Business logic layer
│   ├── entities/          # Core business entities
│   ├── usecases/          # Business use cases
│   └── repositories/      # Repository interfaces
├── data/                  # Data layer
│   ├── models/            # Data models
│   ├── datasources/       # Data sources (AsyncStorage)
│   └── repositories/      # Repository implementations
├── shared/                # Shared utilities
│   └── utils/             # Helper functions

```

## Installation & Setup

### Prerequisites
- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation Steps

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/def-Siddharth-Mishra/PetMent.git
   cd PetMent
   npm install
   ```

2. **iOS Setup** (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Run the application**:
   
   **Android**:
   ```bash
   npx react-native run-android
   ```
   
   **iOS**:
   ```bash
   npx react-native run-ios
   ```

## Usage Guide

### For Pet Owners

1. **Finding a Doctor**:
   - Open the app and navigate to "Find Doctor"
   - Use the search bar to find doctors by name, specialty, or location
   - Filter by specialty using the filter buttons
   - Only doctors with upcoming availability are shown

2. **Booking an Appointment**:
   - Tap on a doctor card to view details
   - Select a date from the calendar view
   - Choose an available time slot
   - Fill in pet and owner information
   - Confirm the booking

3. **Managing Appointments**:
   - Go to "My Appointments" to view all bookings
   - Search by owner or pet name
   - Cancel appointments if needed
   - Export appointments as .ics files

### For Doctors

1. **Setting Up Schedule**:
   - Navigate to "Doctor Portal" → "Setup Schedule"
   - Add availability slots for different days
   - Configure recurring patterns (weekly/bi-weekly)
   - Save the schedule

2. **Managing Appointments**:
   - View all appointments in "My Appointments"
   - Filter by date or search by patient
   - Cancel appointments when necessary

## Testing

### Running Tests
```bash
npm test
```

### Manual Testing Scenarios

1. **Basic Booking Flow**:
   - Start app → Find Doctor → Filter by "dental" → Book a slot → Verify removal for others

2. **Recurring Availability**:
   - Doctor sets up recurring availability using rrule → Verify expanded slots appear for next 30 days

3. **Export/Import**:
   - Export appointment to .ics → Import to create demonstration appointment

4. **Conflict Handling**:
   - Attempt to book same slot simultaneously → Verify conflict detection and alternative suggestions

## Key Implementation Details

### Slot Generation Algorithm
The `GetAvailableSlotsUseCase` implements sophisticated slot generation:
1. Expands doctor's weekly availability using rrule patterns
2. Generates time slots (default 30 minutes) for each availability block
3. Filters out past slots and existing bookings
4. Returns sorted available slots

### Recurring Patterns
Uses the `rrule` library for advanced scheduling:
- **Weekly**: `FREQ=WEEKLY;INTERVAL=1;BYDAY=MO`
- **Bi-weekly**: `FREQ=WEEKLY;INTERVAL=2;BYDAY=TU`

### Data Persistence
All data is stored locally using AsyncStorage:
- Doctors and availability patterns
- Appointments and booking history
- App initialization state

### Conflict Resolution
Implements last-check pattern for booking:
1. Re-validate slot availability before booking
2. Return alternative slots if conflict detected
3. Atomic booking operations to prevent race conditions

## Sample Data

The app seeds with 3 sample doctors:

1. **Dr. Sarah Johnson** (Dental, General)
   - Monday 9:00-12:00, Wednesday 14:00-17:00, Friday 10:00-15:00

2. **Dr. Michael Chen** (Surgery, Emergency)
   - Tuesday 8:00-16:00 (weekly), Thursday 8:00-16:00 (bi-weekly)

3. **Dr. Emily Rodriguez** (Dermatology, General)
   - Monday 13:00-18:00, Tuesday 9:00-14:00, Thursday 10:00-16:00 (weekly)

## Dependencies

### Core Dependencies
- **React Native**: Mobile app framework
- **TypeScript**: Type safety and development experience
- **@react-navigation**: Navigation library
- **@react-native-async-storage**: Local data persistence
- **rrule**: Recurring rule parsing and generation
- **uuid**: Unique identifier generation
- **zustand**: State management

### Development Dependencies
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

3. **iOS build issues**:
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

4. **AsyncStorage issues**:
   - Clear app data/storage in device settings
   - Or use the app's clear data functionality

## Development Notes

### Default Configurations
- **Slot Duration**: 30 minutes (configurable)
- **Availability Window**: Next 30 days
- **Time Rounding**: Slots align to start times
- **Timezone**: Local device timezone

### Performance Considerations
- Slot generation is cached per doctor/date combination
- Availability checking is optimized for common use cases
- UI updates are debounced for search operations

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Use TypeScript strictly (no `any` types)
5. Follow the established naming conventions

## License

This project is for assessment purposes and is not intended for commercial use.