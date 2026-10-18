import { McpResource } from '../types.js';
import { DeviceStateManager } from '../services/device-state.js';

const stateManager = DeviceStateManager.getInstance();

export const MCP_RESOURCES: McpResource[] = [
  {
    uri: 'system://devices/status',
    name: 'Real-time Ambient Device Status',
    description: 'Current operational telemetry and states for Ring, Fire TV, Bee Wearable, and Alexa+ devices.',
    mimeType: 'application/json'
  },
  {
    uri: 'system://logs/events',
    name: 'OmniLiving Event Audit Log',
    description: 'Chronological timeline of ambient sensor triggers, Bedrock vision inferences, and cross-device actions.',
    mimeType: 'application/json'
  }
];

export function readResource(uri: string) {
  if (uri === 'system://devices/status') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stateManager.getState(), null, 2)
        }
      ]
    };
  }

  if (uri === 'system://logs/events') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stateManager.getLogs(), null, 2)
        }
      ]
    };
  }

  throw new Error(`Resource with URI "${uri}" not found.`);
}
