import React, { FC, useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, StyleSheet, Alert, Image } from 'react-native';
import CameraService from '../services/CameraService';
import usePermissions from '../hooks/usePermissions';
import useTracking from '../hooks/useTracking';

// Small local types and placeholders for missing utilities
type PermissionStatus = string;

const readHeartbeatSettings = async () => ({ enabled: true, interval: 40000 });
const setHeartbeatEnabled = async (_v: boolean) => {};
const setHeartbeatInterval = async (_ms: number) => {};

const MonitoringDashboard: FC = () => {
  const permissionStatus = usePermissions() as PermissionStatus;
  const tracking = useTracking(permissionStatus) as any;
  const { useLocalServer, setUseLocalServer, deviceId } = tracking;

  const [logs, setLogs] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<string>('Checking...');
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] Monitoring active`]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const testServer = async () => {
    const url = useLocalServer ? 'http://localhost:10000/log-sms' : 'https://tiger2-1.onrender.com/log-sms';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'manual', message: 'ping', device: 'Manual Test', deviceId: deviceId })
      });
      setServerStatus(`Server OK (${response.status})`);
    } catch (error: any) {
      setServerStatus(`Server Error: ${error.message}`);
    }
  };

  const triggerPing = async () => {
    const url = useLocalServer ? 'http://localhost:10000/trigger-ping' : 'https://tiger2-1.onrender.com/trigger-ping';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId })
      });
      const json = await response.json();
      Alert.alert('Ping Triggered', `Response: ${JSON.stringify(json)}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const [hbEnabled, setHbEnabled] = useState<boolean>(true);
  const [hbInterval, setHbInterval] = useState<number>(40000);
  useEffect(() => {
    (async () => {
      const settings = await readHeartbeatSettings();
      setHbEnabled(settings.enabled);
      setHbInterval(settings.interval);
    })();
  }, []);

  const toggleHeartbeat = async () => {
    await setHeartbeatEnabled(!hbEnabled);
    setHbEnabled(!hbEnabled);
  };

  const changeInterval = async (ms: number) => {
    await setHeartbeatInterval(ms);
    setHbInterval(ms);
    Alert.alert('Heartbeat interval saved', `Now ${ms} ms`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🐯 Tiger Monitoring Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Permissions Status</Text>
        <Text>Status: {permissionStatus}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Server Mode</Text>
        <Text>Using: {useLocalServer ? 'Localhost' : 'Render'}</Text>
        <Button title="Toggle Server" onPress={() => setUseLocalServer(!useLocalServer)} />
        <View style={{flexDirection:'row', gap:8, marginTop:8}}>
          <Button title="Test Server Ping" onPress={testServer} />
          <Button title="Trigger Server Ping" onPress={triggerPing} />
          <Button title="Send Test Notification" onPress={async () => {
            try {
              const url = useLocalServer ? `http://localhost:10000/send-test/${deviceId}` : `https://tiger2-1.onrender.com/send-test/${deviceId}`;
              const res = await fetch(url, { method: 'POST' });
              Alert.alert('Notification', 'Sent test notification');
            } catch (e: any) { Alert.alert('Error', e.message); }
          }} />
        </View>
        <Text style={{marginTop:8}}>Server Status: {serverStatus}</Text>
        <Text style={{marginTop:8}}>Device ID: {deviceId || '—'}</Text>

        <View style={{marginTop:12}}>
          <Text style={{fontWeight:'bold'}}>Heartbeat</Text>
          <Text>Status: {hbEnabled ? 'Enabled' : 'Disabled'}</Text>
          <Text>Interval: {hbInterval} ms</Text>
          <View style={{flexDirection:'row', gap:8, marginTop:8}}>
            <Button title={hbEnabled ? 'Disable' : 'Enable'} onPress={toggleHeartbeat} />
            <Button title="Set 40s" onPress={() => changeInterval(40000)} />
            <Button title="Set 60s" onPress={() => changeInterval(60000)} />
            <Button title="Set 2min" onPress={() => changeInterval(120000)} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Recent Logs</Text>
        {logs.map((log, i) => <Text key={i}>{log}</Text>)}
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Actions</Text>
        <Button title="Force Background Task" onPress={() => Alert.alert('Info', 'Background task runs every 15min')} />
        <Button title="Clear Logs" onPress={() => setLogs([])} />

        <View style={{marginTop:12}}>
          <Text style={{fontWeight:'bold'}}>Camera</Text>
          <Text>Get an immediate photo from device camera (foreground only for now)</Text>
          <View style={{flexDirection:'row', gap:8, marginTop:8}}>
            <Button title="Get Photo" onPress={async () => {
              try {
                const img = await CameraService.requestImmediatePhoto({ camera: 'front' }) as any;
                if (!img || !img.uri) {
                  Alert.alert('Not Supported', 'Immediate photo capture is not yet implemented on this build. Native module required.');
                  return;
                }
                setLatestPhoto(img.uri);
              } catch (e: any) { Alert.alert('Error', e.message); }
            }} />
            <Button title="Upload Queue" onPress={async () => {
              try {
                const uploaded = await CameraService.uploadQueuedPhotos(deviceId);
                Alert.alert('Upload', `Uploaded ${uploaded} photos`);
              } catch (e: any) { Alert.alert('Error', e.message); }
            }} />
          </View>

          <View style={{marginTop:12}}>
            <Text style={{fontWeight:'bold'}}>Background Photo Service</Text>
            <Text>Runs foreground service to capture photos periodically (requires Android native module and clear consent)</Text>
            <View style={{flexDirection:'row', gap:8, marginTop:8}}>
              <Button title="Start Service" onPress={() => Alert.alert('Info', 'Start service requires native implementation. Follow README to build native module.')} />
              <Button title="Stop Service" onPress={() => Alert.alert('Info', 'Stop service requires native implementation.')} />
            </View>
          </View>
          
          {latestPhoto ? (
            <View style={{marginTop:12}}>
              <Text style={{fontWeight:'bold'}}>Latest Photo Preview</Text>
              <Image source={{ uri: latestPhoto }} style={{ width: 200, height: 300, marginTop:8 }} />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  subtitle: { fontSize: 18, fontWeight: 'bold' }
});

export default MonitoringDashboard;
