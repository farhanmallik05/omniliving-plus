import React, { useRef, useEffect } from 'react';
import { Tv, Play, Pause, Layers } from 'lucide-react';
import { DeviceState, McpClientService } from '../services/api';

interface FireTVLivingRoomProps {
  deviceState: DeviceState | null;
}

export const FireTVLivingRoom: React.FC<FireTVLivingRoomProps> = ({ deviceState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const client = McpClientService.getInstance();
  const fireTv = deviceState?.fireTv;

  const isPlaying = fireTv?.status === 'playing';
  const pipActive = fireTv?.pictureInPictureActive || false;
  const overlayMessage = fireTv?.overlayMessage;

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        try {
          const promise = videoRef.current.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
          }
        } catch {}
      } else {
        try {
          videoRef.current.pause();
        } catch {}
      }
    }
  }, [isPlaying]);

  const togglePlayback = async () => {
    const nextStatus = isPlaying ? 'paused' : 'playing';
    await client.callTool('firetv_push_overlay', {
      message: `Fire TV ${nextStatus === 'playing' ? 'Resumed' : 'Paused'}`,
      enablePictureInPicture: pipActive,
      pauseMedia: nextStatus === 'paused'
    });
  };

  const togglePip = async () => {
    await client.callTool('firetv_push_overlay', {
      message: pipActive ? 'Picture-in-Picture Dismissed' : 'Ring Doorbell Live Feed Inset',
      enablePictureInPicture: !pipActive,
      pauseMedia: !isPlaying
    });
  };

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
              background: 'rgba(230, 74, 25, 0.12)',
              border: '1.5px solid #e64a19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Tv size={18} color="#e64a19" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Fire TV Living Room Screen</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fire OS 4K Media Hub • Prime Video Stream</span>
            </div>
          </div>

          {/* State Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="eyebrow-tag" style={{
              background: isPlaying ? 'rgba(6, 125, 98, 0.12)' : 'rgba(255, 153, 0, 0.14)',
              color: isPlaying ? '#067d62' : '#b12704',
              border: `1px solid ${isPlaying ? '#067d62' : '#ffa41c'}`
            }}>
              {isPlaying ? 'Playing' : 'Paused'}
            </span>
            {pipActive && (
              <span className="eyebrow-tag" style={{
                background: 'rgba(0, 168, 225, 0.14)',
                color: '#007185',
                border: '1px solid #00a8e1'
              }}>
                PiP Active
              </span>
            )}
          </div>
        </div>

        {/* TV Screen Container */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#000000',
          aspectRatio: '16 / 9',
          border: '1px solid var(--bezel-inner-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Prime Video Watermark */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(19, 25, 33, 0.85)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#00a8e1', letterSpacing: '0.04em' }}>
              PRIME VIDEO 4K
            </span>
          </div>

          {/* Top-Right Picture-in-Picture (PiP) Inset */}
          {pipActive && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '38%',
              aspectRatio: '16 / 9',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid #00a8e1',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 168, 225, 0.4)',
              background: '#04070d',
              zIndex: 10
            }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  left: '6px',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'rgba(16, 132, 227, 0.9)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  RING DOORBELL LIVE
                </div>

                {/* Mini doorstep canvas representation */}
                <svg viewBox="0 0 160 90" style={{ width: '100%', height: '100%' }}>
                  <rect width="160" height="90" fill="#38bdf8" />
                  <rect x="0" y="50" width="160" height="40" fill="#64748b" />
                  <rect x="65" y="25" width="30" height="40" fill="#1e293b" />
                  <rect x="70" y="55" width="20" height="15" fill="#d97706" />
                </svg>

                <div className="scan-line" />
              </div>
            </div>
          )}

          {/* Bottom Overlay Toast Banner (Amazon Fire TV Style) */}
          {overlayMessage && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(19, 25, 33, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #ff9900',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9900' }} className="live-dot" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  {overlayMessage}
                </span>
              </div>
              <span className="amazon-badge-orange">
                Alexa+
              </span>
            </div>
          )}

        </div>

        {/* Media Controls Bar */}
        <div style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={togglePlayback}
              className="btn-island btn-amazon-gold"
              style={{ padding: '6px 14px' }}
            >
              {isPlaying ? (
                <>
                  <Pause size={14} color="#0f1111" strokeWidth={2.5} />
                  <span>Pause Media</span>
                </>
              ) : (
                <>
                  <Play size={14} color="#0f1111" strokeWidth={2.5} />
                  <span>Resume Playback</span>
                </>
              )}
            </button>

            <button
              onClick={togglePip}
              className="btn-island"
              style={{
                padding: '6px 14px',
                background: pipActive ? 'rgba(0, 168, 225, 0.12)' : 'var(--surface-0)',
                borderColor: pipActive ? '#00a8e1' : 'var(--bezel-inner-border)',
                color: pipActive ? '#007185' : 'var(--text-primary)'
              }}
            >
              <Layers size={14} strokeWidth={2} />
              <span>{pipActive ? 'Hide Doorbell PiP' : 'Show Doorbell PiP'}</span>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Volume: 65% • Dolby Atmos
          </div>

        </div>

      </div>
    </div>
  );
};
