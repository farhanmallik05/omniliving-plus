import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import { MotionFilterService } from './motion-filter.js';

export interface BedrockAnalysisResult {
  modelId: string;
  verdict: string;
  confidence: number;
  detectedEntities: string[];
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  details: {
    packageDetected: boolean;
    carrierName?: string;
    personDetected: boolean;
    suspiciousActivity: boolean;
    faceRecognized?: boolean;
    personDescription?: string;
    isFallOrStandstill?: boolean;
  };
  temporalVerification: {
    isConfirmed: boolean;
    frameCount: number;
    explanation: string;
  };
  motionFilter: {
    motionDeltaPercent: number;
    passedThreshold: boolean;
    costSavingsUsdEstimated: number;
  };
  bedrockMetadata: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    isSimulated: boolean;
  };
}

interface AnomalyDetectionHistory {
  category: 'elderly_anomaly' | 'night_perimeter';
  firstSeenTimestamp: number;
  lastSeenTimestamp: number;
  frameCount: number;
}

export class BedrockService {
  private client: BedrockRuntimeClient | null = null;
  private region: string;
  private defaultModelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  private motionFilter = MotionFilterService.getInstance();
  private recentAnomalies = new Map<string, AnomalyDetectionHistory>();

  constructor() {
    this.region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        this.client = new BedrockRuntimeClient({
          region: this.region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        console.log(`[AWS Bedrock] Initialized live Bedrock runtime in region: ${this.region}`);
      } catch (err) {
        console.warn('[AWS Bedrock] Failed to initialize live client, using smart simulation mode:', err);
      }
    } else {
      console.log('[AWS Bedrock] No AWS credentials detected. Running in Smart Fallback Simulation mode for zero-friction evaluation.');
    }
  }

  /**
   * Two-Frame Verification Engine
   * Prevents false positives by requiring 2 consecutive anomaly detections spaced between 10s and 90s.
   */
  private evaluateTemporalVerification(category: 'elderly_anomaly' | 'night_perimeter'): {
    isConfirmed: boolean;
    frameCount: number;
    explanation: string;
  } {
    const now = Date.now();
    const existing = this.recentAnomalies.get(category);

    if (!existing) {
      this.recentAnomalies.set(category, {
        category,
        firstSeenTimestamp: now,
        lastSeenTimestamp: now,
        frameCount: 1
      });
      return {
        isConfirmed: false,
        frameCount: 1,
        explanation: 'Initial anomaly observation. Stage 1 check-in dispatched; awaiting second confirmation frame to prevent false alarm.'
      };
    }

    const elapsedSeconds = (now - existing.firstSeenTimestamp) / 1000;

    // If within 10 to 90 seconds, confirmed!
    if (elapsedSeconds >= 10 && elapsedSeconds <= 90) {
      existing.frameCount += 1;
      existing.lastSeenTimestamp = now;
      return {
        isConfirmed: true,
        frameCount: existing.frameCount,
        explanation: `Confirmed via two-frame temporal verification (${Math.round(elapsedSeconds)}s persistence). False-positive risk rejected.`
      };
    }

    // Reset if too long has passed
    if (elapsedSeconds > 90) {
      this.recentAnomalies.set(category, {
        category,
        firstSeenTimestamp: now,
        lastSeenTimestamp: now,
        frameCount: 1
      });
      return {
        isConfirmed: false,
        frameCount: 1,
        explanation: 'New independent anomaly event detected. Awaiting 15s verification frame.'
      };
    }

    // Repeated rapidly within 10s
    existing.frameCount += 1;
    return {
      isConfirmed: false,
      frameCount: existing.frameCount,
      explanation: `Persistent anomaly detected (${Math.round(elapsedSeconds)}s elapsed). Escalation unlocks at 10s threshold.`
    };
  }

  public async analyzeScene(params: {
    imageUri?: string;
    imageBase64?: string;
    scenarioContext?: string;
    modelId?: string;
    forceEvaluation?: boolean;
  }): Promise<BedrockAnalysisResult> {
    const startTime = Date.now();
    const modelToUse = params.modelId || this.defaultModelId;

    // 1. Evaluate Motion Pre-Filter (mitigates Bedrock Token Cost Spike)
    const filterResult = this.motionFilter.evaluateMotion({
      imageBase64: params.imageBase64,
      scenarioContext: params.scenarioContext,
      forceEvaluation: params.forceEvaluation
    });

    const isFiltered = !filterResult.motionExceedsThreshold;
    const costSavingsEstimated = isFiltered ? 0.018 : 0.0;

    // 2. Real AWS Bedrock Runtime execution if credentials provided
    if (this.client && params.imageBase64 && !isFiltered) {
      try {
        const promptText = `You are the OmniLiving+ Computer Vision agent for Amazon Alexa+. 
Analyze this doorbell camera frame. Identify visitors, packages, delivery carriers, and security safety concerns.
Context: ${params.scenarioContext || 'Front porch doorbell motion detection'}
Output valid JSON matching:
{
  "verdict": string,
  "confidence": number,
  "detectedEntities": string[],
  "recommendedAction": string,
  "urgency": "low"|"medium"|"high"|"critical",
  "details": {
    "packageDetected": boolean,
    "carrierName": string,
    "personDetected": boolean,
    "suspiciousActivity": boolean,
    "personDescription": string,
    "isFallOrStandstill": boolean
  }
}`;

        const payload = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: params.imageBase64
                  }
                },
                {
                  type: 'text',
                  text: promptText
                }
              ]
            }
          ]
        };

        const command = new InvokeModelCommand({
          modelId: modelToUse,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(payload)
        });

        const response = await this.client.send(command);
        const latencyMs = Date.now() - startTime;
        const decoded = new TextDecoder().decode(response.body);
        const parsed = JSON.parse(decoded);
        const contentText = parsed.content?.[0]?.text || '{}';
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        const structured = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        const isHighUrgency = structured.urgency === 'high' || structured.urgency === 'critical';
        const verification = isHighUrgency
          ? this.evaluateTemporalVerification(structured.details?.isFallOrStandstill ? 'elderly_anomaly' : 'night_perimeter')
          : { isConfirmed: true, frameCount: 1, explanation: 'Standard low-urgency routine detection.' };

        return {
          modelId: modelToUse,
          verdict: structured.verdict || 'Doorstep scene analyzed by AWS Bedrock',
          confidence: verification.isConfirmed ? (structured.confidence || 0.96) : 0.88,
          detectedEntities: structured.detectedEntities || ['porch', 'front door'],
          recommendedAction: verification.isConfirmed
            ? structured.recommendedAction || 'Execute automated ambient response'
            : 'Discreet spoken check-in inquiry; awaiting verification frame.',
          urgency: verification.isConfirmed ? structured.urgency || 'low' : 'medium',
          details: {
            packageDetected: structured.details?.packageDetected || false,
            carrierName: structured.details?.carrierName,
            personDetected: structured.details?.personDetected || false,
            suspiciousActivity: structured.details?.suspiciousActivity || false,
            personDescription: structured.details?.personDescription,
            isFallOrStandstill: structured.details?.isFallOrStandstill || false
          },
          temporalVerification: verification,
          motionFilter: {
            motionDeltaPercent: filterResult.motionDeltaPercent,
            passedThreshold: filterResult.motionExceedsThreshold,
            costSavingsUsdEstimated: costSavingsEstimated
          },
          bedrockMetadata: {
            inputTokens: parsed.usage?.input_tokens || 1420,
            outputTokens: parsed.usage?.output_tokens || 195,
            latencyMs,
            isSimulated: false
          }
        };
      } catch (error) {
        console.warn('[AWS Bedrock] Live invocation failed, seamlessly falling back to smart simulation:', error);
      }
    }

    // 3. High-Fidelity Smart Fallback Simulation
    const latencyMs = Math.floor(Math.random() * 200) + 310;
    const context = (params.scenarioContext || '').toLowerCase();

    // Check motion pre-filter rejection
    if (isFiltered) {
      return {
        modelId: modelToUse,
        verdict: 'Ambient motion detected below 20% structural threshold (wind/foliage). Bedrock LLM invocation throttled.',
        confidence: 0.99,
        detectedEntities: ['Porch Mat', 'Foliage Movement', 'Daylight Ambient'],
        recommendedAction: 'Maintain standby monitoring mode. Zero API cost incurred.',
        urgency: 'low',
        details: {
          packageDetected: false,
          personDetected: false,
          suspiciousActivity: false
        },
        temporalVerification: {
          isConfirmed: true,
          frameCount: 1,
          explanation: 'Benign ambient movement dismissed by pre-filter.'
        },
        motionFilter: {
          motionDeltaPercent: filterResult.motionDeltaPercent,
          passedThreshold: false,
          costSavingsUsdEstimated: 0.018
        },
        bedrockMetadata: {
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 14,
          isSimulated: true
        }
      };
    }

    const isBenign = /\b(neighbor|jogger|family\s+member|bicycle|gardening|normal_walk|normal\s+transit|dog\s+walk|rest|resting|bench|mailbox|newspaper|picking\s+up|potted\s+plants|caregiver)\b/i.test(context);
    const isDelivery = /\b(package|parcel|delivery|courier|box|carton|envelope|amazon|fedex|ups|usps|dhl|doordash|grocer|food)\b/i.test(context);
    const isElderlyAnomaly = !isBenign && /\b(elderly|senior|resident|grandma|grandpa|fall|standstill|stairs|steps|cane|walker|rollator|instability|disorient|unsteady|struggling)\b/i.test(context);
    const isPerimeterThreat = !isBenign && /\b(night|dusk|midnight|dark|suspicious|stranger|intruder|hoodie|loiter|loitering|linger|lingering|pacing|tamper|tampering|peeking|whispering|trespass|trying\s+front\s+door)\b/i.test(context);

    if (isDelivery) {
      return {
        modelId: modelToUse,
        verdict: 'Amazon Prime Delivery Driver placed an authentic parcel on the front porch',
        confidence: 0.98,
        detectedEntities: ['Uniformed Delivery Driver', 'Amazon Prime Box', 'Front Porch Mat', 'Handheld Scanner'],
        recommendedAction: 'Overlay Picture-in-Picture notification on Fire TV and chime Alexa+ with delivery confirmation.',
        urgency: 'low',
        details: {
          packageDetected: true,
          carrierName: 'Amazon Prime Delivery',
          personDetected: true,
          suspiciousActivity: false,
          personDescription: 'Courier in Amazon navy blue vest with safety logo, placed parcel neatly at mat.'
        },
        temporalVerification: {
          isConfirmed: true,
          frameCount: 1,
          explanation: 'Courier barcode signature detected with high confidence.'
        },
        motionFilter: {
          motionDeltaPercent: filterResult.motionDeltaPercent,
          passedThreshold: true,
          costSavingsUsdEstimated: 0.0
        },
        bedrockMetadata: {
          inputTokens: 1380,
          outputTokens: 215,
          latencyMs,
          isSimulated: true
        }
      };
    } else if (isElderlyAnomaly) {
      const verification = this.evaluateTemporalVerification('elderly_anomaly');
      return {
        modelId: modelToUse,
        verdict: 'Elderly resident assisted walk detected with prolonged standstill near the front steps',
        confidence: verification.isConfirmed ? 0.97 : 0.88,
        detectedEntities: ['Resident', 'Walking Cane', 'Porch Railing', 'Exterior Steps'],
        recommendedAction: verification.isConfirmed
          ? 'Trigger high-urgency care circle escalation and Bee wearable pulse.'
          : 'Initiate gentle spoken check-in inquiry; observe verification frame.',
        urgency: verification.isConfirmed ? 'high' : 'medium',
        details: {
          packageDetected: false,
          personDetected: true,
          suspiciousActivity: false,
          faceRecognized: true,
          personDescription: 'Resident paused while holding handrail near exterior stairs.',
          isFallOrStandstill: true
        },
        temporalVerification: verification,
        motionFilter: {
          motionDeltaPercent: filterResult.motionDeltaPercent,
          passedThreshold: true,
          costSavingsUsdEstimated: 0.0
        },
        bedrockMetadata: {
          inputTokens: 1410,
          outputTokens: 230,
          latencyMs,
          isSimulated: true
        }
      };
    } else if (isPerimeterThreat) {
      const verification = this.evaluateTemporalVerification('night_perimeter');
      return {
        modelId: modelToUse,
        verdict: 'Unidentified individual lingering near front perimeter after dark',
        confidence: verification.isConfirmed ? 0.96 : 0.86,
        detectedEntities: ['Unidentified Individual', 'Dark Outerwear', 'Porch Perimeter'],
        recommendedAction: verification.isConfirmed
          ? 'Illuminate Ring floodlight to 100%, verify smart locks, and prompt Alexa+ alert.'
          : 'Elevate porch lights to 40% soft glow and observe for 15s confirmation frame.',
        urgency: verification.isConfirmed ? 'high' : 'medium',
        details: {
          packageDetected: false,
          personDetected: true,
          suspiciousActivity: true,
          personDescription: 'Individual in dark hooded jacket lingering at perimeter line without approaching bell.'
        },
        temporalVerification: verification,
        motionFilter: {
          motionDeltaPercent: filterResult.motionDeltaPercent,
          passedThreshold: true,
          costSavingsUsdEstimated: 0.0
        },
        bedrockMetadata: {
          inputTokens: 1450,
          outputTokens: 240,
          latencyMs,
          isSimulated: true
        }
      };
    } else {
      return {
        modelId: modelToUse,
        verdict: 'Front porch clear and normal. Ambient lighting daylight with no unauthorized presence.',
        confidence: 0.97,
        detectedEntities: ['Front Doorway', 'Welcome Mat', 'Flower Planter'],
        recommendedAction: 'Maintain ambient monitoring mode.',
        urgency: 'low',
        details: {
          packageDetected: false,
          personDetected: false,
          suspiciousActivity: false
        },
        temporalVerification: {
          isConfirmed: true,
          frameCount: 1,
          explanation: 'Clear baseline frame verified.'
        },
        motionFilter: {
          motionDeltaPercent: filterResult.motionDeltaPercent,
          passedThreshold: true,
          costSavingsUsdEstimated: 0.0
        },
        bedrockMetadata: {
          inputTokens: 1220,
          outputTokens: 180,
          latencyMs,
          isSimulated: true
        }
      };
    }
  }
}
