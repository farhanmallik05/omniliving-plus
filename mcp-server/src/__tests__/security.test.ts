import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { RingLiveBridge } from '../services/ring-live.js';

test('Security & Compliance Verification Suite', async (t) => {
  const bridge = RingLiveBridge.getInstance();

  await t.test('Ring Webhook HMAC: allows request when no secret is configured (prototype/evaluator mode)', () => {
    delete process.env.RING_WEBHOOK_SECRET;
    const isValid = bridge.verifyHmacSignature('{"event_type":"ding"}');
    assert.equal(isValid, true, 'Should pass in zero-config dev mode');
  });

  await t.test('Ring Webhook HMAC: verifies valid HMAC-SHA256 signature against secret', () => {
    const testSecret = 'test_webhook_secret_key_12345';
    process.env.RING_WEBHOOK_SECRET = testSecret;

    const payload = JSON.stringify({ event_type: 'ding', doorbot_description: 'Front Porch' });
    const signature = crypto.createHmac('sha256', testSecret).update(payload).digest('hex');

    const isValid = bridge.verifyHmacSignature(payload, `sha256=${signature}`);
    assert.equal(isValid, true, 'Valid HMAC signature must be accepted');

    const isValidBare = bridge.verifyHmacSignature(payload, signature);
    assert.equal(isValidBare, true, 'Bare hex signature must be accepted');
  });

  await t.test('Ring Webhook HMAC: rejects tampered body or invalid signature', () => {
    const testSecret = 'test_webhook_secret_key_12345';
    process.env.RING_WEBHOOK_SECRET = testSecret;

    const originalPayload = JSON.stringify({ event_type: 'ding', doorbot_description: 'Front Porch' });
    const tamperedPayload = JSON.stringify({ event_type: 'ding', doorbot_description: 'Back Porch' });
    const signature = crypto.createHmac('sha256', testSecret).update(originalPayload).digest('hex');

    const isValid = bridge.verifyHmacSignature(tamperedPayload, `sha256=${signature}`);
    assert.equal(isValid, false, 'Tampered payload must fail signature verification');

    const isWrongSig = bridge.verifyHmacSignature(originalPayload, 'sha256=baddeadbeef00000000000000000000000000000000000000000000000000000');
    assert.equal(isWrongSig, false, 'Invalid signature hex must be rejected');
  });

  await t.test('Ring Webhook HMAC: rejects request when secret is set but signature is omitted', () => {
    process.env.RING_WEBHOOK_SECRET = 'active_production_secret';
    const payload = JSON.stringify({ event_type: 'motion' });
    const isValid = bridge.verifyHmacSignature(payload, undefined);
    assert.equal(isValid, false, 'Missing signature must be rejected when secret is configured');

    // Clean up
    delete process.env.RING_WEBHOOK_SECRET;
  });
});
