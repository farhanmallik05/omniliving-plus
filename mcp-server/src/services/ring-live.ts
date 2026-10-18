import crypto from 'crypto';
import { DeviceStateManager } from './device-state.js';
import { rootLogger } from './logger.js';

export interface RingWebhookPayload {
  event_type: 'motion' | 'ding' | 'intercom_open' | 'intercom_close';
  doorbot_id?: string;
  doorbot_description?: string;
  kind?: string;
  snapshot_url?: string;
  created_at?: string;
}

export class RingLiveBridge {
  private static instance: RingLiveBridge;
  private stateManager = DeviceStateManager.getInstance();
  private isLiveConnected = false;

  public static getInstance(): RingLiveBridge {
    if (!RingLiveBridge.instance) {
      RingLiveBridge.instance = new RingLiveBridge();
    }
    return RingLiveBridge.instance;
  }

  public verifyHmacSignature(rawBody: string, signatureHeader?: string): boolean {
    const secret = process.env.RING_WEBHOOK_SECRET;
    if (!secret) {
      // In development / prototype mode without secret configured, permit webhook
      return true;
    }
    if (!signatureHeader) {
      rootLogger.warn('[Ring Webhook] Rejected: Missing signature header but RING_WEBHOOK_SECRET is active');
      return false;
    }
    try {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const cleanHeader = signatureHeader.replace(/^sha256=/, '');
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(cleanHeader, 'hex'));
    } catch (err) {
      rootLogger.error('[Ring Webhook] Signature verification failed with error', err);
      return false;
    }
  }

  public handleWebhook(payload: RingWebhookPayload, signatureHeader?: string, rawBody?: string): { status: string; actionTaken: string } {
    if (rawBody && !this.verifyHmacSignature(rawBody, signatureHeader)) {
      return { status: 'unauthorized', actionTaken: 'HMAC signature verification failed' };
    }

    rootLogger.info('Received live Ring webhook event', payload);

    if (payload.event_type === 'ding') {
      this.stateManager.updateRing({
        status: 'ringing',
        visitorDetected: true,
        lastMotionTimestamp: new Date().toISOString()
      });
      return { status: 'success', actionTaken: 'Doorbell ding triggered living room handoff' };
    }

    if (payload.event_type === 'motion') {
      this.stateManager.updateRing({
        status: 'motion_detected',
        visitorDetected: true,
        lastMotionTimestamp: new Date().toISOString()
      });
      return { status: 'success', actionTaken: 'Motion detection recorded; Bedrock analysis queued' };
    }

    return { status: 'ignored', actionTaken: `Unhandled event_type ${payload.event_type}` };
  }

  public isConnected(): boolean {
    return this.isLiveConnected;
  }
}
