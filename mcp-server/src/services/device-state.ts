import { DeviceState } from '../types.js';
import { DatabaseService } from './database.js';
import { AutomationEngine } from './automation-engine.js';
import { rootLogger } from './logger.js';

export class DeviceStateManager {
  private static instance: DeviceStateManager;
  private state: DeviceState;
  private listeners: Array<(state: DeviceState) => void> = [];
  private db: DatabaseService;
  private automationEngine: AutomationEngine;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.automationEngine = AutomationEngine.getInstance();

    const saved = this.db.getDeviceState<DeviceState>('current');
    if (saved) {
      this.state = saved;
      rootLogger.info('Restored device state from persistent SQLite database.');
    } else {
      this.state = this.getDefaultState();
      this.db.saveDeviceState('current', this.state);
    }
  }

  private getDefaultState(): DeviceState {
    return {
      ring: {
        status: 'idle',
        battery: 94,
        lastMotionTimestamp: new Date().toISOString(),
        lastCameraSnapshotUrl: '/assets/sample-doorbell.jpg',
        visitorDetected: false,
        packageDetected: false,
        intercomActive: false,
        motionZone: 'porch'
      },
      fireTv: {
        status: 'playing',
        currentApp: 'Prime Video',
        nowPlayingTitle: 'The Lord of the Rings: The Rings of Power',
        volume: 65,
        pictureInPictureActive: false,
        overlayMessage: null,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      },
      beeWearable: {
        connected: true,
        heartRate: 72,
        activityLevel: 'resting',
        focusMode: false,
        currentRoom: 'Living Room',
        battery: 88
      },
      alexa: {
        state: 'idle',
        lastSpokenPhrase: 'OmniLiving+ is active and guarding your home.',
        chimeSoundActive: false,
        smartLockState: 'locked',
        porchLightBrightness: 80
      }
    };
  }

  public static getInstance(): DeviceStateManager {
    if (!DeviceStateManager.instance) {
      DeviceStateManager.instance = new DeviceStateManager();
    }
    return DeviceStateManager.instance;
  }

  public getState(): DeviceState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getLogs(limit = 100) {
    const rows = this.db.getEvents(limit);
    return rows.map(r => ({
      timestamp: r.timestamp,
      source: r.source,
      message: r.message,
      level: r.level || 'INFO',
      data: r.data_json ? JSON.parse(r.data_json) : undefined
    }));
  }

  public logEvent(source: string, message: string, data?: any) {
    rootLogger.info(`[${source}] ${message}`, data);
    return {
      timestamp: new Date().toISOString(),
      source,
      message,
      data
    };
  }

  public resetToDefault() {
    this.state = this.getDefaultState();
    this.db.saveDeviceState('current', this.state);
    this.logEvent('System', 'All device states reset to factory defaults');
    this.notify();
  }

  public updateRing(partial: Partial<DeviceState['ring']>) {
    this.state.ring = { ...this.state.ring, ...partial };
    this.db.saveDeviceState('current', this.state);
    this.logEvent('Ring', `Ring state updated: ${partial.status || 'property change'}`, partial);
    
    // Evaluate automation triggers
    if (partial.status === 'ringing') {
      this.dispatchAutomationTrigger('doorbell_chime', 'ring');
    } else if (partial.status === 'motion_detected') {
      this.dispatchAutomationTrigger('motion_detected', 'ring');
    }
    if (partial.packageDetected) {
      this.dispatchAutomationTrigger('package_detected', 'ring');
    }
    if (partial.visitorDetected) {
      this.dispatchAutomationTrigger('visitor_detected', 'ring');
    }

    this.notify();
    return this.state.ring;
  }

  public updateFireTv(partial: Partial<DeviceState['fireTv']>) {
    this.state.fireTv = { ...this.state.fireTv, ...partial };
    this.db.saveDeviceState('current', this.state);
    this.logEvent('Fire TV', `Fire TV updated: ${partial.overlayMessage ? `Overlay: "${partial.overlayMessage}"` : partial.status || 'state change'}`, partial);
    
    if (partial.status === 'playing') {
      this.dispatchAutomationTrigger('firetv_playing', 'fireTv');
    }

    this.notify();
    return this.state.fireTv;
  }

  public updateBee(partial: Partial<DeviceState['beeWearable']>) {
    this.state.beeWearable = { ...this.state.beeWearable, ...partial };
    this.db.saveDeviceState('current', this.state);
    this.logEvent('Bee Wearable', `Bee wearable synced vitals: HR ${this.state.beeWearable.heartRate} bpm`, partial);
    
    if (this.state.beeWearable.heartRate > 95) {
      this.dispatchAutomationTrigger('heart_rate_spike', 'beeWearable');
    }

    this.notify();
    return this.state.beeWearable;
  }

  public updateAlexa(partial: Partial<DeviceState['alexa']>) {
    this.state.alexa = { ...this.state.alexa, ...partial };
    this.db.saveDeviceState('current', this.state);
    if (partial.lastSpokenPhrase) {
      this.logEvent('Alexa+', `Alexa announced: "${partial.lastSpokenPhrase}"`);
    }
    this.notify();
    return this.state.alexa;
  }

  /**
   * Evaluates automation rules and executes corresponding cross-device actions
   */
  private dispatchAutomationTrigger(event: string, source: string, data?: any) {
    try {
      const matches = this.automationEngine.evaluateEvent({ event, source, data }, this.state);
      for (const { rule, action } of matches) {
        this.logEvent('Automation Engine', `Fired rule "${rule.name}" in response to ${source}.${event}`, action);

        if (action.pauseFireTv) {
          this.state.fireTv.status = 'paused';
        }
        if (action.fireTvPip !== undefined) {
          this.state.fireTv.pictureInPictureActive = action.fireTvPip;
        }
        if (action.alexaAnnouncement) {
          this.state.alexa.lastSpokenPhrase = action.alexaAnnouncement;
          this.state.alexa.state = 'speaking';
          setTimeout(() => {
            if (this.state.alexa.state === 'speaking') {
              this.state.alexa.state = 'idle';
              this.notify();
            }
          }, 6000);
        }
        if (action.smartLockAction === 'lock') {
          this.state.alexa.smartLockState = 'locked';
        } else if (action.smartLockAction === 'unlock') {
          this.state.alexa.smartLockState = 'unlocked';
        }
        if (typeof action.porchLightBrightness === 'number') {
          this.state.alexa.porchLightBrightness = action.porchLightBrightness;
        }
      }
    } catch (err) {
      console.warn('[Automation] Error dispatching trigger:', err);
    }
  }

  public subscribe(listener: (state: DeviceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const current = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error('Error notifying state subscriber:', err);
      }
    }
  }
}
