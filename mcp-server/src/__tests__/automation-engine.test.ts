import test from 'node:test';
import assert from 'node:assert/strict';
import { AutomationEngine, AutomationRule } from '../services/automation-engine.js';
import { DeviceState } from '../types.js';

test('AutomationEngine Rule Matching & Evaluation Suite', async (t) => {
  const engine = AutomationEngine.getInstance();

  await t.test('loads default rules successfully', () => {
    const rules = engine.getRules();
    assert.ok(rules.length >= 4, 'Should load at least 4 default rules');
    const deliveryRule = rules.find(r => r.name.includes('Smart Delivery'));
    assert.ok(deliveryRule, 'Smart Delivery rule should exist');
    assert.equal(deliveryRule?.enabled, true);
  });

  await t.test('creates, retrieves, and toggles custom rules', () => {
    const custom = engine.createRule({
      name: 'Test Living Room Party Alert',
      enabled: true,
      when: { event: 'heart_rate_spike', source: 'beeWearable' },
      if: { heartRateThreshold: 110, roomEquals: 'Living Room' },
      then: {
        pulseWearableHaptic: true,
        alexaAnnouncement: 'Party mode active'
      }
    });

    assert.ok(custom.id.startsWith('rule_'));
    assert.equal(custom.enabled, true);

    const fetched = engine.getRule(custom.id);
    assert.equal(fetched?.id, custom.id);
    assert.equal(fetched?.name, 'Test Living Room Party Alert');

    // Toggle rule
    const disabled = engine.toggleRule(custom.id, false);
    assert.equal(disabled?.enabled, false);

    const enabled = engine.toggleRule(custom.id, true);
    assert.equal(enabled?.enabled, true);

    // Clean up
    const deleted = engine.deleteRule(custom.id);
    assert.equal(deleted, true);
    assert.equal(engine.getRule(custom.id), undefined);
  });

  await t.test('evaluates WHEN trigger and IF conditions accurately', () => {
    const mockState: DeviceState = {
      ring: {
        status: 'online',
        battery: 92,
        lastMotionTimestamp: new Date().toISOString(),
        lastCameraSnapshotUrl: '',
        visitorDetected: false,
        packageDetected: false,
        intercomActive: false,
        motionZone: 'porch'
      },
      fireTv: {
        status: 'playing',
        currentApp: 'Prime Video',
        nowPlayingTitle: 'Fallout 4K',
        volume: 65,
        pictureInPictureActive: false,
        overlayMessage: null,
        streamUrl: ''
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
        lastSpokenPhrase: '',
        chimeSoundActive: false,
        smartLockState: 'locked',
        porchLightBrightness: 80
      }
    };

    // 1. Package detected when Fire TV is playing -> Should trigger Smart Delivery rule
    const matches = engine.evaluateEvent(
      { event: 'package_detected', source: 'ring' },
      mockState
    );

    assert.ok(matches.length >= 1, 'Should match delivery rule');
    const matchedDelivery = matches.find(m => m.rule.name.includes('Delivery'));
    assert.ok(matchedDelivery, 'Matched action should include delivery rule');
    assert.equal(matchedDelivery?.action.fireTvPip, true);
    assert.equal(matchedDelivery?.action.pauseFireTv, true);

    // 2. Event when IF condition is not met (Fire TV paused) -> Should NOT trigger
    const pausedState = {
      ...mockState,
      fireTv: { ...mockState.fireTv, status: 'paused' as const }
    };
    const noMatch = engine.evaluateEvent(
      { event: 'package_detected', source: 'ring' },
      pausedState
    );
    const noDelivery = noMatch.find(m => m.rule.name.includes('Delivery'));
    assert.equal(noDelivery, undefined, 'Delivery rule should not trigger when Fire TV is not playing');
  });

  await t.test('evaluates cardiac vitals threshold conditions', () => {
    const elevatedHeartState: DeviceState = {
      ring: {
        status: 'online',
        battery: 90,
        lastMotionTimestamp: '',
        lastCameraSnapshotUrl: '',
        visitorDetected: false,
        packageDetected: false,
        intercomActive: false,
        motionZone: 'porch'
      },
      fireTv: {
        status: 'standby',
        currentApp: '',
        nowPlayingTitle: '',
        volume: 50,
        pictureInPictureActive: false,
        overlayMessage: null,
        streamUrl: ''
      },
      beeWearable: {
        connected: true,
        heartRate: 104, // Elevated above 95 bpm default threshold
        activityLevel: 'active',
        focusMode: false,
        currentRoom: 'Kitchen',
        battery: 85
      },
      alexa: {
        state: 'idle',
        lastSpokenPhrase: '',
        chimeSoundActive: false,
        smartLockState: 'locked',
        porchLightBrightness: 50
      }
    };

    const triggered = engine.evaluateEvent(
      { event: 'heart_rate_spike', source: 'beeWearable' },
      elevatedHeartState
    );

    assert.ok(triggered.length >= 1, 'Cardiac vitals rule should trigger for heart rate > 95 bpm');
    assert.equal(triggered[0].action.pulseWearableHaptic, true);
  });
});
