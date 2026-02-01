/*
  Simple script to POST dummy SMS/ping payloads to local Tiger Server (/log-sms).
  Usage:
    node tools/send_dummy_logs.js [count] [baseUrl]
  Examples:
    node tools/send_dummy_logs.js 10 http://localhost:10000
*/

const axios = require('axios');

const count = Number(process.argv[2]) || 10;
const baseUrl = process.argv[3] || 'http://localhost:10000';

const deviceIds = ['device-abc-001', 'device-xyz-123', 'device-test-777'];
const messages = [
  'Help! Need assistance',
  'All good, checking in',
  'Emergency! 2 people injured',
  'ping',
  'background',
  'Testing location upload',
  'Battery low',
  'Unknown sender test message'
];

async function sendOne(i) {
  const type = Math.random() < 0.25 ? 'ping' : 'sms';
  const deviceId = deviceIds[i % deviceIds.length];
  const sender = '+91' + (Math.floor(6000000000 + Math.random() * 4000000000)).toString();
  const msg = messages[Math.floor(Math.random() * messages.length)];
  const withLocation = Math.random() < 0.7;
  const location = withLocation ? `${(20 + Math.random() * 10).toFixed(6)},${(72 + Math.random() * 10).toFixed(6)}` : 'Disabled';

  const payload = {
    sender,
    message: msg,
    device: `TestPhone-${deviceId}`,
    deviceId,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24)).toISOString(),
    location,
    meta: { battery: `${20 + Math.floor(Math.random() * 80)}%`, simulated: true },
    type
  };

  try {
    const res = await axios.post(`${baseUrl}/log-sms`, payload, { timeout: 20000 });
    console.log(`[${i}] Sent -> ${payload.deviceId} ${payload.type} ${payload.location !== 'Disabled' ? '(with loc)' : ''} -> status ${res.status}`);
  } catch (err) {
    console.error(`[${i}] Error sending:`, err.message, err.response && err.response.data ? err.response.data : '');
  }
}

(async function() {
  console.log(`Sending ${count} dummy logs to ${baseUrl}`);
  for (let i = 0; i < count; i++) {
    // space out slightly
    // eslint-disable-next-line no-await-in-loop
    await sendOne(i);
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('Done sending dummy logs.');
})();
