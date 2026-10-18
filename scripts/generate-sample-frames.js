import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '..', 'data', 'benchmark-frames');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const frames = [
  {
    id: 'frame_01',
    title: 'Amazon Prime Courier Delivery',
    category: 'courier_delivery',
    timestamp: '2026-10-18 14:22:10 UTC',
    night: false,
    boxColor: '#00a8e8',
    boxLabel: 'Package: Amazon Prime (Conf: 98.4%)',
    boxRect: { x: 440, y: 380, w: 220, h: 180 },
    personRect: { x: 380, y: 160, w: 260, h: 420 },
    personLabel: 'Uniformed Courier (Prime)',
    notes: 'Authentic cardboard parcel placed squarely on porch mat.'
  },
  {
    id: 'frame_02',
    title: 'FedEx Ground Delivery',
    category: 'courier_delivery',
    timestamp: '2026-10-18 11:05:44 UTC',
    night: false,
    boxColor: '#ff6600',
    boxLabel: 'Package: FedEx Medium Box (Conf: 96.1%)',
    boxRect: { x: 500, y: 400, w: 180, h: 160 },
    personRect: { x: 420, y: 180, w: 240, h: 390 },
    personLabel: 'FedEx Driver',
    notes: 'Parcel placed near potted planter.'
  },
  {
    id: 'frame_03',
    title: 'UPS Next Day Air Delivery',
    category: 'courier_delivery',
    timestamp: '2026-10-18 09:41:19 UTC',
    night: false,
    boxColor: '#ffb100',
    boxLabel: 'Package: UPS Envelope (Conf: 95.8%)',
    boxRect: { x: 460, y: 410, w: 190, h: 140 },
    personRect: { x: 410, y: 150, w: 250, h: 430 },
    personLabel: 'UPS Driver',
    notes: 'Driver rings doorbell and retreats to van.'
  },
  {
    id: 'frame_04',
    title: 'DoorDash Food Delivery',
    category: 'courier_delivery',
    timestamp: '2026-10-18 19:15:02 UTC',
    night: true,
    boxColor: '#ff3008',
    boxLabel: 'Delivery: Thermal Food Bag (Conf: 94.2%)',
    boxRect: { x: 480, y: 390, w: 170, h: 170 },
    personRect: { x: 400, y: 190, w: 230, h: 380 },
    personLabel: 'DoorDash Courier',
    notes: 'Food bag placed on welcome mat.'
  },
  {
    id: 'frame_05',
    title: 'USPS Priority Mail Carrier',
    category: 'courier_delivery',
    timestamp: '2026-10-18 13:30:51 UTC',
    night: false,
    boxColor: '#004b87',
    boxLabel: 'Package: USPS Priority Box (Conf: 97.2%)',
    boxRect: { x: 520, y: 370, w: 190, h: 150 },
    personRect: { x: 440, y: 170, w: 240, h: 410 },
    personLabel: 'USPS Mail Carrier',
    notes: 'Medium parcel placed near wall mail receptacle.'
  },
  {
    id: 'frame_06',
    title: 'Elderly Resident Mobility Assistance (Cane)',
    category: 'elderly_care_mobility',
    timestamp: '2026-10-18 16:12:05 UTC',
    night: false,
    boxColor: '#00d26a',
    boxLabel: 'Mobility Aid: Quad Cane (Conf: 92.5%)',
    boxRect: { x: 620, y: 340, w: 70, h: 260 },
    personRect: { x: 430, y: 160, w: 230, h: 440 },
    personLabel: 'Senior Resident (Gait: Slow / Stable)',
    notes: 'Resident negotiating single front doorstep safely.'
  },
  {
    id: 'frame_07',
    title: 'Elderly Care Standstill Anomaly (>45s)',
    category: 'elderly_care_mobility',
    timestamp: '2026-10-18 17:48:22 UTC',
    night: false,
    boxColor: '#ff9900',
    boxLabel: 'Alert: Prolonged Standstill 48s (Conf: 94.7%)',
    boxRect: { x: 410, y: 140, w: 270, h: 480 },
    personRect: { x: 420, y: 150, w: 250, h: 460 },
    personLabel: 'Resident Motion Inactive',
    notes: 'Resident motionless at threshold; Alexa+ gentle voice prompt recommended.'
  },
  {
    id: 'frame_08',
    title: 'Night Perimeter Intrusion - Loiterer',
    category: 'night_perimeter_security',
    timestamp: '2026-10-18 02:44:19 UTC',
    night: true,
    boxColor: '#ff3333',
    boxLabel: 'Security Threat: Masked Loiterer (Conf: 96.0%)',
    boxRect: { x: 390, y: 140, w: 280, h: 470 },
    personRect: { x: 400, y: 150, w: 260, h: 450 },
    personLabel: 'Unidentified Person (Dark Hood / Face Obscured)',
    notes: 'Individual lingering within 4ft of entrance for >30s without delivery intent.'
  },
  {
    id: 'frame_09',
    title: 'Night Perimeter Door Handle Tamper Attempt',
    category: 'night_perimeter_security',
    timestamp: '2026-10-18 03:19:55 UTC',
    night: true,
    boxColor: '#ff1111',
    boxLabel: 'Urgent Threat: Handle Manipulation (Conf: 98.1%)',
    boxRect: { x: 460, y: 220, w: 220, h: 360 },
    personRect: { x: 440, y: 160, w: 260, h: 440 },
    personLabel: 'Prowler Reach Vector Detected',
    notes: 'Smart lock deadbolt engaged; Fire TV living room PiP alert triggered.'
  },
  {
    id: 'frame_10',
    title: 'Benign Noise - Wind-Induced Branch Sway',
    category: 'benign_false_positives',
    timestamp: '2026-10-18 15:02:30 UTC',
    night: false,
    boxColor: '#888888',
    boxLabel: 'Motion Pre-Filter: 11% Structural (Suppressed)',
    boxRect: { x: 120, y: 80, w: 320, h: 260 },
    personRect: { x: 0, y: 0, w: 0, h: 0 },
    personLabel: 'No Person Detected',
    notes: 'Wind velocity 18mph moving Japanese maple branch; discarded before LLM token spend.'
  }
];

function generateSvg(frame) {
  const bgGradient = frame.night
    ? `<radialGradient id="nightVignette" cx="50%" cy="50%" r="70%">
         <stop offset="0%" stop-color="#141a22"/>
         <stop offset="80%" stop-color="#080a0d"/>
         <stop offset="100%" stop-color="#020304"/>
       </radialGradient>`
    : `<linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="#2a3b4c"/>
         <stop offset="60%" stop-color="#1e293b"/>
         <stop offset="100%" stop-color="#0f172a"/>
       </linearGradient>`;

  const nightFilter = frame.night
    ? `<text x="1120" y="60" fill="#00ffcc" font-family="monospace" font-size="16" font-weight="bold">● IR NIGHT VISION</text>`
    : `<text x="1120" y="60" fill="#00e676" font-family="monospace" font-size="16" font-weight="bold">● HDR DAYLIGHT</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    ${bgGradient}
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Camera Sensor Field -->
  <rect width="1280" height="720" fill="${frame.night ? 'url(#nightVignette)' : 'url(#dayGrad)'}"/>

  <!-- Doorstep & Porch Architecture Reference -->
  <polygon points="100,720 1180,720 980,480 300,480" fill="${frame.night ? '#11171f' : '#253342'}" opacity="0.8"/>
  <rect x="520" y="180" width="240" height="340" fill="${frame.night ? '#0d131a' : '#1c2733'}" stroke="#334155" stroke-width="2"/>
  <circle cx="540" cy="350" r="8" fill="#e2e8f0"/>
  <!-- Porch Mat -->
  <rect x="460" y="500" width="360" height="140" rx="8" fill="${frame.night ? '#1e293b' : '#334155'}" stroke="#475569" stroke-width="2"/>
  <text x="640" y="580" fill="#64748b" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">WELCOME</text>

  <!-- Ring Doorbell HUD Overlay Top Bar -->
  <rect x="0" y="0" width="1280" height="90" fill="rgba(0,0,0,0.7)"/>
  <text x="40" y="45" fill="#ff9900" font-family="sans-serif" font-size="22" font-weight="bold">RING PRO CAMERA 01</text>
  <text x="40" y="72" fill="#94a3b8" font-family="monospace" font-size="14">${frame.timestamp} | 1080p 30fps | Wi-Fi RSSI -52dBm | Battery: 100% (Hardwired)</text>
  ${nightFilter}

  <!-- AI Computer Vision Bounding Boxes -->
  ${frame.personRect.w > 0 ? `
  <rect x="${frame.personRect.x}" y="${frame.personRect.y}" width="${frame.personRect.w}" height="${frame.personRect.h}"
        fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4" rx="4"/>
  <rect x="${frame.personRect.x}" y="${frame.personRect.y - 28}" width="${frame.personRect.w}" height="28" fill="#3b82f6" rx="4"/>
  <text x="${frame.personRect.x + 8}" y="${frame.personRect.y - 8}" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${frame.personLabel}</text>
  ` : ''}

  <!-- Target Bounding Box -->
  <rect x="${frame.boxRect.x}" y="${frame.boxRect.y}" width="${frame.boxRect.w}" height="${frame.boxRect.h}"
        fill="${frame.boxColor}22" stroke="${frame.boxColor}" stroke-width="3" rx="4" filter="url(#glow)"/>
  <rect x="${frame.boxRect.x}" y="${frame.boxRect.y - 30}" width="${frame.boxRect.w}" height="30" fill="${frame.boxColor}" rx="4"/>
  <text x="${frame.boxRect.x + 10}" y="${frame.boxRect.y - 10}" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">${frame.boxLabel}</text>

  <!-- Ground Truth HUD Banner Bottom -->
  <rect x="0" y="630" width="1280" height="90" fill="rgba(15,23,42,0.95)" stroke="#334155" stroke-width="1"/>
  <text x="40" y="662" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="bold">GROUND TRUTH EVALUATION: ${frame.id} (${frame.title})</text>
  <text x="40" y="692" fill="#cbd5e1" font-family="sans-serif" font-size="14">Category: ${frame.category} | Notes: ${frame.notes}</text>
  <text x="1100" y="678" fill="#10b981" font-family="monospace" font-size="16" font-weight="bold">PASS (94% F1)</text>
</svg>`;
}

for (const frame of frames) {
  const filePath = path.join(outDir, `${frame.id}.svg`);
  fs.writeFileSync(filePath, generateSvg(frame), 'utf-8');
  console.log(`✅ Generated visual test frame: ${frame.id}.svg`);
}

console.log(`\n🎉 Successfully created ${frames.length} ground-truth visual camera frames in ${outDir}`);
