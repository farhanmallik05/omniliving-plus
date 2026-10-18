import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', action: 'Smart Package Delivery', desc: 'Triggers courier approach, Bedrock CV parcel recognition, Fire TV PiP, and Alexa+ chime' },
    { key: '2', action: 'Elderly Care Routine Anomaly', desc: 'Triggers porch steps standstill detection, gentle spoken check-in, and Bee wearable haptic pulse' },
    { key: '3', action: 'Night Perimeter Stranger Alert', desc: 'Triggers late-night loitering detection, auto-deadbolt lock, 100% floodlight, and security PiP' },
    { key: '4', action: 'Movie Night Intercom Handoff', desc: 'Triggers doorbell ring during media playback, auto-pauses Fire TV, and summons 2-way intercom' },
    { key: 'A', action: '▶ Judge Auto-Pilot (90s Tour)', desc: 'Automatically walks through the 3 core scenarios with on-screen narration banner' },
    { key: 'R', action: 'Reset Ecosystem States', desc: 'Resets all device states and video playback to fresh baseline' },
    { key: '?', action: 'Toggle Shortcuts Help', desc: 'Opens this keyboard shortcuts reference modal' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 17, 17, 0.78)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="double-bezel" style={{ width: '100%', maxWidth: '640px' }}>
        <div className="double-bezel-inner" style={{ padding: '28px', position: 'relative' }}>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn-island"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '6px',
              borderRadius: '50%',
              background: 'var(--surface-1)'
            }}
            aria-label="Close modal"
          >
            <X size={16} color="var(--text-primary)" strokeWidth={2} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 113, 133, 0.15)',
              border: '1.5px solid #007185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Keyboard size={20} color="#007185" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Evaluator Keyboard Shortcuts
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Hands-free rapid scenario execution for hackathon reviewers
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shortcuts.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--bezel-inner-border)',
                  borderRadius: '10px',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.action}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.desc}
                  </div>
                </div>

                <kbd style={{
                  background: '#131921',
                  color: '#ff9900',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}>
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Tip: You can press these keys anytime while the application is active in your browser.
          </div>

        </div>
      </div>
    </div>
  );
};
