import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar, EnterpriseMode } from './components/Navbar';
import { ScenarioBar, AutopilotStatus } from './components/ScenarioBar';
import { AlexaEchoShow } from './components/AlexaEchoShow';
import { RingDoorbellFeed } from './components/RingDoorbellFeed';
import { FireTVLivingRoom } from './components/FireTVLivingRoom';
import { BeeWearableCard } from './components/BeeWearableCard';
import { MCPInspector } from './components/MCPInspector';
import { AutomationBuilder } from './components/AutomationBuilder';
import { PitchModal } from './components/PitchModal';
import { AIDualEngineModal } from './components/AIDualEngineModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { DeviceState, McpClientService } from './services/api';
import { HeartPulse, Building2, Sliders } from 'lucide-react';

export const App: React.FC = () => {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isAIDualEngineOpen, setIsAIDualEngineOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [enterpriseMode, setEnterpriseMode] = useState<EnterpriseMode>('residential');
  const [activeTab, setActiveTab] = useState<'devices' | 'automations' | 'mcp'>('devices');
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus | null>(null);

  const client = McpClientService.getInstance();
  const autopilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Initial fetch
    client.fetchState().then((s) => s && setDeviceState(s));

    // Subscribe to real-time state broadcasts (via SSE)
    const unsub = client.subscribeState((newState) => {
      setDeviceState(newState);
    });

    // Polling fallback every 2 seconds
    const interval = setInterval(() => {
      client.fetchState().then((s) => s && setDeviceState(s));
    }, 2000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Stop Auto-Pilot Cleanly
  const stopAutopilot = useCallback(() => {
    if (autopilotTimerRef.current) clearTimeout(autopilotTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAutopilotStatus(null);
  }, []);

  // Judge Auto-Pilot 90-Second Guided Tour
  const startAutopilot = useCallback(async () => {
    stopAutopilot();

    // Step 1: Package Delivery (0 - 28s)
    setAutopilotStatus({
      active: true,
      stepName: 'Smart Package Delivery',
      stepNumber: 1,
      totalSteps: 3,
      narration: 'Scenario 1/3: Prime courier arrives. Watch Fire TV duck audio and pop up 1080p PiP as Bedrock CV detects parcel.',
      secondsRemaining: 28
    });
    await client.triggerScenario('package_delivery');

    let rem = 28;
    countdownTimerRef.current = setInterval(() => {
      rem -= 1;
      setAutopilotStatus(prev => prev ? { ...prev, secondsRemaining: Math.max(0, rem) } : null);
    }, 1000);

    autopilotTimerRef.current = setTimeout(async () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      // Step 2: Elderly Care Anomaly (28 - 58s)
      setAutopilotStatus({
        active: true,
        stepName: 'Elderly Care Routine Anomaly',
        stepNumber: 2,
        totalSteps: 3,
        narration: 'Scenario 2/3: Prolonged standstill near stairs. Bedrock flags safety anomaly; Alexa speaks gentle check-in & Bee wearable pulses.',
        secondsRemaining: 30
      });
      await client.triggerScenario('elderly_care_safety');

      let rem2 = 30;
      countdownTimerRef.current = setInterval(() => {
        rem2 -= 1;
        setAutopilotStatus(prev => prev ? { ...prev, secondsRemaining: Math.max(0, rem2) } : null);
      }, 1000);

      autopilotTimerRef.current = setTimeout(async () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        // Step 3: Night Perimeter Stranger Alert (58 - 88s)
        setAutopilotStatus({
          active: true,
          stepName: 'Night Perimeter Stranger Alert',
          stepNumber: 3,
          totalSteps: 3,
          narration: 'Scenario 3/3: Unknown intruder lingering after dark. OmniLiving+ automatically locks deadbolt, elevates floodlight to 100%, and warns living room.',
          secondsRemaining: 30
        });
        await client.triggerScenario('night_security_alert');

        let rem3 = 30;
        countdownTimerRef.current = setInterval(() => {
          rem3 -= 1;
          setAutopilotStatus(prev => prev ? { ...prev, secondsRemaining: Math.max(0, rem3) } : null);
        }, 1000);

        autopilotTimerRef.current = setTimeout(() => {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setAutopilotStatus(null);
        }, 30000);

      }, 30000);

    }, 28000);

  }, [client, stopAutopilot]);

  // Global Keyboard Shortcuts (1, 2, 3, 4, A, R, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '1') {
        client.triggerScenario('package_delivery');
      } else if (e.key === '2') {
        client.triggerScenario('elderly_care_safety');
      } else if (e.key === '3') {
        client.triggerScenario('night_security_alert');
      } else if (e.key === '4') {
        client.triggerScenario('movie_night_intercom');
      } else if (e.key === 'a' || e.key === 'A') {
        if (autopilotStatus?.active) stopAutopilot();
        else startAutopilot();
      } else if (e.key === 'r' || e.key === 'R') {
        client.resetState();
      } else if (e.key === '?') {
        setIsShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [client, autopilotStatus, startAutopilot, stopAutopilot]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
      
      {/* Top Amazon Header Navbar with Enterprise Profile Switcher */}
      <Navbar 
        onOpenPitch={() => setIsPitchOpen(true)} 
        onOpenAIDualEngine={() => setIsAIDualEngineOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        enterpriseMode={enterpriseMode}
        onSelectEnterpriseMode={setEnterpriseMode}
      />

      {/* Enterprise Profile Context Banner (Only displayed when switched away from default residential) */}
      {enterpriseMode !== 'residential' && (
        <div style={{
          maxWidth: '1440px',
          width: 'calc(100% - 48px)',
          margin: '10px auto 0 auto',
          background: enterpriseMode === 'eldercare' ? 'rgba(6, 125, 98, 0.12)' : 'rgba(0, 113, 133, 0.12)',
          border: `1.5px solid ${enterpriseMode === 'eldercare' ? '#067d62' : '#007185'}`,
          borderRadius: '12px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {enterpriseMode === 'eldercare' ? (
              <HeartPulse size={20} color="#067d62" />
            ) : (
              <Building2 size={20} color="#007185" />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {enterpriseMode === 'eldercare'
                  ? 'Enterprise Mode: Assisted Living & Senior Care Community Active'
                  : 'Enterprise Mode: Vacation Rental Property Host Active (Airbnb / VRBO)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {enterpriseMode === 'eldercare'
                  ? 'Autonomous fall standstill detection, nurse station event logs, and wearable physiological telemetry active.'
                  : 'Automated quiet hours enforcement (10 PM), unauthorized guest party detection, and remote deadbolt verification active.'}
              </div>
            </div>
          </div>

          <span className="eyebrow-tag" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)', border: '1px solid var(--bezel-inner-border)' }}>
            Enterprise B2B License
          </span>
        </div>
      )}

      {/* 1-Click Interactive Hackathon Scenarios (Always Visible) */}
      <ScenarioBar 
        autopilotStatus={autopilotStatus}
        onStartAutopilot={startAutopilot}
        onStopAutopilot={stopAutopilot}
      />

      {/* Navigation View Switcher */}
      <div style={{
        maxWidth: '1440px',
        width: 'calc(100% - 48px)',
        margin: '0 auto 14px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '640px' }}>
          {[
            { id: 'devices', label: 'Living Room Ecosystem (Core Demo)' },
            { id: 'mcp', label: 'MCP Protocol Inspector (JSON-RPC Stream)' },
            { id: 'automations', label: 'Automation Studio (WHEN→IF→THEN)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="btn-island"
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 800 : 500,
                background: activeTab === tab.id ? '#007185' : 'var(--surface-1)',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                borderColor: activeTab === tab.id ? '#007185' : 'var(--bezel-inner-border)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Focus Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <Sliders size={13} color="#ff9900" />
          <span>Focused Living Room Evaluation Mode</span>
        </div>
      </div>

      {/* Main Grid: Living Room, Front Door, Echo Show & MCP Protocol Inspector */}
      {(activeTab === 'devices' || activeTab === 'mcp') && (
        <main className="main-grid" style={{ flex: 1, marginBottom: '24px' }}>
          
          {/* Column 1: Alexa+ Echo Show Smart Display & Fire TV */}
          <div className="main-col-left">
            <AlexaEchoShow deviceState={deviceState} />
            <FireTVLivingRoom deviceState={deviceState} />
          </div>

          {/* Column 2: Ring Doorbell, Bee Wearable & Protocol Inspector */}
          <div className="main-col-right">
            <RingDoorbellFeed deviceState={deviceState} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <BeeWearableCard deviceState={deviceState} />
            </div>

            <div style={{ flex: 1, minHeight: '340px' }}>
              <MCPInspector />
            </div>
          </div>

        </main>
      )}

      {/* Interactive Automation Builder Studio (Rendered ONLY when the user explicitly clicks the Automations Tab) */}
      {activeTab === 'automations' && (
        <div style={{ maxWidth: '1440px', width: 'calc(100% - 48px)', margin: '0 auto 24px auto' }}>
          <AutomationBuilder />
        </div>
      )}

      {/* Modals */}
      <PitchModal isOpen={isPitchOpen} onClose={() => setIsPitchOpen(false)} />
      <AIDualEngineModal isOpen={isAIDualEngineOpen} onClose={() => setIsAIDualEngineOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

    </div>
  );
};

export default App;
