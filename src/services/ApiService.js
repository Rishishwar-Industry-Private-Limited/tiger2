// Last mein '/' lagana zaruri hai
const API_URL = 'https://tiger2-1.onrender.com/'; 

export const sendDataToServer = async (endpoint, payload) => {
  try {
    // Agar endpoint '/log-sms' hai, toh ye 'https://tiger-bridge.onrender.com/log-sms' banayega
    const targetUrl = `${API_URL}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

    console.log(`[ApiService] Sending POST to: ${targetUrl}`);
    console.log(`[ApiService] Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString() // Server ko pata chale message kab ka hai
      }),
    });

    console.log(`[ApiService] Response Status: ${response.status}`);
    console.log(`[ApiService] Response Headers:`, response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ApiService] HTTP Error ${response.status}: ${errorText}`);
      throw new Error(`HTTP Error! Status: ${response.status}, Body: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[ApiService] Success Response:`, result);
    return result;
  } catch (error) {
    console.error("[ApiService] Tiger Bridge Error:", error.message);
    console.error("[ApiService] Full Error:", error);
    // Handle common issues
    if (error.message.includes('Network request failed')) {
      console.warn("[ApiService] Possible issues: HTTPS required, cleartext traffic blocked, wrong URL, CORS, or server down.");
    }
    if (error.message.includes('Cleartext HTTP traffic')) {
      console.warn("[ApiService] Android cleartext traffic blocked. Add android:usesCleartextTraffic='true' to AndroidManifest.xml for HTTP, or use HTTPS.");
    }
    return null;
  }
};
