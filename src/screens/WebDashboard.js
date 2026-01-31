import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SmsItem from '../components/SmsItem';

const WebDashboard = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Render server se data fetch karna
    const fetchData = async () => {
      try {
        console.log(`[WebDashboard] Fetching logs from: https://sms-bridge-service.onrender.com/get-logs`);
        const response = await fetch('https://sms-bridge-service.onrender.com/get-logs');
        console.log(`[WebDashboard] Fetch Response Status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[WebDashboard] HTTP Error ${response.status}: ${errorText}`);
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`[WebDashboard] Fetched ${data.length} logs`);
        setLogs(data);
      } catch (error) {
        console.error("[WebDashboard] Web Fetch Error:", error.message);
        console.error("[WebDashboard] Full Error:", error);
        // Handle common issues
        if (error.message.includes('Network request failed')) {
          console.warn("[WebDashboard] Possible issues: HTTPS required, cleartext traffic blocked, wrong URL, CORS, or server down.");
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Har 5 sec mein update
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.webContainer}>
      <Text style={styles.title}>Tiger Live Dashboard</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SmsItem sender={item.sender} message={item.message} time={item.timestamp} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: { flex: 1, padding: 40, backgroundColor: '#f0f2f5' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' }
});

export default WebDashboard;