# Contributing to OmniLiving+

Thank you for your interest in contributing to **OmniLiving+**, the open-source Autonomous Multimodal Living Room & Ambient Security Copilot for Alexa+ powered by the Model Context Protocol (MCP) and AWS Bedrock.

## Our Vision
OmniLiving+ provides an open, extensible, and standards-compliant bridge between Alexa+ conversational agents, ambient smart home devices (Ring, Fire TV, Bee wearables), and AWS foundation models using the official MCP 2025-11-25+ Streamable HTTP specification.

## How to Contribute

### 1. Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and considerate in all interactions.

### 2. Getting Started
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/farhanmallik05/omniliving-plus.git
   cd omniliving-plus
   ```
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start both the MCP Server and the Web Simulator:
   ```bash
   npm start
   ```
5. Run the MCP verification test suite:
   ```bash
   npm run test:mcp
   ```

### 3. Adding New MCP Tools
All tools are defined under `mcp-server/src/tools/`. To add a new ambient device capability:
1. Define the tool schema with JSON Schema v7.
2. Implement the tool handler returning an MCP-compliant response payload.
3. Register the tool in `mcp-server/src/tools/index.ts`.
4. Add corresponding test cases in `scripts/verify-mcp.js`.

### 4. Pull Request Guidelines
- Branch naming convention: `feat/feature-name` or `fix/bug-description`.
- Ensure tests pass with `npm run test:mcp`.
- Update `agent-skill/SKILL.md` if tool schemas or capabilities are modified.
- Include a clear description of changes in your PR.

## License
By contributing to OmniLiving+, you agree that your contributions will be licensed under the MIT License.
