export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

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
