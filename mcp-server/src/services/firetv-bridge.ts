import { Response } from 'express';
import { DeviceStateManager } from './device-state.js';
import { rootLogger } from './logger.js';

export class FireTvBridge {
  private static instance: FireTvBridge;
  private stateManager = DeviceStateManager.getInstance();
  private tvClients = new Map<string, Response>();

  public static getInstance(): FireTvBridge {
    if (!FireTvBridge.instance) {
      FireTvBridge.instance = new FireTvBridge();
    }
    return FireTvBridge.instance;
  }

  private constructor() {
    // Listen for Fire TV state updates and push to TV clients
    this.stateManager.subscribe((state) => {
      const tvState = state.fireTv;
      const payload = JSON.stringify({
        type: 'FIRETV_OVERLAY_UPDATE',
        pictureInPictureActive: tvState.pictureInPictureActive,
        overlayMessage: tvState.overlayMessage,
        status: tvState.status,
        timestamp: new Date().toISOString()
      });

      for (const [id, res] of this.tvClients.entries()) {
        try {
          res.write(`data: ${payload}\n\n`);
        } catch {
          this.tvClients.delete(id);
        }
      }
    });
  }

  public registerTvClient(id: string, res: Response) {
    this.tvClients.set(id, res);
    rootLogger.info(`Connected real Fire TV / Vega OS overlay client [${id}]. Total active screens: ${this.tvClients.size}`);
  }

  public removeTvClient(id: string) {
    this.tvClients.delete(id);
    rootLogger.info(`Disconnected Fire TV client [${id}]. Remaining: ${this.tvClients.size}`);
  }

  public getConnectedCount(): number {
    return this.tvClients.size;
  }
}
