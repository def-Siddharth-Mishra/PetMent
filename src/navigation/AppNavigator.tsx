import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Owner screens
import DoctorList from '../presentation/screens/Owner/DoctorList';
import DoctorDetail from '../presentation/screens/Owner/DoctorDetail';
import BookAppointment from '../presentation/screens/Owner/BookAppointment';
import MyAppointments from '../presentation/screens/Owner/MyAppointments';

// Doctor screens
import DoctorScheduleSetup from '../presentation/screens/Doctor/DoctorScheduleSetup';
import DoctorAppointments from '../presentation/screens/Doctor/DoctorAppointments';

import { useAppState } from '../presentation/hooks/useAppState';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Owner Stack Navigator
function OwnerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DoctorList" 
        component={DoctorList} 
        options={{ title: 'Find a Doctor' }}
      />
      <Stack.Screen 
        name="DoctorDetail" 
        component={DoctorDetail} 
        options={{ title: 'Doctor Details' }}
      />
      <Stack.Screen 
        name="BookAppointment" 
        component={BookAppointment} 
        options={{ title: 'Book Appointment' }}
      />
    </Stack.Navigator>
  );
}

// Doctor Stack Navigator
function DoctorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DoctorAppointments" 
        component={DoctorAppointments} 
        options={{ title: 'My Appointments' }}
      />
      <Stack.Screen 
        name="DoctorScheduleSetup" 
        component={DoctorScheduleSetup} 
        options={{ title: 'Schedule Setup' }}
      />
    </Stack.Navigator>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Initializing PetSlot...</Text>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="OwnerTab" 
        component={OwnerStack}
        options={{
          title: 'Find Doctor',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="MyAppointments" 
        component={MyAppointments}
        options={{
          title: 'My Appointments',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="DoctorTab" 
        component={DoctorStack}
        options={{
          title: 'Doctor Portal',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👨‍⚕️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { initialize, isInitialized, isLoading } = useAppState();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});