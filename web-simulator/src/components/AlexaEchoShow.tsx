import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Lock, Unlock, Sun, Radio, Send } from 'lucide-react';
import { DeviceState, McpClientService } from '../services/api';
import { soundSynth } from '../services/sound';

interface AlexaEchoShowProps {
  deviceState: DeviceState | null;
}

interface ISpeechRecognitionEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface ISpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const AlexaEchoShow: React.FC<AlexaEchoShowProps> = ({ deviceState }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceVoice, setVoiceVoice] = useState<SpeechSynthesisVoice | null>(null);
  const client = McpClientService.getInstance();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural')));
        setVoiceVoice(preferred || voices[0] || null);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Speak Alexa's response when phrase updates and state is 'speaking'
  // Audio Ducking Guarantee: Await Fire TV media pause to take acoustic effect before speaking
  useEffect(() => {
    if (deviceState?.alexa.state === 'speaking' && deviceState.alexa.lastSpokenPhrase && 'speechSynthesis' in window) {
      if ('vibrate' in navigator) {
        navigator.vibrate([60, 40, 60]);
      }

      const duckDelayMs = deviceState.fireTv.status === 'paused' ? 120 : 0;
      const timer = setTimeout(() => {
        soundSynth.playAlexaChime();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(deviceState.alexa.lastSpokenPhrase);
        if (voiceVoice) {
          utterance.voice = voiceVoice;
        }
        utterance.rate = 1.05;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }, duckDelayMs);

      return () => clearTimeout(timer);
    }
  }, [deviceState?.alexa.lastSpokenPhrase, deviceState?.alexa.state, deviceState?.fireTv.status, voiceVoice]);

  const handleVoiceInput = () => {
    const SpeechRecognitionConstructor = (window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
    }).SpeechRecognition || (window as unknown as {
      webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      alert('Speech recognition is not supported in this browser. Please use the text input below!');
      return;
    }

    const recognition: ISpeechRecognitionInstance = new SpeechRecognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: 'Listening...',
        alexaState: 'listening'
      });
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleProcessCommand(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleProcessCommand = async (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();

    if (lower.includes('door') || lower.includes('porch') || lower.includes('front') || lower.includes('visitor')) {
      await client.callTool('ring_inspect_doorstep', { zone: 'porch', enableIntercom: true });
      await client.callTool('bedrock_analyze_scene', { scenarioContext: 'front door visitor inspect' });
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: 'I have inspected the front porch. The camera feed is active and no immediate threat is detected.'
      });
    } else if (lower.includes('pause') || lower.includes('tv') || lower.includes('fire')) {
      await client.callTool('firetv_push_overlay', {
        message: 'Alexa+: Ambient command received from Echo Show',
        enablePictureInPicture: true,
        pauseMedia: true
      });
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: 'Pausing Fire TV living room playback and activating picture-in-picture view.'
      });
    } else if (lower.includes('lock') || lower.includes('unlock')) {
      const lockAction = lower.includes('unlock') ? 'unlock' : 'lock';
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: `Front entrance deadbolt is now ${lockAction}ed.`,
        smartLockAction: lockAction
      });
    } else if (lower.includes('light') || lower.includes('brightness')) {
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: 'Porch floodlight illumination adjusted to 100%.',
        porchLightBrightness: 100
      });
    } else {
      await client.callTool('alexa_dispatch_ambient_action', {
        spokenAnnouncement: `I processed your request "${text}" through OmniLiving+ and coordinated your ambient living room and smart home status.`
      });
    }
    setInputText('');
  };

  const alexaState = deviceState?.alexa.state || 'idle';
  const lockState = deviceState?.alexa.smartLockState || 'locked';
  const porchBrightness = deviceState?.alexa.porchLightBrightness ?? 80;

  const toggleLock = async () => {
    const nextLock = lockState === 'locked' ? 'unlock' : 'lock';
    await client.callTool('alexa_dispatch_ambient_action', {
      spokenAnnouncement: `Front door deadbolt has been ${nextLock}ed.`,
      smartLockAction: nextLock
    });
  };

  const handleBrightnessChange = async (val: number) => {
    await client.callTool('alexa_dispatch_ambient_action', {
      porchLightBrightness: val
    });
  };

  return (
    <div className="double-bezel">
      <div className="double-bezel-inner">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: alexaState === 'speaking' ? '#00a8e1' : alexaState === 'listening' ? '#ff9900' : '#067d62',
              boxShadow: `0 0 12px ${alexaState === 'speaking' ? '#00a8e1' : alexaState === 'listening' ? '#ff9900' : '#067d62'}`
            }} className={alexaState !== 'idle' ? 'live-dot' : ''} />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Simulated Alexa<span style={{ color: 'var(--alexa-cyan)' }}>+</span> Smart Display
            </h2>
          </div>
          <span className="eyebrow-tag" style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--bezel-inner-border)' }}>
            Echo Show 15 • Glacier White
          </span>
        </div>

        {/* Main Ambient Voice Display & Halo */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
          borderRadius: '16px',
          border: '1px solid var(--bezel-inner-border)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '220px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {/* Scan line when speaking */}
          {alexaState === 'speaking' && <div className="scan-line" />}

          {/* Pulsing Alexa Halo */}
          <div 
            className={`${alexaState !== 'idle' ? 'alexa-halo-active' : ''} ${isListening ? 'alexa-listening' : ''}`}
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00a8e1 0%, #007185 60%, #131921 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.35s var(--ease-spring)',
              boxShadow: alexaState === 'speaking' 
                ? '0 0 35px rgba(0, 168, 225, 0.65), 0 0 65px rgba(0, 113, 133, 0.35)'
                : alexaState === 'listening'
                ? '0 0 35px rgba(255, 153, 0, 0.65)'
                : '0 0 16px rgba(0, 168, 225, 0.25)'
            }}
            onClick={handleVoiceInput}
            title="Click to speak with Alexa+"
          >
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'var(--surface-0)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {alexaState === 'listening' || isListening ? (
                <Mic size={26} color="#ff9900" strokeWidth={2} />
              ) : alexaState === 'speaking' ? (
                <Volume2 size={26} color="#00a8e1" strokeWidth={2} />
              ) : (
                <Radio size={24} color="#007185" strokeWidth={2} />
              )}
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isListening ? 'Listening' : alexaState}
              </span>
            </div>
          </div>

          {/* Waveform visualizer when speaking */}
          {alexaState === 'speaking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', height: '40px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="wave-bar"
                  style={{ width: '4px', background: '#00a8e1' }}
                />
              ))}
            </div>
          )}

          {/* Live Spoken Transcript */}
          {alexaState !== 'speaking' && (
            <div style={{ marginTop: '16px', textAlign: 'center', maxWidth: '85%' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                minHeight: '40px'
              }}>
                "{deviceState?.alexa.lastSpokenPhrase || 'OmniLiving+ is active. How can I assist your home today?'}"
              </p>
            </div>
          )}
          {alexaState === 'speaking' && (
            <div style={{ marginTop: '6px', textAlign: 'center', maxWidth: '85%' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.5, color: '#007185', minHeight: '40px' }}>
                "{deviceState?.alexa.lastSpokenPhrase}"
              </p>
            </div>
          )}

        </div>

        {/* Input Bar with Amazon Button */}
        <div style={{ marginTop: '16px' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleProcessCommand(inputText); }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Ask Alexa+: "Inspect front porch" or "Pause Fire TV"...'
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1.5px solid var(--input-border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  paddingRight: '40px',
                  color: 'var(--input-color)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--input-border-focus)';
                  e.currentTarget.style.boxShadow = 'var(--input-shadow-focus)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--input-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isListening ? '#ff9900' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Voice Input"
              >
                <Mic size={18} />
              </button>
            </div>

            <button 
              type="submit"
              className="btn-island btn-amazon-gold"
              style={{ padding: '0 18px', borderRadius: '10px' }}
            >
              <Send size={15} color="#0f1111" strokeWidth={2} />
              <span>Send</span>
            </button>
          </form>

          {/* Quick Prompts Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {[
              'Inspect front porch',
              'Pause living room Fire TV',
              'Lock entrance deadbolt',
              'Porch floodlight 100%'
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleProcessCommand(cmd)}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--bezel-inner-border)',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#007185';
                  e.currentTarget.style.color = '#007185';
                  e.currentTarget.style.background = 'var(--surface-0)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bezel-inner-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'var(--surface-1)';
                }}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Ambient Home Controls Bar */}
        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--bezel-inner-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          {/* Smart Deadbolt */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lockState === 'locked' ? (
                <Lock size={16} color="#067d62" strokeWidth={2} />
              ) : (
                <Unlock size={16} color="#c40000" strokeWidth={2} />
              )}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Entrance Lock</div>
                <div style={{ fontSize: '10px', color: lockState === 'locked' ? '#067d62' : '#c40000', fontWeight: 600, textTransform: 'capitalize' }}>
                  {lockState}
                </div>
              </div>
            </div>

            <button
              onClick={toggleLock}
              className="btn-island"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: 'var(--surface-0)'
              }}
            >
              {lockState === 'locked' ? 'Unlock' : 'Lock'}
            </button>
          </div>

          {/* Porch Illumination */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sun size={16} color="#ff9900" strokeWidth={2} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Porch Light</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {porchBrightness}%
                </div>
              </div>
            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={porchBrightness} 
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              style={{ width: '70px', accentColor: '#ff9900', cursor: 'pointer' }}
            />
          </div>

        </div>

      </div>
    </div>
  );
};
