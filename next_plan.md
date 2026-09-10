# PS-I03 Coverage Matrix & Development Roadmap (Team India)

## 📊 Summary Status
- ✅ **Fully Done (7/14):** One-touch SOS, Live GPS, Share with Family, Police Stations, Hospitals, Incident Logging, ICCC Dashboard
- 🟡 **Partial / Working Prototype (5/14):** Voice SOS, Audio Distress Spike, Motion Jolt Sensor, Route Tracking & ETA, Internal ICCC Socket Gateway
- ❌ **Roadmap / Not Done (2/14):** Polygon Geofencing Unsafe Zones, IoT Wearable BLE Trigger

---

## 📋 Coverage Matrix (with AI Check & Human Check)

| Feature (Problem Statement) | AI Check | Human Check | Status | Our Implementation |
| :--- | :---: | :---: | :---: | :--- |
| **One-touch SOS button** | [x] | [x] | ✅ Done | Instant emergency alert with one tap (Added: WebSocket live broadcast & Twilio SMS auto-dispatch) |
| **Live GPS location** | [x] | [x] | ✅ Done | Real-time latitude/longitude sharing (Added: Leaflet/OpenStreetMap mapping integration) |
| **Share location with family** | [x] | [x] | ✅ Done | Auto notification to emergency contacts (Added: Twilio SMS with Google Maps link & live alphanumeric share codes) |
| **Nearby police station** | [x] | [x] | ✅ Done | Nearest police station identification (Added: MongoDB 2dsphere geospatial distance query) |
| **Nearby hospital** | [x] | [x] | ✅ Done | Nearest hospital identification (Added: Distance calculation and direct call support) |
| **Route tracking until help arrives** | [x] | [x] | 🟡 Partial | Live location available; continuous rescue tracking can be improved (Added: Share session ETA countdown active; rescuer vehicle live route polyline in progress) |
| **Voice-triggered SOS** | [x] | [x] | 🟡 Partial *(Changed from ❌ Not Done)* | (Old: "No hands-free emergency activation yet" ➔ New: Implemented in `VoiceSOSListener.jsx` using Web Speech API with 9 trigger phrases & 3-sec safety cancel countdown. Native background service for locked phone in progress.) |
| **AI threat detection (voice distress)** | [x] | [x] | 🟡 Hybrid partial | Local Web Audio volume + voice-band spike scoring works offline. When online and a local warning occurs, a short in-memory clip is sent through the backend to Hugging Face ASR followed by text classification; local and AI scores are fused without reducing the local safety score. Requires `HF_API_TOKEN`. |
| **AI threat detection (abnormal movement)** | [x] | [x] | 🟡 Hybrid partial | Local DeviceMotion acceleration and gyroscope jolt scoring works offline. When online and a local warning occurs, a 10-second six-axis sensor window is sent to the optional FastAPI HAR service and fused with the local score. Requires a calibrated ONNX HAR model and the `har_service` process. |
| **ICCC integration** | [x] | [x] | 🟡 Partial *(Changed from ❌ Not Done)* | (Old: "Alerts are not sent directly to ICCC systems" ➔ New: Internal Socket.IO `iccc_room` live alert broadcast & REST endpoints `/api/sos/iccc/*` are functional. Official Govt ERSS-112 gateway pending.) |
| **Incident logging** | [x] | [x] | ✅ Done *(Changed from 🟡 Partial)* | (Old: "Basic SOS history possible; structured incident records needed" ➔ New: Fully structured MongoDB `SosAlert` schema storing GPS coordinates, AI threat signal breakdown, operator notes, SMS counts & resolution timestamps.) |
| **ICCC analytics dashboard** | [x] | [x] | ✅ Done *(Changed from ❌ Not Done)* | (Old: "No dashboard for authorities/command center" ➔ New: Fully built authority portal in `ICCCDashboard.jsx` at `/iccc` with operator passcodes, live incident stream, map pins & 1-tap dispatch actions.) |
| **Geofencing for unsafe zones** | [x] | [x] | ❌ Not Done | (Status Unchanged: High-risk red-zone polygon boundary enter/exit alerts not implemented yet. Scheduled for Next Sprint.) |
| **IoT wearable trigger** | [x] | [x] | ❌ Not Done | (Status Unchanged: Smartwatch/BLE band hardware emergency trigger not integrated yet. Scheduled for Next Sprint.) |

---

## 🎯 Next Sprint Priorities
1. **Geofencing & Unsafe Zones:** Add polygon-based high-crime heatmaps / boundary enter alerts.
2. **Native Background Support:** Package Voice listener & Motion detection into background service (Capacitor / Android Service).
3. **IoT Wearable Trigger:** Connect standard BLE smartbands to trigger SOS via Web Bluetooth API.
