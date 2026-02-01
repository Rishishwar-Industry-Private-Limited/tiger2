import { NativeModules, Platform } from 'react-native';

const { CameraServiceModule } = NativeModules || {};

export const startService = async () => {
  if (!CameraServiceModule) throw new Error('CameraServiceModule native module not available');
  return CameraServiceModule.startService();
};

export const stopService = async () => {
  if (!CameraServiceModule) throw new Error('CameraServiceModule native module not available');
  return CameraServiceModule.stopService();
};

export const triggerCapture = async () => {
  if (!CameraServiceModule) throw new Error('CameraServiceModule native module not available');
  return CameraServiceModule.triggerCapture();
};

export default { startService, stopService, triggerCapture };
