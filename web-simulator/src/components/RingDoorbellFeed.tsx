import React, { useState } from 'react';
import { Bell, Video, Mic, ShieldAlert, Package, BatteryMedium, Wifi } from 'lucide-react';
import { DeviceState, McpClientService } from '../services/api';
import { soundSynth } from '../services/sound';

interface RingDoorbellFeedProps {
  deviceState: DeviceState | null;
}

export const RingDoorbellFeed: React.FC<RingDoorbellFeedProps> = ({ deviceState }) => {
  const [selectedZone, setSelectedZone] = useState<'porch' | 'walkway' | 'driveway'>('porch');
  const client = McpClientService.getInstance();
  const ring = deviceState?.ring;

  const handleRingDoorbell = async () => {
    soundSynth.playDoorbellChime();
    await client.callTool('ring_inspect_doorstep', { zone: selectedZone, enableIntercom: true });
    await client.callTool('firetv_push_overlay', {
      message: 'Ring Doorbell: Visitor at Front Porch',
      enablePictureInPicture: true,
      pauseMedia: true
    });
    await client.callTool('alexa_dispatch_ambient_action', {
      spokenAnnouncement: 'Someone just rang the front doorbell. Displaying camera view on your living room Fire TV.'
    });
  };

  const handleSimulatePackage = async () => {
    soundSynth.playAlexaChime();
    await client.callTool('omniliving_orchestrate_scenario', { scenario: 'package_delivery' });
  };

  const handleSimulateNightAlert = async () => {
    soundSynth.playSecurityAlert();
    await client.callTool('omniliving_orchestrate_scenario', { scenario: 'night_security_alert' });
  };

  const handleToggleIntercom = async () => {
    const current = ring?.intercomActive || false;
    await client.callTool('ring_inspect_doorstep', {
      zone: selectedZone,
      enableIntercom: !current
    });
    if (!current) {
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: 'Two-way audio intercom channel opened with front doorstep.'
      });
    }
  };

  const isRinging = ring?.status === 'ringing';
  const hasMotion = ring?.status === 'motion_detected' || ring?.status === 'ringing';
  const packageDetected = ring?.packageDetected || false;
  const intercomActive = ring?.intercomActive || false;

  return (
    <div className="double-bezel">
      <div className="double-bezel-inner">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(16, 132, 227, 0.12)',
              border: '1.5px solid #1084e3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={18} color="#1084e3" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Ring Smart Doorbell Pro</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Front Entrance • 1080p HDR Video</span>
            </div>
          </div>

          {/* Telemetry Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <BatteryMedium size={14} color="#067d62" strokeWidth={2} />
              <span>{ring?.battery || 94}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#007185', fontWeight: 600 }}>
              <Wifi size={14} strokeWidth={2} />
              <span>5GHz</span>
            </div>
            <span className="eyebrow-tag" style={{
              background: hasMotion ? 'rgba(255, 153, 0, 0.14)' : 'rgba(6, 125, 98, 0.12)',
              color: hasMotion ? '#b12704' : '#067d62',
              border: `1px solid ${hasMotion ? '#ffa41c' : '#067d62'}`
            }}>
              {isRinging ? 'Ringing' : hasMotion ? 'Motion' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Live Camera Feed Canvas */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#0a0f1d',
          aspectRatio: '16 / 9',
          border: `1.5px solid ${hasMotion ? '#ff9900' : 'var(--bezel-inner-border)'}`,
          boxShadow: hasMotion ? '0 0 25px rgba(255, 153, 0, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.35s var(--ease-spring)'
        }}>
          
          {/* Simulated Doorstep Vector Canvas */}
          <svg viewBox="0 0 640 360" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
              <linearGradient id="porchFloor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Background Sky */}
            <rect width="640" height="360" fill="url(#daySky)" />

            {/* Porch Columns & Roof */}
            <rect x="40" y="20" width="30" height="320" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="570" y="20" width="30" height="320" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="20" y="10" width="600" height="30" fill="#334155" rx="4" />

            {/* Porch Deck & Steps */}
            <polygon points="100,360 140,240 500,240 540,360" fill="url(#porchFloor)" />
            <polygon points="160,240 220,180 420,180 480,240" fill="#475569" />
            
            {/* Front Door */}
            <rect x="260" y="70" width="120" height="170" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <rect x="275" y="85" width="40" height="60" rx="2" fill="#0284c7" opacity="0.4" />
            <rect x="325" y="85" width="40" height="60" rx="2" fill="#0284c7" opacity="0.4" />
            <circle cx="275" cy="160" r="5" fill="#facc15" />

            {/* Welcome Mat */}
            <rect x="250" y="270" width="140" height="60" rx="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
            <text x="282" y="305" fill="#94a3b8" fontSize="12" fontWeight="700" fontFamily="sans-serif">WELCOME</text>
            
            {/* Potted plant */}
            <rect x="115" y="265" width="32" height="42" rx="3" fill="#b45309" />
            <circle cx="131" cy="255" r="20" fill="#15803d" />

            {/* Amazon Delivery Parcel with Smile Logo */}
            {packageDetected && (
              <g className="packet-enter">
                <rect x="280" y="235" width="80" height="55" rx="6" fill="#d97706" stroke="#b45309" strokeWidth="2" />
                <rect x="315" y="235" width="10" height="55" fill="#fef3c7" opacity="0.75" />
                <path d="M 292 272 Q 320 286 348 272" stroke="#0f1111" strokeWidth="3" fill="none" strokeLinecap="round" />
                <polygon points="345,269 352,272 346,277" fill="#0f1111" />
                {/* Vision Box */}
                <rect x="272" y="225" width="96" height="72" rx="4" fill="none" stroke="#ff9900" strokeWidth="2.5" strokeDasharray="6 3" />
                <rect x="272" y="206" width="96" height="18" rx="4" fill="#ff9900" />
                <text x="278" y="219" fill="#0f1111" fontSize="10" fontWeight="800" fontFamily="sans-serif">AMAZON PARCEL 98%</text>
              </g>
            )}

            {/* Simulated Visitor Figure when Ringing */}
            {isRinging && (
              <g className="packet-enter">
                <circle cx="320" cy="140" r="24" fill="#f8fafc" stroke="#0284c7" strokeWidth="3" />
                <rect x="290" y="170" width="60" height="90" rx="8" fill="#0284c7" />
              </g>
            )}
          </svg>

          {/* Top Overlays */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(19, 25, 33, 0.85)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1084e3' }} className="live-dot" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>RING LIVE</span>
            </div>

            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#ffffff',
              background: 'rgba(19, 25, 33, 0.85)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textTransform: 'uppercase'
            }}>
              Zone: {selectedZone}
            </div>
          </div>

          {/* Intercom active overlay */}
          {intercomActive && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(16, 132, 227, 0.9)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Mic size={13} strokeWidth={2} />
              <span>Two-Way Intercom Live</span>
            </div>
          )}

          {/* Scan line effect */}
          <div className="scan-line" />

          {/* Doorbell ringing burst animation */}
          {isRinging && <div className="ringing-burst" />}

        </div>

        {/* Ring Controls & Actions */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Main Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={handleRingDoorbell}
              className="btn-island btn-amazon-gold"
              style={{ justifyContent: 'center' }}
            >
              <Bell size={14} color="#0f1111" strokeWidth={2} />
              <span>Ring Doorbell</span>
            </button>

            <button
              onClick={handleToggleIntercom}
              className="btn-island"
              style={{
                justifyContent: 'center',
                background: intercomActive ? 'rgba(16, 132, 227, 0.12)' : 'var(--surface-0)',
                borderColor: intercomActive ? '#1084e3' : 'var(--bezel-inner-border)',
                color: intercomActive ? '#1084e3' : 'var(--text-primary)'
              }}
            >
              <Mic size={14} strokeWidth={2} />
              <span>{intercomActive ? 'End Intercom' : 'Open Intercom'}</span>
            </button>
          </div>

          {/* Secondary Triggers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={handleSimulatePackage}
              className="btn-island"
              style={{
                justifyContent: 'center',
                background: 'var(--surface-1)',
                fontSize: '12px'
              }}
            >
              <Package size={13} color="#ff9900" strokeWidth={2} />
              <span>Detect Parcel</span>
            </button>

            <button
              onClick={handleSimulateNightAlert}
              className="btn-island"
              style={{
                justifyContent: 'center',
                background: 'var(--surface-1)',
                fontSize: '12px'
              }}
            >
              <ShieldAlert size={13} color="#c40000" strokeWidth={2} />
              <span>Trigger Alert</span>
            </button>
          </div>

          {/* Zone Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Camera Zone:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['porch', 'walkway', 'driveway'] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  style={{
                    background: selectedZone === z ? '#1084e3' : 'var(--surface-1)',
                    color: selectedZone === z ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${selectedZone === z ? '#1084e3' : 'var(--bezel-inner-border)'}`,
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
