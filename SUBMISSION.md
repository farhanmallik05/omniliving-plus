# OmniLiving+: Devpost Hackathon Submission Package

> **Amazon Developer Hackathon 2026**  
> **Primary Track:** Alexa+ Track ($25,000 1st Place)  
> **Mini Challenges:** AWS Builder Mini Challenge • Open Source Mini Challenge  
> **Bonus Qualifications:** 5 Detailed Friction Logs (+10% Bonus) • Amazon Developer Product Feedback  
> **Repository:** [https://github.com/farhanmallik05/omniliving-plus](https://github.com/farhanmallik05/omniliving-plus)  

---

## 📋 Devpost Direct Form Fields

### 1. Project Name *(Devpost Form Field — Max 60 Chars)*
```text
OmniLiving+: Autonomous Living Room Copilot for Alexa+
```
*(Length: 53 / 60 characters)*

### 2. Elevator Pitch *(Devpost Form Field — Max 200 Chars)*
```text
OmniLiving+ unifies Alexa+, Ring, Fire TV & Bee wearables via MCP Streamable HTTP and AWS Bedrock vision into an autonomous ambient living room copilot and home guardian.
```
*(Length: 171 / 200 characters)*

### 3. Built With *(Up to 25 Tags — Copy & Paste)*
```text
alexa-plus, model-context-protocol, mcp, streamable-http, aws-bedrock, claude-3-5-sonnet, amazon-nova, react, typescript, node.js, ring, fire-tv, bee-wearable, sqlite, web-speech-api, json-rpc-2.0, tailwindcss, vite, sse, open-source
```

### 4. "Try It Out" Links
* **GitHub Repository & Full Source Code:** `https://github.com/farhanmallik05/omniliving-plus`
* **50-Frame Multimodal Vision Benchmark Report:** `https://github.com/farhanmallik05/omniliving-plus/blob/main/BENCHMARK_REPORT.md`
* **Amazon Developer Friction Logs (+10% Bonus):** `https://github.com/farhanmallik05/omniliving-plus/blob/main/FRICTION_LOGS.md`
* **Commercial Enterprise B2B Strategy & Pricing Models:** `https://github.com/farhanmallik05/omniliving-plus/blob/main/ENTERPRISE_B2B.md`

### 5. Media & Image Gallery *(3:2 Aspect Ratio, Ready to Upload)*
* **Thumbnail / Hero Image (3:2 Ratio):** [assets/screenshots/devpost_thumbnail.jpg](assets/screenshots/devpost_thumbnail.jpg) *(535 KB — Smart delivery with live Fire TV PiP inset, 5-step stepper, and Echo Show halo)*
* **Screenshot 1 — Living Room Eldercare:** [assets/screenshots/elderly_care_demo.jpg](assets/screenshots/elderly_care_demo.jpg) *(532 KB — Two-frame standstill CV detection, gentle Alexa check-in, and Bee Wearable vitals)*
* **Screenshot 2 — MCP Developer Console:** [assets/screenshots/mcp_developer_console.jpg](assets/screenshots/mcp_developer_console.jpg) *(537 KB — Real-time streaming JSON-RPC 2.0 tool logs, 336ms latency, and token metrics)*
* **Screenshot 3 — Baseline Living Room Ecosystem:** [assets/screenshots/living_room_ecosystem.jpg](assets/screenshots/living_room_ecosystem.jpg) *(498 KB — Pristine living room cockpit before ambient events)*

### 6. Video Demo Link *(Embedded at Top of Project Page)*
```text
https://youtu.be/omniliving-plus-demo
```
*(Timed 3-minute chapter breakdown provided in Section 3 below)*

---

## 📖 About the Project (Full Devpost Markdown Story with LaTeX)

### 💡 Inspiration: The Fragmented Smart Home

Today's smart homes suffer from **siloed intelligence**:
* Your **Ring doorbell** spots motion on the porch, but has zero semantic context on what is happening.
* Your **Fire TV** blares movie audio in the living room, oblivious to visitors or home safety alerts.
* Your **Bee wearable** tracks vital signs, completely disconnected from the room environment.
* **Alexa** waits passively on the counter for manual trigger phrases.

When Amazon announced the Developer Hackathon uniting **Alexa+, Fire TV, Ring, and Bee** for the first time, we asked:  
*What if Alexa+ could autonomously orchestrate all of these devices into a single, cohesive living room copilot?*

By decoupling device silos with the open **Model Context Protocol (MCP spec 2025-11-25+)** over **Streamable HTTP** and pairing it with **AWS Bedrock multimodal vision**, we built **OmniLiving+** — an intelligent ambient bridge that enables Alexa+ to actively sense, reason, and act across the entire home.

---

### 🌟 What It Does

OmniLiving+ transforms fragmented devices into an integrated living room and security experience across three core domains:

#### 1. Context-Aware Doorstep Delivery (Ring + Fire TV + Alexa+)
When motion is detected at the front door while you are watching Fire TV:
1. **Ring Snapshot:** Ring doorbell captures a high-resolution camera frame.
2. **Bedrock Multimodal Reasoning:** AWS Bedrock (Claude 3.5 Sonnet / Amazon Nova) analyzes the frame in real time.
3. **Acoustic Audio Ducking:** Fire TV automatically ducks media audio to \( 15\% \) so you never miss an alert.
4. **1080p Picture-in-Picture Inset:** Displays a subtle, non-disruptive live camera overlay in the upper-right corner with courier bounding box and carrier badge (*"Amazon Prime Delivery"*).
5. **Spoken Chime:** Alexa+ delivers a concise announcement (*"Amazon Prime courier delivered your package at the porch"*), then smoothly restores Fire TV media volume.

#### 2. Proactive Family Care & Elderly Safety (Ring + Bee Wearable + Alexa+)
Unwitnessed falls on stairs and porches are a critical hazard:
* If a senior resident remains stationary on the porch stairs for over 45 seconds, our **Two-Frame Temporal Verification** logic flags a standstill anomaly.
* Alexa+ proactively speaks a gentle, non-alarmist check-in inquiry (*"Are you feeling alright, Eleanor? Would you like me to notify family?"*).
* Simultaneously, OmniLiving+ pulses a tactile haptic vibration alert on the resident's **Bee wearable** and synchronizes resting heart rate vitals (\( 72\,\text{BPM} \)) with the living room care console.

#### 3. Perimeter Threat Hardening (Ring + Smart Deadbolt + Floodlights)
If an unidentified individual lingers after dark without approaching the doorbell:
* AWS Bedrock classifies the scene as a perimeter threat (\( \text{Confidence} \ge 96.0\% \)).
* OmniLiving+ dispatches an emergency MCP tool call: automatically locks the front deadbolt, elevates porch floodlights to \( 100\% \), and displays a security inset on the living room screen.

---

### 🏗️ How We Built It

```
                                +-----------------------------+
                                |     Alexa+ Conversational   |
                                |         Intelligence        |
                                +--------------+--------------+
                                               |
                               Streamable HTTP / SSE (2025-11-25)
                                               |
                                               v
+--------------------------------------------------------------------------------------------+
|                             OmniLiving+ Self-Hosted MCP Server                             |
|                                                                                            |
|  +--------------------+  +--------------------+  +------------------+  +----------------+  |
|  | ring_inspect_      |  | bedrock_analyze_   |  | firetv_push_     |  | bee_sync_      |  |
|  | doorstep           |  | scene              |  | overlay          |  | vitals         |  |
|  +---------+----------+  +---------+----------+  +--------+---------+  +-------+--------+  |
+------------|-----------------------|----------------------|--------------------|-----------+
             |                       |                      |                    |
             v                       v                      v                    v
     [Ring Smart Doorbell]   [AWS Bedrock Runtime]   [Fire TV Screen]     [Bee Wearable AI]
     (Camera & Intercom)    (Claude 3.5 / Nova CV)   (Video & Live PiP)   (Vitals & Haptics)
```

1. **Self-Hosted MCP Server (Spec 2025-11-25+ Streamable HTTP):**
   * Built in Node.js and TypeScript, exposing JSON-RPC 2.0 endpoints on `POST /mcp` and real-time Server-Sent Events on `GET /sse`.
   * Implements 11 tools, live resources (`system://devices/status`, `system://logs/events`), and prompt templates with OpenTelemetry tracing headers.
2. **AWS Bedrock Multimodal Vision Engine (AWS Builder Track):**
   * Target Foundation Models: Anthropic Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and Amazon Nova.
   * **Dual-Engine Architecture:** Runs against live AWS Bedrock when credentials are configured, and seamlessly activates a high-fidelity smart simulation fallback when credentials are absent — ensuring hackathon evaluators encounter **zero runtime failure**.
   * **Structural Motion Pre-Filter:** Discards ambient noise (wind, headlights) before invoking multimodal models when pixel delta is below threshold:
     $$\Delta_{\text{motion}} < 20\% \implies \text{Filter Suppresses Token Spend}$$
3. **Simulated Alexa+ Multimodal Living Room Web App:**
   * Built with React 19, TypeScript, and Vite.
   * Features glowing animated Alexa Halo reflecting listening/thinking/speaking states, real browser speech recognition and synthesis via the Web Speech API, live Ring camera canvas, and 4K Fire TV player with animated PiP insets.
4. **Physical Hardware 1:1 Mapping:**
   * Ring: Integrates live webhooks with HMAC-SHA256 signature verification (`POST /api/ring/webhook`).
   * Fire TV: Companion Silk Browser page (`/firetv/display`) and SSE overlay stream.
   * Bee Wearable: Standard Web Bluetooth API GATT services (Heart Rate `0x180D`, Haptic `0xFFE1`).

---

### 📊 Multimodal Vision Benchmark & Mathematical Evidence

To validate our computer vision pipeline with scientific rigor, we built a 50-frame ground-truth labeled benchmark dataset (`data/benchmark-frames/`) and a reproducible evaluation script (`npm run benchmark`):

| Evaluation Metric | Measured Score | Standard |
|---|:---:|:---:|
| **Overall Accuracy** | **94.0%** (47 / 50 frames) | \( \ge 90\% \) |
| **Precision** | **93.3%** | \( \ge 90\% \) |
| **Recall (Sensitivity)** | **96.6%** (Zero critical safety misses) | \( \ge 92\% \) |
| **F1 Score** | **94.9%** | \( \ge 90\% \) |
| **Mean Inference Latency** | \( \mu = 336\,\text{ms} \) | \( < 500\,\text{ms} \) |
| **P95 Latency** | \( P_{95} = 494\,\text{ms} \) | \( < 800\,\text{ms} \) |
| **Pre-Filter Token Savings** | \( \sim 11,200\,\text{tokens} \) | Significant ROI |

#### Confusion Matrix & F1 Formulation
$$
\begin{pmatrix}
\text{TP} = 28 & \text{FP} = 2 \\
\text{FN} = 1 & \text{TN} = 19
\end{pmatrix} \quad \implies \quad F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}} = 94.9\%
$$

---

### 🛑 Challenges We Ran Into

1. **MCP Streamable HTTP Specification Transition:** Migrating from legacy stdio MCP transports to the latest Streamable HTTP specification (Nov 2025) required implementing custom Server-Sent Events session tracking, defensive CORS whitelisting, and strict JSON-RPC 2.0 schema response compliance.
2. **Audio Collision & Acoustic Ducking:** Early iterations experienced jarring overlap when Alexa spoke while Fire TV media played. We calibrated an audio ducking ramp that lowers media volume to \( 15\% \) within 200ms before spoken voice synthesis begins.
3. **Zero-Friction Evaluator Experience:** We wanted hackathon judges on any OS (Windows, Mac, Linux) to test 100% of the cross-device experience in seconds without needing physical hardware or AWS billing setup. We designed a self-healing Pre-Flight Doctor (`npm run doctor`) and Dual-Engine AI runtime to achieve zero-friction onboarding.

---

### 🏆 Accomplishments We're Proud Of

* **True Ecosystem Synergy:** The first project that connects Alexa+, Ring, Fire TV, Bee, and AWS Bedrock into one harmonious ambient workflow.
* **100% Verifiable Tests:** 16 automated integration tests (`npm run test:mcp`) + 15 unit tests (`npm run test:unit`) + 6 frontend component tests passing with zero failures.
* **Judge Auto-Pilot (90s Guided Tour):** Evaluators can press `[A]` on their keyboard to watch all 3 scenarios run hands-free with timestamped narration overlays.
* **Pre-Flight Doctor (`npm run doctor`):** Instant verification of Node version, ports 3001 and 5173, dependencies, and dataset integrity before boot.
* **Comprehensive Documentation:** Full friction logs (+10% bonus), developer product feedback, commercial enterprise B2B pricing model, and physical hardware setup guides.

---

### 📚 What We Learned

* **The Power of MCP:** Rather than locking devices into proprietary skill silos, the Model Context Protocol allows AI agents like Alexa+ to dynamically discover, inspect, and invoke ambient tools across heterogeneous hardware.
* **Ambient Intelligence Over Notification Spam:** Smart homes shouldn't just send loud notifications. By fusing vision reasoning with situational context (e.g., watching a movie vs sleeping), home automation becomes subtle, respectful, and genuinely helpful.

---

### 🔮 What's Next for OmniLiving+

* **Official Vega OS Fire TV App:** Porting the companion display into a native React Native / Vega OS background service.
* **Physical Bee Wearable Bluetooth Bridge:** Publishing a Web Bluetooth daemon for zero-touch pairing with physical Bee smart rings and bands.
* **Multi-Tenant Senior Care Deployment:** Deploying our HIPAA-compliant, zero-video-retention ambient fall detection system across commercial assisted living facilities.

---

## 🎬 3-Minute Demo Video Walkthrough Script

| Timestamp | Chapter | What Judges See & Hear |
|---|---|---|
| **0:00 - 0:35** | **The Fragmented Smart Home** | Demonstrates the problem: Ring chimes in isolation while Fire TV blares movie audio and Alexa waits passively. |
| **0:35 - 1:15** | **MCP Architecture & Voice Agent** | Live MCP server on port 3001 and simulated Echo Show on port 5173. Evaluator speaks: *"Alexa, inspect the front porch"* — Alexa halo pulses cyan, tool executes in stream inspector, and spoken status returns out loud. |
| **1:15 - 1:55** | **Context-Aware Doorstep Delivery** | Click **"Smart Package Delivery"** (key `1`). Ring motion triggers -> AWS Bedrock CV identifies Prime courier -> Fire TV automatically ducks audio and pops up 1080p PiP inset -> Alexa chimes package confirmation. |
| **1:55 - 2:35** | **Elderly Care & Wearable Telemetry** | Click **"Elderly Care Anomaly"** (key `2`). Prolonged standstill near porch stairs triggers two-frame temporal verification -> Alexa initiates gentle spoken check-in -> Bee wearable pulses tactile haptic vibration. |
| **2:35 - 3:00** | **Protocol Inspector & Open Source** | Live inspection of JSON-RPC 2.0 packets over Streamable HTTP (`/mcp` and `/sse`), 50-frame benchmark report (94.0% F1), and thank you to the Amazon Developer team! |
