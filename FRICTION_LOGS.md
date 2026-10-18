# Friction Logs: Amazon Developer Ecosystem

> **Note for Hackathon Judges:** This document contains structured Friction Log entries as requested in the submission guidelines to qualify for the **+10% Judging Bonus**. Each log follows the strict required schema: *Task Attempted, Steps Taken, Expected vs. What Happened, Severity Rating, Workaround Used, and Actionable Suggestion*.

---

## Friction Log 1: Streamable HTTP Transport Handshake & Session Management in MCP Spec 2025-11-25

* **Task Attempted:** Implement a standards-compliant Streamable HTTP MCP Server supporting concurrent Server-Sent Events (SSE) streaming and stateful JSON-RPC 2.0 requests for Alexa+.
* **Steps Taken:**
  1. Configured an Express/Node.js server listening on `/mcp` and `/sse`.
  2. Implemented the standard MCP `initialize` handshake returning capabilities and server metadata.
  3. Attempted to maintain stateful connection context between incoming POST `/mcp` tool execution calls and active SSE event streams.
* **What We Expected:** The specification would clearly prescribe how session identifiers (e.g. `Mcp-Session-Id`) are exchanged during initial SSE connection and mapped to subsequent POST requests, including client disconnect event handling.
* **What Actually Happened:** The 2025-11-25 specification focuses heavily on the message structure but leaves HTTP header conventions for session persistence loosely specified. Different MCP client libraries handle SSE reconnection and session headers inconsistently.
* **Severity Rating:** **Major**
* **Workaround Used:** Built a custom session registry in `mcp-server/src/index.ts` using `randomUUID()`, attaching `Mcp-Session-Id` in both request and response headers and broadcasting updates across an in-memory client map.
* **Actionable Suggestion:** Publish an official Amazon reference implementation and TypeScript middleware (`@modelcontextprotocol/streamable-http-middleware`) that handles session lifecycle, SSE heartbeats, and reconnection buffering out-of-the-box.

---

## Friction Log 2: Amazon Agent Skill Schema vs. Standard MCP Tool Signatures

* **Task Attempted:** Define an Amazon Agent Skill in `SKILL.md` that directly mirrors the tools registered in our MCP Server.
* **Steps Taken:**
  1. Created JSON Schema definitions for tools in TypeScript.
  2. Created the companion `agent-skill/SKILL.md` documentation file with frontmatter and tool parameters.
  3. Attempted to auto-generate the `SKILL.md` directly from the MCP `tools/list` response.
* **What We Expected:** A 1:1 automated CLI or schema transformer that can convert MCP `tools/list` JSON Schemas directly into Amazon Agent Skills markdown bundles without manual copy-pasting.
* **What Actually Happened:** Agent Skills use a specialized YAML frontmatter + markdown documentation format, requiring manual re-specification of descriptions, trigger heuristics, and execution guarantees.
* **Severity Rating:** **Moderate**
* **Workaround Used:** Manually authored `agent-skill/SKILL.md` with structured markdown tables and JSON schema blocks, and maintained synchronization with `mcp-server/src/tools/index.ts`.
* **Actionable Suggestion:** Provide an Amazon Developer CLI tool (`amazon-skills generate --from-mcp http://localhost:3001/mcp`) that automatically generates a fully compliant `SKILL.md` bundle directly from a running MCP server.

---

## Friction Log 3: Heterogeneous Multimodal Payload Schemas across AWS Bedrock Models

* **Task Attempted:** Call AWS Bedrock for multimodal computer vision using the `@aws-sdk/client-bedrock-runtime` package, allowing dynamic switching between Anthropic Claude 3.5 Sonnet and Amazon Nova models.
* **Steps Taken:**
  1. Initialized `BedrockRuntimeClient` with AWS region `us-east-1`.
  2. Formatted an `InvokeModelCommand` with base64 doorbell image data.
  3. Attempted to toggle the `modelId` parameter between `anthropic.claude-3-5-sonnet-20241022-v2:0` and Amazon Nova foundation models.
* **What We Expected:** The AWS Bedrock Runtime SDK would accept a unified multimodal payload structure (e.g. standard message array with text and image parts) regardless of the underlying foundation model provider.
* **What Actually Happened:** Anthropic models require `anthropic_version: "bedrock-2023-05-31"` and an array of content objects with `source.type = "base64"`, while Amazon Titan / Nova models expect model-specific input top-level keys (`inputImage`, `taskType`, etc.). Switching models required rewriting the request encoding logic.
* **Severity Rating:** **Moderate**
* **Workaround Used:** Encapsulated the model-specific payload transformations inside `mcp-server/src/services/bedrock.ts`, standardizing the internal interface to `analyzeScene({ imageBase64, scenarioContext, modelId })`.
* **Actionable Suggestion:** Introduce a high-level `BedrockChat` or `BedrockVision` helper in the AWS SDK that abstracts away provider-specific request schemas for multimodal vision queries.

---

## Friction Log 4: Cross-Device Media Playback Pause & Audio Ducking Coordination

* **Task Attempted:** Coordinate Fire TV media playback and Alexa+ voice announcements so that Fire TV volume ducks or pauses before Alexa begins articulating a high-priority front door notification.
* **Steps Taken:**
  1. Triggered `ring_inspect_doorstep` from the MCP client.
  2. Dispatched concurrent MCP tool calls: `firetv_push_overlay` (with `pauseMedia: true`) and `alexa_dispatch_ambient_action` (with spoken speech).
* **What We Expected:** Fire TV playback would pause synchronously before the Alexa audio chime sounded.
* **What Actually Happened:** Due to network transit variations across separate device interfaces, Alexa sometimes started speaking a fraction of a second before Fire TV audio stopped, causing temporary acoustic clash.
* **Severity Rating:** **Minor**
* **Workaround Used:** Implemented an orchestration sequence in `omniliving_orchestrate_scenario` that awaits the Fire TV pause acknowledgment before triggering the Alexa speech synthesis command.
* **Actionable Suggestion:** Expose an ecosystem-level `Alexa.AudioDucking` coordinator in the Amazon Agent Skills runtime that automatically ducks audio across all registered Fire TV and Echo devices in the same room before speaking.

---

## Friction Log 5: Local Sandbox & Mocking Tooling for Zero-Friction Developer Onboarding

* **Task Attempted:** Build and test a full ecosystem app without requiring physical Ring hardware, a physical Fire TV device, and live AWS credentials during local development.
* **Steps Taken:**
  1. Searched the Amazon Developer Portal and Devpost resources for official local mock servers or simulators for Ring and Alexa+.
  2. Attempted to run local unit and integration tests.
* **What We Expected:** An official lightweight npm package or Docker image providing a simulated Ring camera feed and Alexa+ voice agent mock server.
* **What Actually Happened:** No official local mock server exists for developers who do not have physical devices or live developer subscriptions. Developers are forced to either build on physical hardware or build their own simulators from scratch.
* **Severity Rating:** **Major**
* **Workaround Used:** Engineered our own complete simulated web application (`web-simulator/`) with an interactive canvas for Ring camera frames, playable video for Fire TV, Web Speech API for Alexa+, and an in-memory smart fallback engine for AWS Bedrock.
* **Actionable Suggestion:** Release an official **Amazon Devices Local Emulator Suite** (packaged as a desktop app or Docker container) that simulates Echo Show, Fire TV, and Ring devices with mock video streams and MCP debuggers.
