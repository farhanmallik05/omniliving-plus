import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlexaEchoShow } from '../components/AlexaEchoShow';
import { FireTVLivingRoom } from '../components/FireTVLivingRoom';
import { RingDoorbellFeed } from '../components/RingDoorbellFeed';
import { BeeWearableCard } from '../components/BeeWearableCard';
import { AutomationBuilder } from '../components/AutomationBuilder';
import { soundSynth } from '../services/sound';
import { DeviceState } from '../services/api';

const mockDeviceState: DeviceState = {
  ring: {
    status: 'idle',
    battery: 92,
    lastMotionTimestamp: '2026-10-18T10:00:00Z',
    lastCameraSnapshotUrl: '/assets/sample-doorbell.jpg',
    visitorDetected: false,
    packageDetected: false,
    intercomActive: false,
    motionZone: 'porch'
  },
  fireTv: {
    status: 'playing',
    currentApp: 'Prime Video',
    nowPlayingTitle: 'The Rings of Power',
    volume: 60,
    pictureInPictureActive: false,
    overlayMessage: null,
    streamUrl: 'https://example.com/stream.mp4'
  },
  beeWearable: {
    connected: true,
    heartRate: 74,
    activityLevel: 'resting',
    focusMode: false,
    currentRoom: 'Living Room',
    battery: 85
  },
  alexa: {
    state: 'idle',
    lastSpokenPhrase: 'OmniLiving+ is active and guarding your home.',
    chimeSoundActive: false,
    smartLockState: 'locked',
    porchLightBrightness: 80
  }
};

describe('OmniLiving+ Component Test Suite', () => {

  it('renders AlexaEchoShow with active ambient state and controls', () => {
    render(<AlexaEchoShow deviceState={mockDeviceState} />);
    expect(screen.getByText(/Echo Show 15/i)).toBeInTheDocument();
    expect(screen.getByText(/OmniLiving\+ is active/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask Alexa\+:/i)).toBeInTheDocument();
  });

  it('renders Fire TV Living Room screen with media playback telemetry', () => {
    render(<FireTVLivingRoom deviceState={mockDeviceState} />);
    expect(screen.getByText(/Fire TV Living Room Screen/i)).toBeInTheDocument();
    expect(screen.getByText(/Playing/i)).toBeInTheDocument();
  });

  it('renders Ring Doorbell feed with battery and motion status', () => {
    render(<RingDoorbellFeed deviceState={mockDeviceState} />);
    expect(screen.getByText(/Ring Smart Doorbell Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(screen.getByText(/Standby/i)).toBeInTheDocument();
  });

  it('renders Bee Wearable AI card with heart rate and proximity vitals', () => {
    const vibrateSpy = vi.spyOn(window.navigator, 'vibrate');
    render(<BeeWearableCard deviceState={mockDeviceState} />);
    expect(screen.getByText(/Bee Wearable AI/i)).toBeInTheDocument();
    expect(screen.getByText(/74/i)).toBeInTheDocument();
    expect(screen.getByText(/Living Room/i)).toBeInTheDocument();

    const hapticBtn = screen.getByText(/Pulse Haptic/i);
    fireEvent.click(hapticBtn);
    expect(vibrateSpy).toHaveBeenCalled();
  });

  it('renders AutomationBuilder Studio with creation form toggle', () => {
    render(<AutomationBuilder />);
    expect(screen.getByText(/Interactive Automation Studio/i)).toBeInTheDocument();
    const createBtn = screen.getByText(/Create Custom Rule/i);
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(screen.getByText(/Define New Ambient Multi-Device Rule/i)).toBeInTheDocument();
  });

  it('plays synthesized chimes and security alerts via Web Audio API without crashing', () => {
    expect(() => soundSynth.playAlexaChime()).not.toThrow();
    expect(() => soundSynth.playDoorbellChime()).not.toThrow();
    expect(() => soundSynth.playSecurityAlert()).not.toThrow();
  });

});
