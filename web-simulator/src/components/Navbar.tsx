import React, { useState, useEffect } from 'react';
import { Cpu, RotateCcw, Sparkles, ChevronRight, Sun, Moon, Home, HeartPulse, Building2, Keyboard } from 'lucide-react';
import { McpClientService } from '../services/api';

export type EnterpriseMode = 'residential' | 'eldercare' | 'vacation_rental';

interface NavbarProps {
  onOpenPitch: () => void;
  onOpenAIDualEngine: () => void;
  onOpenShortcuts: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  enterpriseMode: EnterpriseMode;
  onSelectEnterpriseMode: (mode: EnterpriseMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPitch,
  onOpenAIDualEngine,
  onOpenShortcuts,
  theme,
  onToggleTheme,
  enterpriseMode,
  onSelectEnterpriseMode
}) => {
  const [serverOnline, setServerOnline] = useState(false);
  const client = McpClientService.getInstance();

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:3001/health');
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    await client.resetState();
  };

  return (
    <header className="floating-island" style={{
      background: '#131921',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: '0 8px 24px rgba(19, 25, 33, 0.28)',
      padding: '12px 24px',
      position: 'sticky',
      top: '12px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Brand & Track Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Amazon Developer / OmniLiving+ Icon Badge */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #232f3e 0%, #131921 100%)',
            border: '1.5px solid #ff9900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255, 153, 0, 0.25)',
            position: 'relative'
          }}>
            <Cpu size={22} color="#ff9900" strokeWidth={1.75} />
            {/* Amazon Smile Arc Accent */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              width: '16px',
              height: '3px',
              borderRadius: '9999px',
              background: '#00a8e1'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                OmniLiving<span style={{ color: '#ff9900' }}>+</span>
              </span>

              <span className="amazon-badge-orange">
                Amazon Hackathon 2026
              </span>

              <span className="eyebrow-tag" style={{ background: 'rgba(0, 168, 225, 0.16)', color: '#00a8e1', border: '1px solid rgba(0, 168, 225, 0.35)' }}>
                Alexa+ Track
              </span>

              {/* Dual-Engine AI Status Pill (Clickable) */}
              <button
                onClick={onOpenAIDualEngine}
                style={{
                  background: 'rgba(255, 153, 0, 0.16)',
                  color: '#ff9900',
                  border: '1px solid rgba(255, 153, 0, 0.4)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Click for AWS Bedrock Dual-Engine Status & Benchmark Verification"
              >
                <span>⚡ Dual-Engine AI: Zero-Config Simulation</span>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', fontWeight: 400 }}>
              Autonomous Multimodal Copilot • Fire TV • Ring • Bee Wearable • MCP Spec 2025-11-25+ Streamable HTTP
            </div>
          </div>
        </div>

        {/* Compact Ecosystem Profile Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {[
            { id: 'residential', label: 'Residential (Hero)', icon: Home },
            { id: 'eldercare', label: 'Eldercare (B2B)', icon: HeartPulse },
            { id: 'vacation_rental', label: 'Rental STR (B2B)', icon: Building2 }
          ].map((mode) => {
            const Icon = mode.icon;
            const active = enterpriseMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onSelectEnterpriseMode(mode.id as EnterpriseMode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 9px',
                  borderRadius: '7px',
                  border: 'none',
                  background: active ? '#007185' : 'transparent',
                  color: active ? '#ffffff' : '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={`Switch Ecosystem Mode: ${mode.label}`}
              >
                <Icon size={12} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Indicators & Control Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Live Server Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: serverOnline ? 'rgba(6, 125, 98, 0.2)' : 'rgba(196, 0, 0, 0.2)',
            border: `1px solid ${serverOnline ? '#067d62' : '#c40000'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: serverOnline ? '#10b981' : '#f43f5e',
              boxShadow: serverOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: serverOnline ? '#34d399' : '#f87171', letterSpacing: '0.02em' }}>
              {serverOnline ? 'MCP Streamable HTTP (3001)' : 'Reconnecting...'}
            </span>
          </div>

          {/* Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="btn-island"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.16)',
              color: '#ffffff',
              padding: '6px 10px'
            }}
            title="Keyboard Shortcuts [?]"
            aria-label="View Keyboard Shortcuts"
          >
            <Keyboard size={13} />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>?</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="btn-island"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.16)',
              color: '#ffffff',
              padding: '6px 12px'
            }}
            title={`Switch to ${theme === 'light' ? 'Dark Mode' : 'Amazon Light Mode'}`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <Moon size={13} color="#ffd814" strokeWidth={1.75} />
                <span style={{ fontSize: '11px' }}>Dark</span>
              </>
            ) : (
              <>
                <Sun size={13} color="#ff9900" strokeWidth={1.75} />
                <span style={{ fontSize: '11px' }}>Light</span>
              </>
            )}
          </button>

          {/* Reset Demo Button */}
          <button 
            onClick={handleReset}
            className="btn-island"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.16)',
              color: '#ffffff',
              padding: '6px 12px'
            }}
            title="Reset simulated environment to defaults [R]"
            aria-label="Reset simulation"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
            <span style={{ fontSize: '11px' }}>Reset</span>
          </button>

          {/* Pitch & Docs Modal Button with Amazon Gold 1-Click Styling */}
          <button 
            onClick={onOpenPitch}
            className="btn-island btn-amazon-gold"
            style={{ padding: '7px 16px' }}
            aria-label="Open pitch and evaluation guide"
          >
            <Sparkles size={14} strokeWidth={2} />
            <span>Evaluation & Pitch</span>
            <div className="icon-badge" style={{ background: 'rgba(15, 17, 17, 0.12)' }}>
              <ChevronRight size={13} color="#0f1111" strokeWidth={2.5} />
            </div>
          </button>

        </div>

      </div>
    </header>
  );
};
