# OmniLiving+: Live Physical Hardware Integration Guide 🔌

This guide provides step-by-step instructions for pairing **OmniLiving+** with physical hardware devices:
1. **Ring Smart Doorbell Pro / Battery Video Doorbell**
2. **Amazon Fire TV Stick 4K Max / Fire TV Omni Series (Vega OS & Android TV)**
3. **Echo Show 15 / 21 Smart Displays**

---

## 1. Physical Ring Doorbell Setup

OmniLiving+ supports two live modes for physical Ring doorbells:
1. **Cloud Webhook / Ring API Mode** (via Ring Developer Portal / Homebridge Ring Plugin)
2. **Local RTSP / WebRTC Stream Mode** (sub-200ms latency)

### Step 1.1: Webhook Configuration
Configure your Ring event dispatcher to send motion and doorbell chime alerts to the OmniLiving+ MCP Server:

* **Endpoint:** `POST http://<HOST_IP>:3001/api/ring/webhook`
* **Headers:** `Content-Type: application/json`
* **Sample Payload:**
  ```json
  {
    "event_type": "ding",
    "doorbot_id": "ring_front_entrance_pro",
    "doorbot_description": "Front Door",
    "snapshot_url": "https://api.ring.com/v1/snapshots/latest.jpg"
  }
  ```

### Step 1.2: Verify Webhook Reception
Trigger motion on your physical Ring doorbell. The MCP Server console will output:
```log
[Ring] Received live Ring webhook event: ding
[Ring] Ring state updated: ringing
[Fire TV] Pushing live Picture-in-Picture overlay to connected screens...
[Alexa+] Alexa announced: "Someone just rang the front doorbell..."
```

---

## 2. Physical Fire TV Living Room Screen Setup

OmniLiving+ streams real-time Picture-in-Picture (PiP) and media pause commands over local HTTP Server-Sent Events (SSE) to any physical Fire TV device on your Wi-Fi network.

### Option A: Silk Browser Display (Zero-Install)
1. Turn on your Amazon Fire TV Stick or Smart TV.
2. Open the built-in **Amazon Silk Web Browser**.
3. Navigate to: `http://<YOUR_COMPUTER_LOCAL_IP>:3001/firetv/display`
4. The screen will display: `OmniLiving+ Fire TV Companion Connected`.
5. Trigger any doorbell scenario in the OmniLiving+ web app. Your television will instantly display the top-right Picture-in-Picture camera inset and auto-dismiss after the event!

### Option B: Sideloaded WebView / Android TV Companion App
For continuous background overlays while playing native Prime Video, Netflix, or YouTube:
1. Enable **Developer Options** and **ADB Debugging** on your Fire TV.
2. Install the lightweight overlay receiver APK (`scripts/firetv-overlay-receiver.apk` or Android WebView wrapper).
3. Set the target server URL to: `http://<YOUR_COMPUTER_LOCAL_IP>:3001/api/firetv/overlay-stream`.
4. The app uses Android's native `SYSTEM_ALERT_WINDOW` permission to float the Ring video inset over any active TV broadcast or media playback.

---

## 3. Physical Amazon Echo Show & Alexa+ Skill Setup

To bind your physical Echo Show device to OmniLiving+:
1. Log in to the [Amazon Developer Console](https://developer.amazon.com/alexa).
2. Create a new skill using the manifest in `agent-skill/skill-manifest.json`.
3. In Skill Configuration, choose **Custom Streamable HTTP Transport**:
   * **Endpoint URL:** `https://<YOUR_PUBLIC_TUNNEL_OR_DOMAIN>/mcp`
   * **Protocol Version:** `2025-11-25`
4. Enable the skill on your developer Amazon account.
5. Say to your Echo Show: *"Alexa, ask OmniLiving to check the front door."*
6. Your Echo Show will query the running MCP server and speak the live status out loud!

---

---

## 4. Physical Bee Wearable AI & Web Bluetooth (BLE) Setup 🐝

OmniLiving+ integrates with wearable AI sensors (like Bee Wearable, Amazon Halo, or standard Bluetooth Low Energy health monitors) using standard **GATT Bluetooth Profiles**:

```
[Physical Bee Wearable] 
       | (BLE GATT 2.4 GHz)
       v
[Web Bluetooth API (Chrome / Edge / Silk)] 
       | (JSON-RPC over Streamable HTTP)
       v
[OmniLiving+ MCP Server] ---> [Tool: bee_sync_vitals]
```

### Supported Bluetooth GATT Services & Characteristics
* **Standard Heart Rate Service:** UUID `0x180D`
  * *Measurement Characteristic:* UUID `0x2A37` (Notifies heart rate BPM in real-time)
* **Standard Battery Service:** UUID `0x180F`
  * *Battery Level Characteristic:* UUID `0x2A19` (0–100% capacity)
* **OmniLiving+ Haptic Actuator Service:** Custom UUID `0000ffe0-0000-1000-8000-00805f9b34fb`
  * *Haptic Trigger Characteristic:* UUID `0000ffe1-0000-1000-8000-00805f9b34fb` (Accepts byte array `[0x01]` to pulse tactile motor)

### Pairing Instructions:
1. Ensure Bluetooth is enabled on your host computer or Android TV device.
2. Put your Bee Wearable into pairing mode (holding touch surface for 3 seconds until blue LED pulses).
3. In Chrome or Edge, navigate to `http://localhost:5173`.
4. In the Bee Wearable card, clicking **"Sync Vitals"** or pairing initiates `navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })`.
5. Once paired, live heart rate telemetry and haptic alerts communicate directly with the MCP Server via tool `bee_sync_vitals`.

---

## 5. Local Network Port Mapping Reference

| Port | Service | Protocol | Description |
|---|---|---|---|
| `3001` | OmniLiving+ MCP Server | HTTP / SSE / JSON-RPC 2.0 | Core tool runner, REST endpoints, TV overlay stream |
| `5173` | Web Simulator & UI | HTTP / React 19 | Living room dashboard, Echo Show simulator, Automation Builder |
| `3001/firetv/display` | Silk Browser Overlay | HTML / EventSource | Zero-install living room TV companion display |
| `3001/health` | Health Check Endpoint | HTTP / JSON | Status, client counts, database health |
