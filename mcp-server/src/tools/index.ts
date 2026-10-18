import { McpTool } from '../types.js';
import { DeviceStateManager } from '../services/device-state.js';
import { BedrockService } from '../services/bedrock.js';
import { AutomationEngine } from '../services/automation-engine.js';

const stateManager = DeviceStateManager.getInstance();
const bedrockService = new BedrockService();
const automationEngine = AutomationEngine.getInstance();

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'ring_inspect_doorstep',
    description: 'Inspects the front door Ring camera feed, checking motion sensors, doorbell chime status, and recent visitor snapshots.',
    inputSchema: {
      type: 'object',
      properties: {
        zone: {
          type: 'string',
          enum: ['porch', 'walkway', 'driveway'],
          description: 'The detection zone to inspect on the Ring camera.'
        },
        enableIntercom: {
          type: 'boolean',
          description: 'Whether to open two-way audio intercom channel with the doorstep.'
        }
      }
    }
  },
  {
    name: 'bedrock_analyze_scene',
    description: 'Invokes AWS Bedrock (Anthropic Claude 3.5 Sonnet or Amazon Nova) to run multimodal visual reasoning on camera footage. Detects package carriers, delivery status, resident safety, or suspicious behavior.',
    inputSchema: {
      type: 'object',
      properties: {
        scenarioContext: {
          type: 'string',
          description: 'Contextual clue for analysis (e.g., "delivery", "elderly care safety", "night security alert").'
        },
        modelId: {
          type: 'string',
          description: 'AWS Bedrock model ID to invoke (defaults to Claude 3.5 Sonnet).'
        },
        imageBase64: {
          type: 'string',
          description: 'Optional base64 encoded image frame.'
        }
      }
    }
  },
  {
    name: 'firetv_push_overlay',
    description: 'Pushes a live Picture-in-Picture (PiP) feed or toast notification banner to the living room Fire TV, with optional media pause/resume and volume ducking.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Text notification to display on the Fire TV screen.'
        },
        enablePictureInPicture: {
          type: 'boolean',
          description: 'Whether to activate the live Ring doorbell camera PiP inset on the top-right of Fire TV.'
        },
        pauseMedia: {
          type: 'boolean',
          description: 'Whether to pause active Prime Video / Netflix playback while notification is active.'
        },
        durationSeconds: {
          type: 'number',
          description: 'How long the overlay should remain on the TV screen in seconds.'
        }
      },
      required: ['message']
    }
  },
  {
    name: 'bee_sync_vitals',
    description: 'Polls real-time telemetry from the Bee AI wearable or Apple Watch: heart rate, movement status, focus mode, and current room proximity.',
    inputSchema: {
      type: 'object',
      properties: {
        triggerHaptic: {
          type: 'boolean',
          description: 'Whether to pulse the Bee wearable haptic motor for discreet notification.'
        }
      }
    }
  },
  {
    name: 'alexa_dispatch_ambient_action',
    description: 'Executes proactive multimodal action on Alexa+: speaks an announcement across Echo Show devices, toggles smart locks, or adjusts porch lights.',
    inputSchema: {
      type: 'object',
      properties: {
        spokenAnnouncement: {
          type: 'string',
          description: 'The verbal message Alexa+ will articulate to the household.'
        },
        smartLockAction: {
          type: 'string',
          enum: ['lock', 'unlock', 'keep_state'],
          description: 'Target state for the front entrance smart deadbolt.'
        },
        porchLightBrightness: {
          type: 'number',
          description: 'Target brightness for porch lighting (0 to 100 percent).'
        },
        alexaState: {
          type: 'string',
          enum: ['speaking', 'listening', 'thinking', 'idle']
        }
      },
      required: ['spokenAnnouncement']
    }
  },
  {
    name: 'omniliving_orchestrate_scenario',
    description: 'Executes an automated end-to-end multi-device workflow connecting Ring, Fire TV, Alexa+, and AWS Bedrock in one coordinated sequence.',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          enum: ['package_delivery', 'elderly_care_safety', 'night_security_alert', 'movie_night_intercom'],
          description: 'The automated living room & doorstep scenario to trigger.'
        }
      },
      required: ['scenario']
    }
  },
  {
    name: 'automation_list_rules',
    description: 'Lists all active and custom WHEN->IF->THEN automation rules registered in the OmniLiving+ engine.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'automation_create_rule',
    description: 'Creates a dynamic WHEN->IF->THEN multi-device automation rule across Ring, Fire TV, Bee wearable, and Alexa+.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Descriptive title for the rule' },
        when: {
          type: 'object',
          description: 'Trigger event condition (e.g. event: package_detected, source: ring)'
        },
        if: {
          type: 'object',
          description: 'Pre-requisite state conditions (e.g. fireTvPlaying: true, nightMode: true)'
        },
        then: {
          type: 'object',
          description: 'Actions to dispatch across Fire TV, Alexa+, locks, lights, and wearables'
        },
        enabled: { type: 'boolean', description: 'Initial state of the rule (default true)' }
      },
      required: ['name', 'when', 'if', 'then']
    }
  },
  {
    name: 'automation_toggle_rule',
    description: 'Enables or disables an automation rule by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The unique ID of the automation rule to toggle' },
        enabled: { type: 'boolean', description: 'Optional explicit boolean state' }
      },
      required: ['id']
    }
  },
  {
    name: 'automation_delete_rule',
    description: 'Deletes an automation rule by ID from persistent storage.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The unique ID of the automation rule to delete' }
      },
      required: ['id']
    }
  },
  {
    name: 'automation_test_rule',
    description: 'Manually tests and triggers an automation rule across living room devices.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The rule ID to test' }
      },
      required: ['id']
    }
  }
];

export async function executeTool(name: string, args: any) {
  stateManager.logEvent('MCP Protocol', `Executing tool: ${name}`, args);

  switch (name) {
    case 'ring_inspect_doorstep': {
      const zone = args.zone || 'porch';
      const enableIntercom = !!args.enableIntercom;
      const ringState = stateManager.updateRing({
        status: 'motion_detected',
        motionZone: zone,
        intercomActive: enableIntercom
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              zone,
              intercomActive: enableIntercom,
              batteryLevel: ringState.battery,
              cameraStreamUrl: '/assets/sample-doorbell.jpg',
              timestamp: new Date().toISOString(),
              summary: `Ring Doorbell at ${zone} zone active. Intercom channel is ${enableIntercom ? 'OPEN' : 'STANDBY'}.`
            }, null, 2)
          }
        ]
      };
    }

    case 'bedrock_analyze_scene': {
      const analysis = await bedrockService.analyzeScene({
        scenarioContext: args.scenarioContext,
        modelId: args.modelId,
        imageBase64: args.imageBase64
      });

      stateManager.logEvent('AWS Bedrock', `Bedrock analysis complete: ${analysis.verdict}`, {
        modelId: analysis.modelId,
        confidence: analysis.confidence,
        latencyMs: analysis.bedrockMetadata.latencyMs
      });

      if (analysis.details.packageDetected) {
        stateManager.updateRing({ packageDetected: true, visitorDetected: true });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    }

    case 'firetv_push_overlay': {
      const message = args.message;
      const pip = args.enablePictureInPicture !== false;
      const pause = !!args.pauseMedia;

      const tv = stateManager.updateFireTv({
        overlayMessage: message,
        pictureInPictureActive: pip,
        status: pause ? 'paused' : 'playing'
      });

      // Automatically clear overlay after specified duration
      const duration = (args.durationSeconds || 6) * 1000;
      setTimeout(() => {
        stateManager.updateFireTv({
          overlayMessage: null,
          pictureInPictureActive: false,
          status: 'playing'
        });
      }, duration);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              fireTvStatus: tv.status,
              pictureInPicture: pip,
              overlayMessage: message,
              autoDismissSeconds: duration / 1000,
              summary: `Fire TV screen updated. PiP ${pip ? 'ACTIVE' : 'INACTIVE'}, Playback ${tv.status}.`
            }, null, 2)
          }
        ]
      };
    }

    case 'bee_sync_vitals': {
      const triggerHaptic = !!args.triggerHaptic;
      const bee = stateManager.getState().beeWearable;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              connected: bee.connected,
              heartRate: bee.heartRate,
              activityLevel: bee.activityLevel,
              currentRoom: bee.currentRoom,
              focusMode: bee.focusMode,
              battery: bee.battery,
              hapticTriggered: triggerHaptic,
              summary: `Bee Wearable synced: ${bee.heartRate} bpm, located in ${bee.currentRoom}. Haptic pulse: ${triggerHaptic ? 'FIRED' : 'NONE'}.`
            }, null, 2)
          }
        ]
      };
    }

    case 'alexa_dispatch_ambient_action': {
      const phrase = args.spokenAnnouncement;
      const lock = args.smartLockAction;
      const brightness = typeof args.porchLightBrightness === 'number' ? args.porchLightBrightness : 80;

      const alexaUpdates: any = {
        lastSpokenPhrase: phrase,
        state: 'speaking',
        porchLightBrightness: brightness
      };

      if (lock === 'lock' || lock === 'unlock') {
        alexaUpdates.smartLockState = lock === 'lock' ? 'locked' : 'unlocked';
      }

      stateManager.updateAlexa(alexaUpdates);

      setTimeout(() => {
        stateManager.updateAlexa({ state: 'idle' });
      }, 5000);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              spokenAnnouncement: phrase,
              smartLockState: alexaUpdates.smartLockState || 'unchanged',
              porchLightBrightness: brightness,
              summary: `Alexa+ dispatched announcement: "${phrase}". Smart lock: ${alexaUpdates.smartLockState || 'unchanged'}.`
            }, null, 2)
          }
        ]
      };
    }

    case 'omniliving_orchestrate_scenario': {
      const scenario = args.scenario;

      if (scenario === 'package_delivery') {
        stateManager.updateRing({ status: 'motion_detected', visitorDetected: true, packageDetected: false });
        
        const analysis = await bedrockService.analyzeScene({
          scenarioContext: 'Amazon Prime delivery courier dropping package on porch'
        });

        stateManager.updateRing({ packageDetected: true });

        stateManager.updateFireTv({
          pictureInPictureActive: true,
          overlayMessage: 'Ring Doorbell: Amazon Delivery Arrived with Package',
          status: 'paused'
        });

        stateManager.updateAlexa({
          state: 'speaking',
          lastSpokenPhrase: 'Amazon delivery driver just dropped off your parcel at the front porch. I have displayed the live view on your Fire TV.'
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                scenario: 'package_delivery',
                status: 'executed',
                bedrockInference: analysis.verdict,
                devicesOrchestrated: ['Ring Doorbell', 'Fire TV PiP Overlay', 'Alexa+ Voice Announcement'],
                summary: 'Coordinated package delivery workflow completed successfully.'
              }, null, 2)
            }
          ]
        };
      } else if (scenario === 'elderly_care_safety') {
        stateManager.updateRing({ status: 'motion_detected', visitorDetected: true });
        
        const analysis = await bedrockService.analyzeScene({
          scenarioContext: 'elderly family member safety standstill'
        });

        stateManager.updateFireTv({
          pictureInPictureActive: true,
          overlayMessage: 'Elderly Care Alert: Prolonged standstill detected near front steps'
        });

        stateManager.updateAlexa({
          state: 'speaking',
          lastSpokenPhrase: 'Safety check: Grandma has paused near the front steps. Would you like me to open the intercom channel?'
        });

        stateManager.updateBee({ triggerHaptic: true, heartRate: 84 } as any);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                scenario: 'elderly_care_safety',
                status: 'executed',
                bedrockInference: analysis.verdict,
                devicesOrchestrated: ['Ring Doorbell', 'Fire TV Warning Banner', 'Alexa+ Gentle Check-in', 'Bee Wearable Haptic Pulse'],
                summary: 'Proactive ambient care routine dispatched across all touchpoints.'
              }, null, 2)
            }
          ]
        };
      } else if (scenario === 'night_security_alert') {
        stateManager.updateRing({ status: 'motion_detected', visitorDetected: true });
        
        const analysis = await bedrockService.analyzeScene({
          scenarioContext: 'night security alert perimeter stranger'
        });

        stateManager.updateAlexa({
          porchLightBrightness: 100,
          smartLockState: 'locked',
          state: 'speaking',
          lastSpokenPhrase: 'Security alert: Unidentified individual detected lingering near front porch. Front deadbolt secured and porch illumination raised to 100%.'
        });

        stateManager.updateFireTv({
          pictureInPictureActive: true,
          overlayMessage: 'SECURITY: Unknown person detected at front perimeter. Porch illuminated.'
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                scenario: 'night_security_alert',
                status: 'executed',
                bedrockInference: analysis.verdict,
                actionsTaken: ['Deadbolt Locked', 'Floodlights 100%', 'Fire TV High-Priority PiP Inset', 'Alexa Voice Warning'],
                summary: 'Security hardening routine executed via autonomous agent copilot.'
              }, null, 2)
            }
          ]
        };
      } else {
        // movie night intercom
        stateManager.updateRing({ status: 'ringing', visitorDetected: true });
        stateManager.updateFireTv({
          pictureInPictureActive: true,
          overlayMessage: 'Doorbell Ring: Guest at front door',
          status: 'paused'
        });
        stateManager.updateAlexa({
          state: 'speaking',
          lastSpokenPhrase: 'Someone just rang the front doorbell. Pausing Fire TV and showing live view.'
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                scenario: 'movie_night_intercom',
                status: 'executed',
                summary: 'Seamless movie night intercom handoff completed.'
              }, null, 2)
            }
          ]
        };
      }
    }

    case 'automation_list_rules': {
      const rules = automationEngine.getRules();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalRules: rules.length,
              rules
            }, null, 2)
          }
        ]
      };
    }

    case 'automation_create_rule': {
      const rule = automationEngine.createRule({
        name: args.name,
        when: args.when,
        if: args.if,
        then: args.then,
        enabled: args.enabled !== false
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              rule,
              summary: `Created automation rule: "${rule.name}" (${rule.id})`
            }, null, 2)
          }
        ]
      };
    }

    case 'automation_toggle_rule': {
      const updated = automationEngine.toggleRule(args.id, args.enabled);
      if (!updated) throw new Error(`Rule ${args.id} not found.`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              id: updated.id,
              enabled: updated.enabled,
              summary: `Rule "${updated.name}" is now ${updated.enabled ? 'ENABLED' : 'DISABLED'}.`
            }, null, 2)
          }
        ]
      };
    }

    case 'automation_delete_rule': {
      const success = automationEngine.deleteRule(args.id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: success ? 'success' : 'not_found',
              id: args.id,
              deleted: success
            }, null, 2)
          }
        ]
      };
    }

    case 'automation_test_rule': {
      const rule = automationEngine.getRule(args.id);
      if (!rule) throw new Error(`Rule ${args.id} not found.`);
      
      const action = rule.then;
      if (action.pauseFireTv) {
        stateManager.updateFireTv({ status: 'paused' });
      }
      if (action.fireTvPip !== undefined) {
        stateManager.updateFireTv({ pictureInPictureActive: action.fireTvPip, overlayMessage: `Automation Rule Fired: ${rule.name}` });
      }
      if (action.alexaAnnouncement) {
        stateManager.updateAlexa({ lastSpokenPhrase: action.alexaAnnouncement, state: 'speaking' });
      }
      if (action.smartLockAction === 'lock') {
        stateManager.updateAlexa({ smartLockState: 'locked' });
      } else if (action.smartLockAction === 'unlock') {
        stateManager.updateAlexa({ smartLockState: 'unlocked' });
      }
      if (typeof action.porchLightBrightness === 'number') {
        stateManager.updateAlexa({ porchLightBrightness: action.porchLightBrightness });
      }
      if (action.pulseWearableHaptic) {
        stateManager.updateBee({ heartRate: 88 } as any);
      }

      rule.triggerCount += 1;
      rule.lastTriggeredAt = new Date().toISOString();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              testedRule: rule.name,
              dispatchedActions: action,
              summary: `Manually executed automation rule "${rule.name}".`
            }, null, 2)
          }
        ]
      };
    }

    default:
      throw new Error(`Tool "${name}" not found.`);
  }
}
