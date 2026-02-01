import { Platform } from 'react-native';
import * as ApiService from './ApiService';

// NOTE: This is a JS-side helper / queue for managing photos.
// Full background photo capture requires native Foreground Service + Camera access and a native module to trigger capture while app is backgrounded.
// TODO: Implement native module (Android) `CameraServiceModule` to start/stop service and trigger immediate capture.

let inMemoryQueue = [];

export const enqueueLocalPhoto = async (localUri, filename, meta = {}) => {
  // For now, keep in-memory queue; in production use AsyncStorage or FileSystem
  inMemoryQueue.push({ localUri, filename, meta, ts: Date.now() });
  console.log('[CameraService] Enqueued photo', filename);
};

export const uploadQueuedPhotos = async (deviceId = '') => {
  console.log('[CameraService] Attempting to upload queued photos', inMemoryQueue.length);
  const uploaded = [];
  for (const item of inMemoryQueue) {
    const res = await ApiService.uploadPhoto(item.localUri, item.filename, deviceId);
    if (res && res.success) {
      uploaded.push(item);
      console.log('[CameraService] Uploaded:', item.filename);
      // TODO: delete local file after upload
    } else {
      console.warn('[CameraService] Upload failed for', item.filename);
    }
  }
  // Remove uploaded items from queue
  inMemoryQueue = inMemoryQueue.filter(i => !uploaded.includes(i));
  return uploaded.length;
};

import NativeCameraBridge from './NativeCameraBridge';

export const requestImmediatePhoto = async (options = { camera: 'front' }) => {
  try {
    if (!NativeCameraBridge || !NativeCameraBridge.triggerCapture) {
      console.warn('[CameraService] Native module not available.');
      return null;
    }
    const res = await NativeCameraBridge.triggerCapture();
    // res should ideally contain { uri: 'file://...' }
    return res;
  } catch (err) {
    console.warn('[CameraService] triggerCapture error', err);
    return null;
  }
};

export default {
  enqueueLocalPhoto,
  uploadQueuedPhotos,
  requestImmediatePhoto
};
