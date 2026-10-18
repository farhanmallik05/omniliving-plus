import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'assets', 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching Chrome to capture authentic OmniLiving+ screenshots...');
  
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1500, height: 1000 }, // Exactly 3:2 aspect ratio for Devpost!
    deviceScaleFactor: 1.5 // Crisp retina quality
  });

  const page = await context.newPage();
  console.log('📡 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Scenario 1 — Smart Package Delivery (Devpost Thumbnail)
  console.log('📸 Capturing Scenario 1: Smart Delivery (Thumbnail)...');
  await page.keyboard.press('1');
  await page.waitForTimeout(2500); // Allow PiP overlay and Alexa audio ducking to render
  const thumbPath = path.join(outDir, 'devpost_thumbnail.jpg');
  await page.screenshot({ path: thumbPath, type: 'jpeg', quality: 95 });
  console.log(`✅ Saved: ${thumbPath}`);

  // 2. Scenario 2 — Elderly Care Anomaly
  console.log('📸 Capturing Scenario 2: Elderly Care Mobility Anomaly...');
  await page.keyboard.press('2');
  await page.waitForTimeout(2500); // Allow standstill alert and Bee haptic pulse to render
  const elderlyPath = path.join(outDir, 'elderly_care_demo.jpg');
  await page.screenshot({ path: elderlyPath, type: 'jpeg', quality: 95 });
  console.log(`✅ Saved: ${elderlyPath}`);

  // 3. Tab: MCP Protocol Inspector
  console.log('📸 Capturing Tab: MCP Protocol Inspector...');
  const inspectorButton = page.locator('button', { hasText: 'MCP Protocol Inspector' });
  if (await inspectorButton.count() > 0) {
    await inspectorButton.click();
    await page.waitForTimeout(2000);
  }
  const mcpPath = path.join(outDir, 'mcp_developer_console.jpg');
  await page.screenshot({ path: mcpPath, type: 'jpeg', quality: 95 });
  console.log(`✅ Saved: ${mcpPath}`);

  // 4. Clean Baseline Living Room Ecosystem (Return to devices tab)
  console.log('📸 Capturing Baseline Living Room Ecosystem...');
  await page.keyboard.press('r'); // Reset to default
  await page.waitForTimeout(1000);
  const devicesButton = page.locator('button', { hasText: 'Living Room Ecosystem' });
  if (await devicesButton.count() > 0) {
    await devicesButton.click();
    await page.waitForTimeout(1500);
  }
  const ecoPath = path.join(outDir, 'living_room_ecosystem.jpg');
  await page.screenshot({ path: ecoPath, type: 'jpeg', quality: 95 });
  console.log(`✅ Saved: ${ecoPath}`);

  await browser.close();
  console.log('\n🎉 All 4 authentic, pixel-perfect 3:2 project screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
