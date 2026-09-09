# PS-I03 Coverage Matrix & Development Roadmap (Team India)

## 📊 Summary Status
- ✅ **Fully Done (7/14):** One-touch SOS, Live GPS, Share with Family, Police Stations, Hospitals, Incident Logging, ICCC Dashboard
- 🟡 **Partial / Working Prototype (5/14):** Voice SOS, Audio Distress Spike, Motion Jolt Sensor, Route Tracking & ETA, Internal ICCC Socket Gateway
- ❌ **Roadmap / Not Done (2/14):** Polygon Geofencing Unsafe Zones, IoT Wearable BLE Trigger

---

## 📋 Coverage Matrix

| Feature (Problem Statement) | Checked | Status | Our Implementation |
| :--- | :---: | :---: | :--- |
| **One-touch SOS button** | [x] | ✅ Done | Instant 1-tap emergency alert, WebSocket broadcast, and Twilio SMS dispatch. |
| **Live GPS location** | [x] | ✅ Done | Real-time latitude/longitude sharing with OpenStreetMap/Leaflet integration. |
| **Share location with family** | [x] | ✅ Done | Automated SMS alerts with Google Maps link + live alphanumeric share codes. |
| **Nearby police station** | [x] | ✅ Done | Nearest police station identification via MongoDB 2dsphere geospatial queries. |
| **Nearby hospital** | [x] | ✅ Done | Nearest hospital identification with distance and contact phone info. |
| **Incident logging** | [x] | ✅ Done | Full structured MongoDB records with multi-signal scores, operator notes & timestamps. |
| **ICCC analytics dashboard** | [x] | ✅ Done | Operator-gated control room (`/iccc`) with live incident stream, map pins, and dispatch buttons. |
| **Route tracking until help arrives** | [ ] | 🟡 Partial | Live location sharing & ETA active; continuous turn-by-turn rescue vehicle tracking can be improved. |
| **Voice-triggered SOS** | [ ] | 🟡 Partial | Working browser Web Speech API with 9 trigger phrases & 3s cancel countdown (`VoiceSOSListener.jsx`). |
| **AI threat detection (voice distress)** | [ ] | 🟡 Partial | Real-time Web Audio API decibel analyzer and distress spike detection (`AIThreatMonitor.jsx`). |
| **AI threat detection (abnormal movement)** | [ ] | 🟡 Partial | Accelerometer `DeviceMotionEvent` spike detection & multi-signal threat scoring (`AIThreatMonitor.jsx`). |
| **ICCC integration** | [ ] | 🟡 Partial | Internal Socket.IO `iccc_room` & REST API live; external government ERSS-112 gateway simulation. |
| **Geofencing for unsafe zones** | [ ] | ❌ Not Done | High-risk area polygon boundary alerts not implemented yet (Planned for next phase). |
| **IoT wearable trigger** | [ ] | ❌ Not Done | Smartwatch/BLE band hardware emergency trigger not integrated yet (Planned for next phase). |

---

## 🎯 Next Sprint Priorities
1. **Geofencing & Unsafe Zones:** Add polygon-based high-crime heatmaps / boundary enter alerts.
2. **Native Background Support:** Package Voice listener & Motion detection into background service (Capacitor / Android Service).
3. **IoT Wearable Trigger:** Connect standard BLE smartbands to trigger SOS via Web Bluetooth API.
