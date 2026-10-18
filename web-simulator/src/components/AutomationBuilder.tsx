import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Play, ToggleLeft, ToggleRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AutomationRule, McpClientService } from '../services/api';
import { soundSynth } from '../services/sound';

export const AutomationBuilder: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [whenEvent, setWhenEvent] = useState('package_detected');
  const [whenSource, setWhenSource] = useState('ring');
  const [ifFireTvPlaying, setIfFireTvPlaying] = useState(true);
  const [ifNightMode, setIfNightMode] = useState(false);
  const [thenPip, setThenPip] = useState(true);
  const [thenPause, setThenPause] = useState(true);
  const [thenLock, setThenLock] = useState<'none' | 'lock' | 'unlock'>('none');
  const [thenHaptic, setThenHaptic] = useState(false);
  const [thenAnnouncement, setThenAnnouncement] = useState('Custom automation executed on Alexa+');

  const client = McpClientService.getInstance();

  const loadRules = async () => {
    const list = await client.fetchAutomations();
    setRules(list);
  };

  useEffect(() => {
    loadRules();
    const interval = setInterval(loadRules, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    soundSynth.playAlexaChime();
    const updated = await client.toggleAutomation(id, !current);
    if (updated) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: updated.enabled } : r));
    }
  };

  const handleDelete = async (id: string) => {
    soundSynth.playAlexaChime();
    const success = await client.deleteAutomation(id);
    if (success) {
      setRules(prev => prev.filter(r => r.id !== id));
      setFeedback('Rule deleted successfully');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleTest = async (id: string, name: string) => {
    setTestingId(id);
    soundSynth.playDoorbellChime();
    try {
      await client.testAutomation(id);
      setFeedback(`Fired rule "${name}"! Check Living Room TV and Alexa+`);
    } catch {
      setFeedback('Test execution failed');
    }
    setTimeout(() => {
      setTestingId(null);
      setFeedback(null);
    }, 3000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    soundSynth.playAlexaChime();
    const newRule = await client.createAutomation({
      name: ruleName.trim(),
      when: { event: whenEvent, source: whenSource },
      if: {
        fireTvPlaying: ifFireTvPlaying,
        nightMode: ifNightMode
      },
      then: {
        fireTvPip: thenPip,
        pauseFireTv: thenPause,
        smartLockAction: thenLock,
        pulseWearableHaptic: thenHaptic,
        alexaAnnouncement: thenAnnouncement
      },
      enabled: true
    });

    if (newRule && newRule.id) {
      setRules(prev => [...prev, newRule]);
      setIsCreating(false);
      setRuleName('');
      setFeedback(`Created rule "${newRule.name}"`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="double-bezel">
      <div className="double-bezel-inner" style={{ padding: '22px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255, 153, 0, 0.12)',
              border: '1.5px solid #ff9900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={18} color="#ff9900" strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Interactive Automation Studio
                </h3>
                <span className="eyebrow-tag" style={{ background: 'rgba(0, 113, 133, 0.15)', color: '#007185' }}>
                  {rules.length} Active Rules
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Dynamic WHEN $\to$ IF $\to$ THEN multi-device trigger engine
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{isCreating ? 'Cancel' : 'Create Custom Rule'}</span>
          </button>
        </div>

        {/* Action Feedback Banner */}
        {feedback && (
          <div style={{
            background: 'rgba(6, 125, 98, 0.12)',
            border: '1px solid #067d62',
            color: '#067d62',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={15} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Create Rule Form Modal / Expandable */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} style={{
            background: 'var(--surface-1)',
            border: '1.5px solid #ff9900',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#ff9900' }}>
              <Sparkles size={16} />
              <span>Define New Ambient Multi-Device Rule</span>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Rule Title</label>
              <input
                type="text"
                placeholder="e.g. Quiet Hours Vacation Rental Lockdown"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--bezel-inner-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Grid of When / If / Then */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* WHEN */}
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#007185' }}>1. WHEN (Trigger Event)</span>
                <select
                  value={whenEvent}
                  onChange={(e) => {
                    setWhenEvent(e.target.value);
                    if (e.target.value === 'heart_rate_spike') setWhenSource('beeWearable');
                    else setWhenSource('ring');
                  }}
                  style={{ width: '100%', marginTop: '6px', padding: '6px', borderRadius: '6px', fontSize: '11px', background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--bezel-inner-border)' }}
                >
                  <option value="package_detected">Courier Package Detected (Ring)</option>
                  <option value="doorbell_chime">Doorbell Rings (Ring)</option>
                  <option value="motion_detected">Motion Detected on Porch</option>
                  <option value="heart_rate_spike">Vitals Spike &gt;95 bpm (Bee)</option>
                </select>
              </div>

              {/* IF */}
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff9900' }}>2. IF (Conditions)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={ifFireTvPlaying} onChange={(e) => setIfFireTvPlaying(e.target.checked)} />
                    <span>Fire TV Playing Media</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={ifNightMode} onChange={(e) => setIfNightMode(e.target.checked)} />
                    <span>Night Mode / After Dark</span>
                  </label>
                </div>
              </div>

              {/* THEN */}
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#067d62' }}>3. THEN (Dispatched Actions)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={thenPip} onChange={(e) => setThenPip(e.target.checked)} />
                    <span>Show TV PiP Live Stream</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={thenPause} onChange={(e) => setThenPause(e.target.checked)} />
                    <span>Pause Fire TV Playback</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={thenHaptic} onChange={(e) => setThenHaptic(e.target.checked)} />
                    <span>Pulse Wearable Haptic</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Alexa Spoken Announcement Phrase</label>
              <input
                type="text"
                value={thenAnnouncement}
                onChange={(e) => setThenAnnouncement(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--bezel-inner-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn-island"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '12px' }}
              >
                Save & Deploy Rule
              </button>
            </div>
          </form>
        )}

        {/* Rules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {rules.map((rule) => {
            const isTesting = testingId === rule.id;
            return (
              <div
                key={rule.id}
                style={{
                  background: 'var(--surface-1)',
                  border: `1.5px solid ${rule.enabled ? 'var(--bezel-inner-border)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: rule.enabled ? 1 : 0.6,
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Rule Title & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {rule.name}
                    </h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Triggered {rule.triggerCount} times • ID: {rule.id}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggle(rule.id, rule.enabled)}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.enabled ? '#067d62' : '#888', padding: '2px' }}
                  >
                    {rule.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>
                </div>

                {/* Logic Tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#007185', fontSize: '9px', textTransform: 'uppercase' }}>WHEN:</span>
                    <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                      {rule.when?.source}.{rule.when?.event}
                    </code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#ff9900', fontSize: '9px', textTransform: 'uppercase' }}>IF:</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      {Object.keys(rule.if || {}).map(k => `${k}: ${(rule.if as any)[k]}`).join(', ') || 'Always true'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#067d62', fontSize: '9px', textTransform: 'uppercase' }}>THEN:</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '10px', fontWeight: 600 }}>
                      {[
                        rule.then?.fireTvPip && 'Fire TV PiP',
                        rule.then?.pauseFireTv && 'Pause TV',
                        rule.then?.smartLockAction !== 'none' && `Lock: ${rule.then?.smartLockAction}`,
                        rule.then?.pulseWearableHaptic && 'Bee Haptic',
                        rule.then?.alexaAnnouncement && 'Alexa Speaks'
                      ].filter(Boolean).join(' • ') || 'None'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--bezel-inner-border)' }}>
                  <button
                    onClick={() => handleTest(rule.id, rule.name)}
                    disabled={isTesting || !rule.enabled}
                    className="btn-island"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: rule.enabled ? '#007185' : '#888'
                    }}
                  >
                    <Play size={11} fill="currentColor" />
                    <span>{isTesting ? 'Firing...' : 'Test Trigger'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    title="Delete rule"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
