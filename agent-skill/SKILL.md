---
name: omniliving-alexa-skill
description: Autonomous Multimodal Living Room & Ambient Security Copilot for Alexa+. Connects Ring smart doorbells, Fire TV living room entertainment, Bee wearables, and AWS Bedrock multimodal vision via Model Context Protocol (MCP 2025-11-25+ Streamable HTTP).
version: 1.0.0
author: OmniLiving+ Team
license: MIT
transport:
  type: streamable-http
  endpoint: http://localhost:3001/mcp
  protocol_version: "2025-11-25"
---

# OmniLiving+ Alexa+ Agent Skill

## Overview
The `omniliving-alexa-skill` empowers Alexa+ conversational agents to autonomously sense, reason, and act across the entire Amazon smart device ecosystem. By binding to a self-hosted Streamable HTTP MCP Server, Alexa+ gains real-time tools for doorstep visual inspection, Fire TV living room media coordination, Bee wearable health telemetry, and cloud AI reasoning powered by Amazon Bedrock.

```
+-------------------------------------------------------------+
|                          Alexa+                             |
|               (Conversational Intelligence)                 |
+------------------------------+------------------------------+
                               |
                   Streamable HTTP (2025-11-25)
                               |
                               v
+-------------------------------------------------------------+
|                   OmniLiving+ MCP Server                    |
+--------------+---------------+--------------+---------------+
| Ring Inspect | FireTV Overlay| Bee Vitals   | AWS Bedrock   |
| Doorstep     | & Media Pause | Telemetry    | Vision Reason |
+--------------+---------------+--------------+---------------+
```

## Available Tools

### 1. `ring_inspect_doorstep`
Inspects front door camera snapshots, motion sensor state, and door chime events.
- **Parameters:**
  - `zone`: `'porch' | 'walkway' | 'driveway'` (optional)
  - `enableIntercom`: `boolean` (optional, opens two-way voice intercom)
- **When to use:** When doorbell chimes, motion is detected, or the user asks "Who is at the front door?"

### 2. `bedrock_analyze_scene`
Invokes AWS Bedrock (Anthropic Claude 3.5 Sonnet / Amazon Nova) for deep multimodal scene understanding.
- **Parameters:**
  - `scenarioContext`: string description of trigger context (e.g., `"delivery"`, `"elderly care"`, `"night security"`)
  - `imageBase64`: string (optional base64 image data)
  - `modelId`: string (defaults to `anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **When to use:** When camera snapshots require semantic identification of delivery drivers, packages, visitor intent, or safety anomalies.

### 3. `firetv_push_overlay`
Controls the living room Fire TV screen, displaying Picture-in-Picture (PiP) camera feeds, alerts, and managing playback ducking.
- **Parameters:**
  - `message`: string (required headline/alert message)
  - `enablePictureInPicture`: `boolean` (displays top-right live camera feed)
  - `pauseMedia`: `boolean` (pauses Prime Video/active media)
  - `durationSeconds`: `number` (time before banner auto-dismisses)
- **When to use:** When household members are watching Fire TV and a high-priority ambient event occurs at the door or home.

### 4. `bee_sync_vitals`
Synchronizes user proximity and physiological vitals from wearable AI devices.
- **Parameters:**
  - `triggerHaptic`: `boolean` (sends tactile vibration alert)
- **When to use:** For personal check-ins, focus mode awareness, or elderly health monitoring.

### 5. `alexa_dispatch_ambient_action`
Dispatches proactive voice speech, smart lock deadbolt commands, and smart illumination.
- **Parameters:**
  - `spokenAnnouncement`: string (the speech phrase Alexa+ will speak)
  - `smartLockAction`: `'lock' | 'unlock' | 'keep_state'`
  - `porchLightBrightness`: `number` (0 to 100)
- **When to use:** To announce courier arrivals, warn about suspicious perimeter activity, or confirm deadbolt security.

### 6. `omniliving_orchestrate_scenario`
Executes pre-coordinated cross-device automation flows.
- **Parameters:**
  - `scenario`: `'package_delivery' | 'elderly_care_safety' | 'night_security_alert' | 'movie_night_intercom'`

### 7. `automation_list_rules`
Lists all dynamic user-defined WHEN -> IF -> THEN cross-device triggers stored in SQLite.
- **Parameters:** None
- **When to use:** When Alexa+ needs to inspect active automation policies or explain home behavior.

### 8. `automation_create_rule`
Dynamically creates a new cross-device rule at runtime via natural language intent.
- **Parameters:**
  - `name`: string (human-readable rule title)
  - `triggerDevice`: `'ring' | 'firetv' | 'bee' | 'bedrock' | 'lock'`
  - `triggerEvent`: string (e.g. `'doorbell_press'`, `'motion_detected'`, `'fall_detected'`, `'tamper'`)
  - `condition`: string (optional conditional filter expression)
  - `actionDevice`: `'firetv' | 'alexa' | 'bee' | 'lock' | 'porch_light'`
  - `actionPayload`: object containing device action commands
- **When to use:** When the user commands: *"Alexa, whenever motion is detected at night, lock the deadbolt and flash the porch light."*

### 9. `automation_toggle_rule`
Enables or disables an existing automation rule.
- **Parameters:**
  - `ruleId`: string
  - `enabled`: boolean

### 10. `automation_delete_rule`
Permanently deletes a custom automation trigger.
- **Parameters:**
  - `ruleId`: string

### 11. `automation_test_rule`
Simulates firing a rule's trigger to preview execution actions without hardware side-effects.
- **Parameters:**
  - `ruleId`: string

## AI Safety & Edge Resilience Architecture
- **2-Frame Temporal Verification:** Bedrock vision prevents false panic alarms (shadows, shoe-tying) by requiring consecutive positive detection frames spaced 15s apart for high-urgency alarms.
- **Structural Motion Pre-Filter:** Discards minor pixel noise and natural foliage swaying (<20% delta) before dispatching to AWS Bedrock, saving ~75% API token cost.
- **Acoustic Ducking Sync:** Audio playback ducking awaits Fire TV playback state change confirmation (with 120ms buffer) before Alexa voice synthesis fires, eliminating voice clash.
- **Persistent SQLite Audit:** All device events, benchmark runs, and automation rules persist across server reboots.

## Proactive Trigger Rules
1. **Doorbell Rings during Media Playback:**
   - Call `firetv_push_overlay` with `enablePictureInPicture: true` and `pauseMedia: true`.
   - Call `bedrock_analyze_scene` to identify visitor.
   - Alexa+ announces: *"Someone is at the front door. Displaying camera on Fire TV."*
2. **Delivery Driver Drops Package:**
   - Bedrock detects package courier.
   - Fire TV displays non-intrusive banner toast without pausing media.
   - Alexa+ sounds subtle chime: *"Amazon Prime delivered a package at the porch."*
3. **Elderly Care Anomaly:**
   - Bedrock detects prolonged standstill or instability near steps.
   - Alexa+ softly initiates gentle inquiry: *"Are you alright? Would you like me to call family?"*
   - Pulse Bee wearable haptic feedback.
