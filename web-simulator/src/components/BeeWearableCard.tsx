import React, { useState } from 'react';
import { Watch, Heart, Activity, Vibrate, MapPin } from 'lucide-react';
import { DeviceState, McpClientService } from '../services/api';

interface BeeWearableCardProps {
  deviceState: DeviceState | null;
}

export const BeeWearableCard: React.FC<BeeWearableCardProps> = ({ deviceState }) => {
  const [hapticActive, setHapticActive] = useState(false);
  const client = McpClientService.getInstance();
  const bee = deviceState?.beeWearable;

  const triggerHaptic = async () => {
    setHapticActive(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
    await client.callTool('bee_sync_vitals', { triggerHaptic: true });
    setTimeout(() => setHapticActive(false), 1200);
  };

  return (
    <div className="double-bezel">
      <div className="double-bezel-inner" style={{ padding: '18px 22px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(255, 153, 0, 0.12)',
              border: '1.5px solid #ff9900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Watch size={16} color="#ff9900" strokeWidth={2} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Bee Wearable AI</h4>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Ambient Biometrics & Room Tracking</span>
            </div>
          </div>

          <span className="eyebrow-tag" style={{ background: 'rgba(6, 125, 98, 0.12)', color: '#067d62', border: '1px solid #067d62' }}>
            Online ({bee?.battery || 88}%)
          </span>
        </div>

        {/* Grid of Vitals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          
          {/* Heart Rate */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#e11d48', fontWeight: 800, letterSpacing: '0.05em' }}>
              <Heart size={14} className="beat" strokeWidth={2} />
              <span>HEART RATE</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {bee?.heartRate || 72} <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>BPM</span>
            </div>
          </div>

          {/* Room Proximity */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#007185', fontWeight: 800, letterSpacing: '0.05em' }}>
              <MapPin size={14} strokeWidth={2} />
              <span>PROXIMITY</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
              {bee?.currentRoom || 'Living Room'}
            </div>
          </div>

        </div>

        {/* Haptic Trigger & Activity */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--bezel-inner-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <Activity size={14} color="#067d62" strokeWidth={2} />
            <span>Activity: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{bee?.activityLevel || 'resting'}</strong></span>
          </div>

          <button
            onClick={triggerHaptic}
            className="btn-island"
            style={{
              fontSize: '11px',
              padding: '4px 12px',
              background: hapticActive ? 'linear-gradient(to bottom, #ffd814, #f7ca00)' : 'var(--surface-0)',
              borderColor: hapticActive ? '#fcd200' : 'var(--bezel-inner-border)',
              color: '#0f1111'
            }}
          >
            <Vibrate size={13} color={hapticActive ? '#b12704' : '#0f1111'} strokeWidth={2} />
            <span>{hapticActive ? 'Pulsing Haptic...' : 'Pulse Haptic'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
