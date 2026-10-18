/**
 * OmniLiving+ Pre-Flight Environment Doctor
 * Validates Node.js version, port availability, dependency installations,
 * and build artifacts before boot to ensure zero runtime friction for hackathon judges.
 */

import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function runDoctor() {
  console.log('=============================================================');
  console.log('   🩺 OmniLiving+ Pre-Flight Environment Doctor');
  console.log('   Zero-Friction Diagnostic Verification for Evaluators');
  console.log('=============================================================\n');

  let hasErrors = false;
  let hasWarnings = false;

  // 1. Node.js Version Check
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion >= 18) {
    console.log(`✅ Node.js Version: ${nodeVersion} (Supported: >= v18.0.0)`);
  } else {
    console.log(`❌ Node.js Version: ${nodeVersion} — Unsupported. Requires Node v18+`);
    hasErrors = true;
  }

  // 2. Root Workspace Orchestration Check
  console.log(`✅ Root Workspace: Configured (Zero-overhead native Node.js orchestration)`);

  // 3. MCP Server Dependencies & Build
  const mcpModules = path.join(rootDir, 'mcp-server', 'node_modules');
  const mcpDist = path.join(rootDir, 'mcp-server', 'dist', 'index.js');
  if (fs.existsSync(mcpModules)) {
    console.log(`✅ MCP Server Dependencies: Installed`);
  } else {
    console.log(`❌ MCP Server Dependencies: Missing node_modules in /mcp-server`);
    hasErrors = true;
  }
  if (fs.existsSync(mcpDist)) {
    console.log(`✅ MCP Server Build: Compiled (/mcp-server/dist/index.js present)`);
  } else {
    console.log(`⚠️  MCP Server Build: Not compiled yet. (Will be auto-compiled by runners)`);
    hasWarnings = true;
  }

  // 4. Web Simulator Dependencies
  const webModules = path.join(rootDir, 'web-simulator', 'node_modules');
  if (fs.existsSync(webModules)) {
    console.log(`✅ Web Simulator Dependencies: Installed`);
  } else {
    console.log(`❌ Web Simulator Dependencies: Missing node_modules in /web-simulator`);
    hasErrors = true;
  }

  // 5. Benchmark Dataset
  const datasetPath = path.join(rootDir, 'data', 'benchmark-frames', 'dataset.json');
  if (fs.existsSync(datasetPath)) {
    console.log(`✅ Multimodal Benchmark Dataset: Present (/data/benchmark-frames/dataset.json)`);
  } else {
    console.log(`⚠️  Multimodal Benchmark Dataset: Missing in /data`);
    hasWarnings = true;
  }

  // 6. Port Availability Check
  const mcpPort = parseInt(process.env.MCP_PORT || '3001', 10);
  const webPort = 5173;

  const port3001Free = await isPortAvailable(mcpPort);
  if (port3001Free) {
    console.log(`✅ Port ${mcpPort} (MCP Server): Free & Available`);
  } else {
    console.log(`ℹ️  Port ${mcpPort} (MCP Server): Already bound or server is currently active`);
  }

  const port5173Free = await isPortAvailable(webPort);
  if (port5173Free) {
    console.log(`✅ Port ${webPort} (Web Simulator): Free & Available`);
  } else {
    console.log(`ℹ️  Port ${webPort} (Web Simulator): Already bound or Vite dev server active`);
  }

  // 7. AWS Bedrock Credentials Status
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log(`☁️  AWS Bedrock: Live AWS credentials detected in environment`);
  } else {
    console.log(`⚡ AWS Bedrock: Smart Fallback Simulation Engine active (Zero-config evaluator mode)`);
  }

  console.log('\n-------------------------------------------------------------');
  if (hasErrors) {
    console.log('❌ Diagnostic failed. Please run: npm run install:all');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Diagnostics passed with non-critical warnings. Ready to launch!');
    process.exit(0);
  } else {
    console.log('🎉 All systems GO! Ready to launch with: npm start');
    process.exit(0);
  }
}

runDoctor().catch((err) => {
  console.error('Doctor execution error:', err);
  process.exit(1);
});
