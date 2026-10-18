/**
 * OmniLiving+ Automated Verification & MCP Compliance Test Suite
 * Spec: MCP 2025-11-25 (Streamable HTTP Transport)
 * 
 * Auto-Spawns the MCP Server if not already active!
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'http://localhost:3001';
let serverProcess = null;

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServerReady() {
  const alreadyUp = await isServerRunning();
  if (alreadyUp) {
    console.log('🔗 Connected to active OmniLiving+ MCP Server on port 3001.\n');
    return;
  }

  console.log('⚡ Server not detected. Auto-spawning OmniLiving+ MCP Server...');

  // Ensure built
  const distIndex = path.join(rootDir, 'mcp-server', 'dist', 'index.js');
  if (!fs.existsSync(distIndex)) {
    console.log('🔨 Compiling mcp-server TypeScript...');
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    const { execSync } = await import('child_process');
    execSync(`${npmCmd} --prefix mcp-server run build`, { cwd: rootDir, stdio: 'inherit' });
  }

  serverProcess = spawn('node', ['mcp-server/dist/index.js'], {
    cwd: rootDir,
    stdio: 'pipe',
    env: { ...process.env, MCP_PORT: '3001' }
  });

  // Wait for health endpoint
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (await isServerRunning()) {
      console.log('✅ Spawned MCP Server is healthy and accepting Streamable HTTP connections.\n');
      return;
    }
  }

  throw new Error('Failed to auto-spawn MCP Server within 7.5 seconds.');
}

async function runTests() {
  console.log('=============================================================');
  console.log('   OmniLiving+ Automated MCP & Cross-Device Test Suite');
  console.log('   Target Spec: MCP 2025-11-25 (Streamable HTTP Transport)');
  console.log('=============================================================\n');

  await ensureServerReady();

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`⏳ Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // Helper JSON-RPC caller over Streamable HTTP POST /mcp
  async function callMcp(method, params = {}) {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': 'test_suite_session_001'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const body = await res.json();
    if (body.error) throw new Error(`JSON-RPC Error [${body.error.code}]: ${body.error.message}`);
    return body.result;
  }

  // 1. Health check
  await test('Health check endpoint (/health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
    if (data.protocolVersion !== '2025-11-25') throw new Error(`Incorrect protocolVersion: ${data.protocolVersion}`);
    if (data.database !== 'sqlite-persistent') throw new Error('Database not configured as persistent sqlite');
  });

  // 2. Initialize handshake
  await test('MCP Handshake (initialize)', async () => {
    const result = await callMcp('initialize');
    if (result.protocolVersion !== '2025-11-25') throw new Error('protocolVersion mismatch');
    if (!result.capabilities?.tools) throw new Error('tools capability missing');
    if (!result.capabilities?.resources) throw new Error('resources capability missing');
    if (!result.capabilities?.prompts) throw new Error('prompts capability missing');
  });

  // 3. Ping
  await test('MCP Ping (ping)', async () => {
    const result = await callMcp('ping');
    if (typeof result !== 'object') throw new Error('Ping failed to return object');
  });

  // 4. Tools list (Verifying all 11 MCP Tools)
  let toolsList = [];
  await test('MCP Tools List (tools/list)', async () => {
    const result = await callMcp('tools/list');
    if (!Array.isArray(result.tools) || result.tools.length === 0) {
      throw new Error('tools/list did not return tool array');
    }
    toolsList = result.tools.map(t => t.name);
    const requiredTools = [
      'ring_inspect_doorstep',
      'bedrock_analyze_scene',
      'firetv_push_overlay',
      'bee_sync_vitals',
      'alexa_dispatch_ambient_action',
      'omniliving_orchestrate_scenario',
      'automation_list_rules',
      'automation_create_rule',
      'automation_toggle_rule',
      'automation_delete_rule',
      'automation_test_rule'
    ];
    for (const req of requiredTools) {
      if (!toolsList.includes(req)) throw new Error(`Missing expected tool: ${req}`);
    }
  });

  // 5. Tool execution: ring_inspect_doorstep
  await test('Tool Call: ring_inspect_doorstep', async () => {
    const result = await callMcp('tools/call', {
      name: 'ring_inspect_doorstep',
      arguments: { zone: 'porch', enableIntercom: true }
    });
    if (!result.content || !result.content[0]?.text) throw new Error('Invalid tool response schema');
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.status !== 'success') throw new Error('Expected status success');
  });

  // 6. Tool execution: bedrock_analyze_scene (with Two-Frame & Motion Filter)
  await test('Tool Call: bedrock_analyze_scene (AWS Bedrock)', async () => {
    const result = await callMcp('tools/call', {
      name: 'bedrock_analyze_scene',
      arguments: { scenarioContext: 'Amazon Prime package delivery at porch' }
    });
    if (!result.content || !result.content[0]?.text) throw new Error('Invalid Bedrock tool response');
    const parsed = JSON.parse(result.content[0].text);
    if (!parsed.verdict || !parsed.bedrockMetadata) throw new Error('Missing Bedrock inference metadata');
    if (!parsed.temporalVerification) throw new Error('Missing temporal verification metadata');
    if (!parsed.motionFilter) throw new Error('Missing motion filter metadata');
  });

  // 7. Tool execution: firetv_push_overlay
  await test('Tool Call: firetv_push_overlay (Fire TV Living Room)', async () => {
    const result = await callMcp('tools/call', {
      name: 'firetv_push_overlay',
      arguments: {
        message: 'Test automated PiP overlay',
        enablePictureInPicture: true,
        pauseMedia: true,
        durationSeconds: 2
      }
    });
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.pictureInPicture !== true) throw new Error('PiP flag not set');
  });

  // 8. Tool execution: bee_sync_vitals
  await test('Tool Call: bee_sync_vitals (Bee Wearable)', async () => {
    const result = await callMcp('tools/call', {
      name: 'bee_sync_vitals',
      arguments: { triggerHaptic: true }
    });
    const parsed = JSON.parse(result.content[0].text);
    if (typeof parsed.heartRate !== 'number') throw new Error('Heart rate missing');
  });

  // 9. Tool execution: alexa_dispatch_ambient_action
  await test('Tool Call: alexa_dispatch_ambient_action (Alexa+ Voice & Locks)', async () => {
    const result = await callMcp('tools/call', {
      name: 'alexa_dispatch_ambient_action',
      arguments: {
        spokenAnnouncement: 'Automated test announcement',
        smartLockAction: 'lock',
        porchLightBrightness: 100
      }
    });
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.smartLockState !== 'locked') throw new Error('Lock state mismatch');
  });

  // 10. Dynamic Automation Tools
  let testRuleId = '';
  await test('Automation Engine: automation_list_rules & automation_create_rule', async () => {
    const listRes = await callMcp('tools/call', { name: 'automation_list_rules', arguments: {} });
    const listData = JSON.parse(listRes.content[0].text);
    if (!Array.isArray(listData.rules) || listData.totalRules === 0) throw new Error('Default rules not loaded');

    const createRes = await callMcp('tools/call', {
      name: 'automation_create_rule',
      arguments: {
        name: 'Automated Test Rule',
        when: { event: 'motion_detected', source: 'ring' },
        if: { fireTvPlaying: true },
        then: { fireTvPip: true, alexaAnnouncement: 'Testing automation' },
        enabled: true
      }
    });
    const createData = JSON.parse(createRes.content[0].text);
    if (!createData.rule?.id) throw new Error('Failed to create rule');
    testRuleId = createData.rule.id;
  });

  await test('Automation Engine: automation_test_rule & automation_toggle_rule', async () => {
    const testRes = await callMcp('tools/call', {
      name: 'automation_test_rule',
      arguments: { id: testRuleId }
    });
    const testData = JSON.parse(testRes.content[0].text);
    if (testData.status !== 'success') throw new Error('Test rule execution failed');

    const toggleRes = await callMcp('tools/call', {
      name: 'automation_toggle_rule',
      arguments: { id: testRuleId, enabled: false }
    });
    const toggleData = JSON.parse(toggleRes.content[0].text);
    if (toggleData.enabled !== false) throw new Error('Rule toggle failed');
  });

  await test('Automation Engine: automation_delete_rule', async () => {
    const deleteRes = await callMcp('tools/call', {
      name: 'automation_delete_rule',
      arguments: { id: testRuleId }
    });
    const deleteData = JSON.parse(deleteRes.content[0].text);
    if (deleteData.deleted !== true) throw new Error('Rule deletion failed');
  });

  // 11. Live Ring Webhook endpoint test
  await test('Live Ring Webhook (POST /api/ring/webhook)', async () => {
    const res = await fetch(`${BASE_URL}/api/ring/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'ding',
        doorbot_description: 'Front Door Pro',
        created_at: new Date().toISOString()
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'success') throw new Error('Webhook failed to trigger');
  });

  // 12. Resources list & read
  await test('MCP Resources (resources/list & resources/read)', async () => {
    const resList = await callMcp('resources/list');
    if (!Array.isArray(resList.resources) || resList.resources.length === 0) {
      throw new Error('No resources found');
    }
    const readResult = await callMcp('resources/read', { uri: 'system://devices/status' });
    if (!readResult.contents || !readResult.contents[0]?.text) {
      throw new Error('Failed to read system://devices/status');
    }
  });

  // 13. Prompts list & get
  await test('MCP Prompts (prompts/list & prompts/get)', async () => {
    const pList = await callMcp('prompts/list');
    if (!Array.isArray(pList.prompts) || pList.prompts.length === 0) {
      throw new Error('No prompts found');
    }
    const prompt = await callMcp('prompts/get', {
      name: 'package_delivery_brief',
      arguments: { carrier: 'Amazon Prime' }
    });
    if (!prompt.messages || prompt.messages.length === 0) {
      throw new Error('Prompt get returned empty messages');
    }
  });

  // 14. End-to-end scenario orchestration
  await test('Full Orchestration: omniliving_orchestrate_scenario', async () => {
    const result = await callMcp('tools/call', {
      name: 'omniliving_orchestrate_scenario',
      arguments: { scenario: 'package_delivery' }
    });
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.status !== 'executed') throw new Error('Scenario execution failed');
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('-------------------------------------------------------------\n');

  // Clean up auto-spawned server process if created
  if (serverProcess) {
    serverProcess.kill();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED! OmniLiving+ MCP Server is 100% compliant.\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  if (serverProcess) serverProcess.kill();
  console.error('\nFatal test execution error:', err.message);
  process.exit(1);
});
