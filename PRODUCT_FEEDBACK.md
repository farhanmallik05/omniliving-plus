# Amazon Developer Product Feedback

This document provides structured product feedback for the engineering and developer relations teams behind **Alexa+**, **Amazon Devices Builder Tools**, **Ring APIs**, **Fire TV (Vega OS)**, and **AWS Bedrock**.

---

## 1. Amazon Devices Builder Tools & MCP Server Integration

### What We Used It For
We used the Amazon Devices Builder Tools specifications to develop a self-hosted Model Context Protocol (MCP) server running on the **2025-11-25 Streamable HTTP transport** specification, registering ambient device tools and companion Agent Skills for Alexa+.

### What Worked Well
* **Embracing MCP as an Open Standard:** Standardizing Alexa+ on the Model Context Protocol is an absolute game-changer. It eliminates the friction of proprietary skill adapters and allows developers to expose tools via standard JSON Schema.
* **Streamable HTTP Specification:** The shift towards HTTP + Server-Sent Events (SSE) enables web applications, cloud runtimes, and local daemons to communicate with Alexa+ without maintaining complex raw TCP or stdio pipelines.

### What Needs Work
* **Clarifying Streamable HTTP Session Headers:** The specification around `Mcp-Session-Id` and SSE reconnection semantics during network dropouts needs clearer reference implementations. We had to write custom session tracking logic to ensure stateful streams remained persistent.
* **Local Simulation Harness:** Providing an official local test runner or CLI (e.g. `alexa-mcp test --endpoint http://localhost:3001/mcp`) that sends simulated Alexa+ conversational payloads would significantly accelerate developer iteration.

### Onboarding Experience
Overall rating: **8.5 / 10**. The documentation on Devpost and the developer portal provided clear high-level direction, though deeper code examples for Streamable HTTP transports in Node.js/TypeScript would be beneficial.

### Would We Build With It Again?
**Yes, absolutely.** MCP is the future of conversational agents and ambient device integration.

---

## 2. AWS Bedrock Runtime SDK (`@aws-sdk/client-bedrock-runtime`)

### What We Used It For
We integrated Amazon Bedrock using the `@aws-sdk/client-bedrock-runtime` npm package to run multimodal computer vision analysis on doorstep camera frames using **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and **Amazon Nova**. The model detects courier uniforms, package presence, visitor intent, and resident safety anomalies.

### What Worked Well
* **Incredible Vision Reasoning:** Claude 3.5 Sonnet and Amazon Nova handled complex low-light porch scenes, courier badges, and subtle posture anomalies with over 95% confidence.
* **SDK Ergonomics:** The `InvokeModelCommand` pattern is clean, reliable, and integrates naturally into modern TypeScript async/await codebases.

### What Needs Work
* **Model Payload Schema Variance:** Bedrock models (Anthropic vs. Amazon Titan vs. Meta Llama) each use different request and response JSON schemas. Having a unified multimodal wrapper in the AWS SDK would reduce boilerplate when switching foundation models.
* **Streaming Image Frame Inputs:** For real-time doorbell streams (e.g. 5–10 FPS), making individual `InvokeModel` requests has slight latency overhead (~400ms). A streaming visual session API on Bedrock would unlock true real-time video understanding.

### Onboarding Experience
Overall rating: **9 / 10**. Bedrock's API keys, IAM integration, and region availability were straightforward to configure.

### Would We Build With It Again?
**Yes, definitely.** Bedrock is our preferred foundation model runtime for production enterprise applications.

---

## 3. Ring APIs & Doorbell Integration

### What We Used It For
Simulating and inspecting Ring Pro doorbell feeds, motion zones (`porch`, `walkway`, `driveway`), visitor presence, chime events, and two-way voice intercom channels.

### What Worked Well
* Clear event lifecycle: Motion detection -> Ring chime -> Intercom open -> Event recorded.
* Clean separation of camera snapshot URIs and real-time audio streams.

### What Needs Work
* **Local Development Sandbox:** Ring currently requires registered developer accounts and cloud endpoints. Having an official Ring Device Simulator Docker image or mock server for local hackathon testing would make building Ring experiences even faster.

---

## 4. Fire TV & Vega OS Media Coordination

### What We Used It For
Coordinating living room media playback, displaying Picture-in-Picture (PiP) Ring video insets during incoming doorbells, auto-pausing media, and displaying ambient toast banners.

### What Worked Well
* The Picture-in-Picture interaction pattern is natural and non-disruptive for living room entertainment.
* Multi-platform web technology support makes building TV UI overlays straightforward.

### What Needs Work
* Documenting the exact focus management protocol for Vega OS vs. Android TV when an incoming high-priority system overlay appears.

---

## 5. Feature Requests & Urgency

| Feature Request | Description | Urgency |
| :--- | :--- | :--- |
| **Official Alexa+ MCP Local CLI** | A lightweight CLI tool that validates self-hosted MCP endpoints against Alexa+ protocol compliance before deployment. | **Critical** |
| **Unified Bedrock Multimodal Vision Client** | Standardized request/response abstraction across Claude, Nova, and Titan models in the AWS SDK. | **Important** |
| **Official Ring Mock Device Daemon** | Standalone mock device daemon for local testing without physical Ring hardware or credentials. | **Important** |
| **WebRTC PiP Bridge for Fire TV** | Native Vega OS SDK component for sub-200ms WebRTC live camera streams on Fire TV screens. | **Nice-to-have** |
| **Bee Wearable Web Bluetooth Simulator** | Browser-based emulator for testing Bee Wearable haptics and vitals via standard Web Bluetooth. | **Nice-to-have** |
