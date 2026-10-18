import { randomUUID } from 'crypto';
import { DatabaseService, AutomationRuleRow } from './database.js';
import { DeviceState } from '../types.js';

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  when: {
    event: 'doorbell_chime' | 'motion_detected' | 'package_detected' | 'heart_rate_spike' | 'firetv_playing' | 'visitor_detected';
    source: 'ring' | 'fireTv' | 'beeWearable' | 'alexa' | 'bedrock';
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

export class AutomationEngine {
  private static instance: AutomationEngine;
  private db: DatabaseService;
  private rules: Map<string, AutomationRule> = new Map();

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.loadRules();
  }

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  private loadRules() {
    const rows = this.db.getRules();
    if (rows.length === 0) {
      this.seedDefaultRules();
      return;
    }

    for (const row of rows) {
      try {
        const rule: AutomationRule = {
          id: row.id,
          name: row.name,
          enabled: row.enabled === 1,
          when: JSON.parse(row.when_event),
          if: JSON.parse(row.if_conditions),
          then: JSON.parse(row.then_actions),
          triggerCount: row.trigger_count || 0,
          lastTriggeredAt: row.last_triggered_at,
          createdAt: row.created_at
        };
        this.rules.set(rule.id, rule);
      } catch (err) {
        console.warn('[Automation] Error parsing rule row:', err);
      }
    }
    console.log(`[Automation] Loaded ${this.rules.size} dynamic automation rules.`);
  }

  private seedDefaultRules() {
    const defaults: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>[] = [
      {
        name: 'Smart Delivery PiP & Chime',
        enabled: true,
        when: { event: 'package_detected', source: 'ring' },
        if: { fireTvPlaying: true },
        then: {
          fireTvPip: true,
          pauseFireTv: true,
          alexaAnnouncement: 'Amazon courier delivered your package at the porch. Displaying camera view on Fire TV.'
        }
      },
      {
        name: 'Elderly Care Immobility Haptic Escalation',
        enabled: true,
        when: { event: 'motion_detected', source: 'ring' },
        if: { roomEquals: 'Living Room' },
        then: {
          pulseWearableHaptic: true,
          alexaAnnouncement: 'Safety check: Prolonged standstill detected near exterior stairs.',
          fireTvPip: true
        }
      },
      {
        name: 'Night Perimeter Auto-Deadbolt & Floodlight',
        enabled: true,
        when: { event: 'motion_detected', source: 'ring' },
        if: { nightMode: true },
        then: {
          smartLockAction: 'lock',
          porchLightBrightness: 100,
          alexaAnnouncement: 'Security hardening activated: Deadbolt locked and floodlight illuminated to 100%.'
        }
      },
      {
        name: 'Cardiac Vitals Spike Care Alert',
        enabled: true,
        when: { event: 'heart_rate_spike', source: 'beeWearable' },
        if: { heartRateThreshold: 95 },
        then: {
          pulseWearableHaptic: true,
          alexaAnnouncement: 'Health awareness: Bee wearable detected elevated heart rate. Checking in with care circle.'
        }
      }
    ];

    for (const d of defaults) {
      this.createRule(d);
    }
  }

  public getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  public getRule(id: string): AutomationRule | undefined {
    return this.rules.get(id);
  }

  public createRule(data: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>): AutomationRule {
    const id = `rule_${randomUUID().substring(0, 8)}`;
    const rule: AutomationRule = {
      ...data,
      id,
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };
    this.rules.set(id, rule);
    this.persistRule(rule);
    return rule;
  }

  public updateRule(id: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const updated = { ...rule, ...updates, id };
    this.rules.set(id, updated);
    this.persistRule(updated);
    return updated;
  }

  public toggleRule(id: string, enabled?: boolean): AutomationRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const nextState = typeof enabled === 'boolean' ? enabled : !rule.enabled;
    rule.enabled = nextState;
    this.persistRule(rule);
    return rule;
  }

  public deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) {
      this.db.deleteRule(id);
    }
    return deleted;
  }

  private persistRule(rule: AutomationRule) {
    const row: AutomationRuleRow = {
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled ? 1 : 0,
      when_event: JSON.stringify(rule.when),
      if_conditions: JSON.stringify(rule.if),
      then_actions: JSON.stringify(rule.then),
      created_at: rule.createdAt,
      last_triggered_at: rule.lastTriggeredAt,
      trigger_count: rule.triggerCount
    };
    this.db.saveRule(row);
  }

  /**
   * Evaluates active rules against an incoming event and current system state.
   * Returns list of triggered actions.
   */
  public evaluateEvent(
    event: { event: string; source: string; data?: any },
    state: DeviceState
  ): Array<{ rule: AutomationRule; action: AutomationRule['then'] }> {
    const triggered: Array<{ rule: AutomationRule; action: AutomationRule['then'] }> = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // 1. Check WHEN trigger
      if (rule.when.event !== event.event || rule.when.source !== event.source) {
        continue;
      }

      // 2. Check IF conditions
      const cond = rule.if;
      let matched = true;

      if (cond.fireTvPlaying !== undefined) {
        const isPlaying = state.fireTv.status === 'playing';
        if (isPlaying !== cond.fireTvPlaying) matched = false;
      }

      if (cond.heartRateThreshold !== undefined) {
        if (state.beeWearable.heartRate < cond.heartRateThreshold) matched = false;
      }

      if (cond.roomEquals !== undefined) {
        if (state.beeWearable.currentRoom !== cond.roomEquals) matched = false;
      }

      if (cond.nightMode !== undefined) {
        // Evaluate simulated night mode or light brightness <= 40
        const isNight = state.alexa.porchLightBrightness <= 40 || new Date().getHours() >= 20 || new Date().getHours() <= 6;
        if (isNight !== cond.nightMode) matched = false;
      }

      if (matched) {
        rule.triggerCount += 1;
        rule.lastTriggeredAt = new Date().toISOString();
        this.persistRule(rule);
        triggered.push({ rule, action: rule.then });
      }
    }

    return triggered;
  }
}
