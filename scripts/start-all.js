/**
 * OmniLiving+ Unified Runner
 * Starts both MCP Server and Web Simulator concurrently
 * Self-healing: builds TypeScript if not already built!
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('================================================================');
console.log('🌟 Starting OmniLiving+ Ecosystem');
console.log('   - Model Context Protocol (MCP 2025-11-25+) Server on Port 3001');
console.log('   - Simulated Alexa+ Multimodal Web Simulator on Port 5173');
console.log('================================================================\n');

// 0. Pre-Flight Diagnostic Doctor
try {
  execSync(`node scripts/doctor.js`, { cwd: rootDir, stdio: 'inherit' });
  console.log('');
} catch {
  console.warn('⚠️  Doctor detected pre-flight warnings, proceeding with startup...\n');
}

// 1. Verify build exists for MCP Server
const distIndex = path.join(rootDir, 'mcp-server', 'dist', 'index.js');
if (!fs.existsSync(distIndex)) {
  console.log('🔨 Compiling mcp-server TypeScript...');
  execSync(`${npmCmd} --prefix mcp-server run build`, { cwd: rootDir, stdio: 'inherit' });
}

// 2. Start MCP Server
const serverProcess = spawn(npmCmd, ['--prefix', 'mcp-server', 'start'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

// 3. Start Web Simulator
const webProcess = spawn(npmCmd, ['--prefix', 'web-simulator', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nStopping OmniLiving+ processes...');
  try { serverProcess.kill(); } catch {}
  try { webProcess.kill(); } catch {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
