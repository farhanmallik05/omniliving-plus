export interface DeviceState {
  ring: {
    status: 'online' | 'motion_detected' | 'ringing' | 'idle';
    battery: number;
    lastMotionTimestamp: string;
    lastCameraSnapshotUrl: string;
    visitorDetected: boolean;
    packageDetected: boolean;
    intercomActive: boolean;
    motionZone: 'porch' | 'walkway' | 'driveway';
  };
  fireTv: {
    status: 'playing' | 'paused' | 'standby';
    currentApp: string;
    nowPlayingTitle: string;
    volume: number;
    pictureInPictureActive: boolean;
    overlayMessage: string | null;
    streamUrl: string;
  };
  beeWearable: {
    connected: boolean;
    heartRate: number;
    activityLevel: 'resting' | 'walking' | 'active';
    focusMode: boolean;
    currentRoom: string;
    battery: number;
  };
  alexa: {
    state: 'idle' | 'listening' | 'thinking' | 'speaking';
    lastSpokenPhrase: string;
    chimeSoundActive: boolean;
    smartLockState: 'locked' | 'unlocked';
    porchLightBrightness: number;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  when: {
    event: string;
    source: string;
  };
  if: {
    fireTvPlaying?: boolean;
    nightMode?: boolean;
    heartRateThreshold?: number;
    roomEquals?: string;
  };
  then: {
    fireTvPip?: boolean;
    pauseFireTv?: boolean;
    alexaAnnouncement?: string;
    smartLockAction?: 'lock' | 'unlock' | 'none';
    porchLightBrightness?: number;
    pulseWearableHaptic?: boolean;
  };
  triggerCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface McpLogEntry {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

export interface McpPacket {
  id: string;
  timestamp: string;
  direction: 'outgoing' | 'incoming';
  method?: string;
  payload: any;
}

const MCP_ENDPOINT = 'http://localhost:3001/mcp';
const API_BASE = 'http://localhost:3001';

export class McpClientService {
  private static instance: McpClientService;
  private sse: EventSource | null = null;
  private packetListeners: Array<(packet: McpPacket) => void> = [];
  private stateListeners: Array<(state: DeviceState) => void> = [];
  private sessionId: string = 'session_' + Math.random().toString(36).substring(2, 9);

  private constructor() {
    this.connectSse();
  }

  public static getInstance(): McpClientService {
    if (!McpClientService.instance) {
      McpClientService.instance = new McpClientService();
    }
    return McpClientService.instance;
  }

  public connectSse() {
    if (this.sse) {
      this.sse.close();
    }

    try {
      this.sse = new EventSource(`${API_BASE}/sse`);

      this.sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.logPacket('incoming', data.method || 'stream/notification', data);

          if (data.params?.state) {
            this.notifyState(data.params.state);
          }
        } catch (e) {
          console.warn('SSE parse error:', e);
        }
      };

      this.sse.onerror = () => {
        // SSE disconnected, will retry automatically
      };
    } catch (err) {
      console.warn('SSE initialization error:', err);
    }
  }

  private logPacket(direction: 'outgoing' | 'incoming', method: string, payload: any) {
    const packet: McpPacket = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      method,
      payload
    };
    for (const listener of this.packetListeners) {
      listener(packet);
    }
  }

  public subscribePackets(cb: (packet: McpPacket) => void) {
    this.packetListeners.push(cb);
    return () => {
      this.packetListeners = this.packetListeners.filter(l => l !== cb);
    };
  }

  public subscribeState(cb: (state: DeviceState) => void) {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== cb);
    };
  }

  private notifyState(state: DeviceState) {
    for (const l of this.stateListeners) {
      l(state);
    }
  }

  public async sendJsonRpc(method: string, params?: any): Promise<any> {
    const reqPayload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    this.logPacket('outgoing', method, reqPayload);

    try {
      const res = await fetch(MCP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': this.sessionId
        },
        body: JSON.stringify(reqPayload)
      });

      const resData = await res.json();
      this.logPacket('incoming', method, resData);

      // Refresh state after tool execution
      this.fetchState();

      return resData;
    } catch (err) {
      console.error('MCP JSON-RPC request failed:', err);
      throw err;
    }
  }

  public async fetchState(): Promise<DeviceState | null> {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      const data: DeviceState = await res.json();
      this.notifyState(data);
      return data;
    } catch (err) {
      return null;
    }
  }

  public async fetchLogs(): Promise<McpLogEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async resetState(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
      await this.fetchState();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }

  // AUTOMATION RULES APIS
  public async fetchAutomations(): Promise<AutomationRule[]> {
    try {
      const res = await fetch(`${API_BASE}/api/automations`);
      const data = await res.json();
      return data.rules || [];
    } catch {
      return [];
    }
  }

  public async createAutomation(rule: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await fetch(`${API_BASE}/api/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    return await res.json();
  }

  public async toggleAutomation(id: string, enabled?: boolean): Promise<AutomationRule> {
    const res = await fetch(`${API_BASE}/api/automations/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    return await res.json();
  }

  public async deleteAutomation(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/automations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return !!data.success;
  }

  public async testAutomation(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/automations/${id}/test`, { method: 'POST' });
    const data = await res.json();
    await this.fetchState();
    return data;
  }

  // High-level tool callers
  public async callTool(name: string, args: any) {
    return this.sendJsonRpc('tools/call', { name, arguments: args });
  }

  public async triggerScenario(scenario: 'package_delivery' | 'elderly_care_safety' | 'night_security_alert' | 'movie_night_intercom') {
    return this.callTool('omniliving_orchestrate_scenario', { scenario });
  }
}
