import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button, StyleSheet, Alert } from 'react-native';
import usePermissions from '../hooks/usePermissions';
import useTracking from '../hooks/useTracking';

const MonitoringDashboard = () => {
  const permissionStatus = usePermissions();
  const { useLocalServer, setUseLocalServer, deviceId } = useTracking(permissionStatus);
  const [logs, setLogs] = useState([]);
  const [serverStatus, setServerStatus] = useState('Checking...');

  // Simulate logs (in real app, collect from hooks or AsyncStorage)
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] Monitoring active`]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Test server ping (POST /log-sms)
  const testServer = async () => {
    const url = useLocalServer ? 'http://localhost:10000/log-sms' : 'https://tiger2-1.onrender.com/log-sms';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'manual', message: 'ping', device: 'Manual Test', deviceId: deviceId })
      });
      setServerStatus(`Server OK (${response.status})`);
    } catch (error) {
      setServerStatus(`Server Error: ${error.message}`);
    }
  };

  // Trigger server-side manual ping (/trigger-ping)
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
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Heartbeat controls
  const [hbEnabled, setHbEnabled] = useState(true);
  const [hbInterval, setHbInterval] = useState(40000);
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

  const changeInterval = async (ms) => {
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
            } catch (e) { Alert.alert('Error', e.message); }
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