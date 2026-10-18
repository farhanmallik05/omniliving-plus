import { McpPrompt } from '../types.js';

export const MCP_PROMPTS: McpPrompt[] = [
  {
    name: 'emergency_triage',
    description: 'Instructs Alexa+ how to assess potential household security or elderly care anomalies safely and calmly.',
    arguments: [
      {
        name: 'anomalyType',
        description: 'Nature of anomaly: e.g. "standstill", "stranger_at_perimeter", "vitals_spike"',
        required: true
      }
    ]
  },
  {
    name: 'package_delivery_brief',
    description: 'Instructs Alexa+ how to handle an incoming delivery courteously with Fire TV overlay and smart lock verification.',
    arguments: [
      {
        name: 'carrier',
        description: 'Name of the courier service detected by AWS Bedrock (e.g. "Amazon Prime", "FedEx", "UPS")',
        required: false
      }
    ]
  },
  {
    name: 'movie_night_sync',
    description: 'Instructs Alexa+ how to pause entertainment smoothly, display a picture-in-picture front door feed, and restore playback.',
    arguments: [
      {
        name: 'callerName',
        description: 'Name of visitor or general doorbell chime',
        required: false
      }
    ]
  }
];

export function getPrompt(name: string, args: Record<string, string> = {}) {
  switch (name) {
    case 'emergency_triage':
      return {
        description: 'Household Safety & Emergency Protocol',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are OmniLiving+ Emergency Intelligence for Amazon Alexa+. Maintain a calm, respectful tone. Inquire about safety, check sensor vitals, and provide immediate escalation options.'
            }
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Detected anomaly: ${args.anomalyType || 'unknown'}. Formulate an immediate ambient check-in verbalization and determine whether to trigger family mobile alert.`
            }
          }
        ]
      };

    case 'package_delivery_brief':
      return {
        description: 'Contextual Package Delivery Handoff',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are OmniLiving+ Doorstep Copilot for Alexa+. Announce parcel arrivals concisely so living room viewers are informed without losing movie immersion.'
            }
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Courier detected: ${args.carrier || 'Amazon Delivery'}. Generate a brief voice notice for Echo Show and Fire TV toast.`
            }
          }
        ]
      };

    case 'movie_night_sync':
      return {
        description: 'Living Room Media & Intercom Synchronization',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are OmniLiving+ Entertainment Coordinator. Ensure seamless transitions between living room TV playback and front door intercom.'
            }
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Visitor notification: ${args.callerName || 'Doorbell Ring'}. Orchestrate Fire TV picture-in-picture overlay and prepare intercom channel.`
            }
          }
        ]
      };

    default:
      throw new Error(`Prompt "${name}" not found.`);
  }
}
