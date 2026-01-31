import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button, StyleSheet, Alert } from 'react-native';
import usePermissions from '../hooks/usePermissions';
import useTracking from '../hooks/useTracking';

const MonitoringDashboard = () => {
  const permissionStatus = usePermissions();
  const { useLocalServer, setUseLocalServer } = useTracking(permissionStatus);
  const [logs, setLogs] = useState([]);
  const [serverStatus, setServerStatus] = useState('Checking...');

  // Simulate logs (in real app, collect from hooks or AsyncStorage)
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] Monitoring active`]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Test server ping
  const testServer = async () => {
    const url = useLocalServer ? 'http://localhost:10000/log-sms' : 'https://tiger2-1.onrender.com/log-sms';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'ping' })
      });
      setServerStatus(`Server OK (${response.status})`);
    } catch (error) {
      setServerStatus(`Server Error: ${error.message}`);
    }
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
        <Button title="Test Server Ping" onPress={testServer} />
        <Text>Server Status: {serverStatus}</Text>
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