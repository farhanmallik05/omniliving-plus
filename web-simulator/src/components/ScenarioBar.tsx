import React, { useState } from 'react';
import { Package, HeartHandshake, ShieldAlert, Film, ChevronRight, Play, CheckCircle2, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { McpClientService } from '../services/api';
import { soundSynth } from '../services/sound';

export interface AutopilotStatus {
  active: boolean;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  narration: string;
  secondsRemaining: number;
}

interface ScenarioBarProps {
  autopilotStatus?: AutopilotStatus | null;
  onStartAutopilot?: () => void;
  onStopAutopilot?: () => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  autopilotStatus,
  onStartAutopilot,
  onStopAutopilot
}) => {
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const client = McpClientService.getInstance();

  const handleScenario = async (id: 'package_delivery' | 'elderly_care_safety' | 'night_security_alert' | 'movie_night_intercom') => {
    setRunningScenario(id);
    setActiveStep(1);

    if (id === 'night_security_alert') {
      soundSynth.playSecurityAlert();
    } else if (id === 'movie_night_intercom') {
      soundSynth.playDoorbellChime();
    } else {
      soundSynth.playAlexaChime();
    }

    // Step 1 -> 2: Camera Snapshot & Motion Pre-Filter
    setTimeout(() => setActiveStep(2), 500);
    // Step 2 -> 3: Bedrock CV Scene Analysis
    setTimeout(() => setActiveStep(3), 1100);
    // Step 3 -> 4: Fire TV Audio Ducking & PiP Inset
    setTimeout(() => setActiveStep(4), 1700);
    // Step 4 -> 5: Alexa Ambient Confirmation
    setTimeout(() => setActiveStep(5), 2300);

    try {
      await client.triggerScenario(id);
    } finally {
      setTimeout(() => {
        setRunningScenario(null);
        setActiveStep(0);
      }, 3500);
    }
  };

  const scenarios = [
    {
      id: 'package_delivery' as const,
      name: 'Smart Package Delivery',
      key: '1',
      tag: 'Doorstep Vision',
      desc: 'Prime courier arrival • AWS Bedrock parcel detection • Fire TV PiP inset • Alexa voice chime',
      icon: Package,
      accent: '#ff9900'
    },
    {
      id: 'elderly_care_safety' as const,
      name: 'Elderly Care Routine Anomaly',
      key: '2',
      tag: 'Ambient Health',
      desc: 'Prolonged standstill near porch steps • Alexa gentle check-in • Bee wearable haptic alert',
      icon: HeartHandshake,
      accent: '#067d62'
    },
    {
      id: 'night_security_alert' as const,
      name: 'Night Perimeter Stranger Alert',
      key: '3',
      tag: 'Autonomous Defense',
      desc: 'Unknown individual detected lingering • Deadbolt secured • Porch light 100% • High-priority PiP',
      icon: ShieldAlert,
      accent: '#c40000'
    },
    {
      id: 'movie_night_intercom' as const,
      name: 'Movie Night Intercom Handoff',
      key: '4',
      tag: 'Living Room Media',
      desc: 'Doorbell rings • Living room Fire TV auto-pauses • Video PiP summons • Audio intercom connects',
      icon: Film,
      accent: '#007185'
    }
  ];

  return (
    <div className="double-bezel" style={{ maxWidth: '1440px', width: 'calc(100% - 48px)', margin: '0 auto 20px auto' }}>
      <div className="double-bezel-inner" style={{ padding: '18px 22px' }}>
        
        {/* Header with Judge Auto-Pilot CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="eyebrow-tag" style={{ background: 'rgba(255, 153, 0, 0.12)', color: 'var(--amazon-orange)', border: '1px solid rgba(255, 153, 0, 0.3)' }}>
              1-Click Interactive Scenarios
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Amazon Cross-Device Ecosystem Orchestrations
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Keyboard: press <kbd style={{ background: 'var(--surface-1)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--bezel-inner-border)' }}>1</kbd>-<kbd style={{ background: 'var(--surface-1)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--bezel-inner-border)' }}>4</kbd> or <kbd style={{ background: 'var(--surface-1)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--bezel-inner-border)' }}>A</kbd>
            </span>
          </div>

          {/* Judge Auto-Pilot Runner Button */}
          {autopilotStatus?.active ? (
            <button
              onClick={onStopAutopilot}
              className="btn-island"
              style={{
                background: 'rgba(196, 0, 0, 0.15)',
                borderColor: '#c40000',
                color: '#c40000',
                padding: '6px 14px',
                fontWeight: 700
              }}
            >
              <StopCircle size={15} color="#c40000" />
              <span>Stop Auto-Pilot</span>
            </button>
          ) : (
            <button
              onClick={onStartAutopilot}
              className="btn-island btn-amazon-gold"
              style={{
                padding: '7px 16px',
                fontWeight: 800,
                fontSize: '12px'
              }}
              title="Runs a 90-second automated walkthrough of the 3 core ecosystem flows"
            >
              <Play size={13} fill="#0f1111" color="#0f1111" />
              <span>Judge Auto-Pilot (90s Tour)</span>
              <kbd style={{
                background: 'rgba(15, 17, 17, 0.15)',
                color: '#0f1111',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800
              }}>
                A
              </kbd>
            </button>
          )}
        </div>

        {/* Auto-Pilot Narration Banner if Active */}
        {autopilotStatus?.active && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(0, 113, 133, 0.16) 0%, rgba(255, 153, 0, 0.16) 100%)',
            border: '1.5px solid #007185',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#ff9900" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Auto-Pilot Tour [{autopilotStatus.stepNumber}/{autopilotStatus.totalSteps}]: {autopilotStatus.stepName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {autopilotStatus.narration}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Next scenario in {autopilotStatus.secondsRemaining}s
              </span>
              <span className="amazon-badge-orange" style={{ animation: 'pulse 1.5s infinite' }}>
                LIVE TOUR
              </span>
            </div>
          </div>
        )}

        {/* 4 Interactive Scenario Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isRunning = runningScenario === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => handleScenario(sc.id)}
                disabled={!!runningScenario || autopilotStatus?.active}
                style={{
                  background: isRunning ? 'var(--surface-1)' : 'var(--surface-0)',
                  border: `1.5px solid ${isRunning ? sc.accent : 'var(--bezel-inner-border)'}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: (runningScenario || autopilotStatus?.active) ? 'default' : 'pointer',
                  transition: 'all 0.25s var(--ease-spring)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isRunning ? `0 0 20px ${sc.accent}30` : '0 1px 3px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (!runningScenario && !autopilotStatus?.active) {
                    e.currentTarget.style.borderColor = sc.accent;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!runningScenario && !autopilotStatus?.active) {
                    e.currentTarget.style.borderColor = 'var(--bezel-inner-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }
                }}
              >
                {/* Active running pulse border indicator */}
                {isRunning && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: sc.accent
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${sc.accent}14`,
                      border: `1px solid ${sc.accent}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={17} color={sc.accent} strokeWidth={1.75} />
                    </div>
                    <div>
                      <span className="eyebrow-tag" style={{ padding: '1px 6px', fontSize: '10px', background: `${sc.accent}12`, color: sc.accent, fontWeight: 700 }}>
                        {sc.tag}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {sc.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{
                      background: 'var(--surface-1)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--bezel-inner-border)',
                      borderRadius: '5px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 800
                    }}>
                      {sc.key}
                    </kbd>

                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isRunning ? sc.accent : 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isRunning ? (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', animation: 'ping 1s infinite' }} />
                      ) : (
                        <ChevronRight size={13} color="var(--text-secondary)" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {sc.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Unassailable 5-Step Pipeline Stepper (Visible during live scenario execution) */}
        {runningScenario && activeStep > 0 && (
          <div style={{
            marginTop: '16px',
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff9900', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Autonomous Execution Pipeline in Progress
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Stage {activeStep} of 5
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {[
                { step: 1, label: 'Doorbell Motion', desc: 'Ring Snapshot & Pre-Filter' },
                { step: 2, label: 'Bedrock Reasoning', desc: 'Claude 3.5 Sonnet CV' },
                { step: 3, label: 'Acoustic Ducking', desc: 'Fire TV Audio Sync' },
                { step: 4, label: 'Live PiP Inset', desc: 'Top-Right 1080p Stream' },
                { step: 5, label: 'Alexa+ Spoken Chime', desc: 'Streamable MCP Audited' }
              ].map((s) => {
                const isPassed = activeStep > s.step;
                const isCurrent = activeStep === s.step;

                return (
                  <div
                    key={s.step}
                    style={{
                      background: isCurrent ? 'rgba(255, 153, 0, 0.12)' : isPassed ? 'rgba(6, 125, 98, 0.1)' : 'var(--surface-0)',
                      border: `1px solid ${isCurrent ? '#ff9900' : isPassed ? '#067d62' : 'var(--bezel-inner-border)'}`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {isPassed ? (
                        <CheckCircle2 size={13} color="#067d62" />
                      ) : isCurrent ? (
                        <Loader2 size={13} color="#ff9900" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)' }} />
                      )}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isCurrent ? '#ff9900' : isPassed ? '#067d62' : 'var(--text-primary)' }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {s.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
