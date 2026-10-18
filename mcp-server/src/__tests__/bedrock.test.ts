import test from 'node:test';
import assert from 'node:assert/strict';
import { BedrockService } from '../services/bedrock.js';

test('BedrockService Fallback Selection & Classification Suite', async (t) => {
  const bedrock = new BedrockService();

  await t.test('detects package courier deliveries correctly', async () => {
    const result = await bedrock.analyzeScene({
      scenarioContext: 'Amazon Prime courier placing blue cardboard box by front door'
    });

    assert.equal(result.details.packageDetected, true);
    assert.equal(result.details.carrierName, 'Amazon Prime Delivery');
    assert.equal(result.urgency, 'low');
    assert.ok(result.confidence >= 0.90, 'Confidence should be >= 0.90');
    assert.equal(result.temporalVerification.isConfirmed, true);
    assert.ok(result.bedrockMetadata.latencyMs > 0);
  });

  await t.test('classifies elderly care standstill anomaly with temporal verification', async () => {
    // Frame 1: initial observation
    const frame1 = await bedrock.analyzeScene({
      scenarioContext: 'Elderly resident with cane standstill near porch exterior stairs'
    });

    assert.equal(frame1.details.personDetected, true);
    assert.equal(frame1.details.isFallOrStandstill, true);
    assert.equal(frame1.temporalVerification.frameCount, 1);
    assert.equal(frame1.temporalVerification.isConfirmed, false, 'First frame should await temporal verification');

    // Rapid successive check before 10s should remain unconfirmed
    const frameRapid = await bedrock.analyzeScene({
      scenarioContext: 'Elderly resident with cane standstill near porch exterior stairs'
    });
    assert.equal(frameRapid.temporalVerification.isConfirmed, false, 'Rapid repeated frame within 10s should remain unconfirmed');
  });

  await t.test('identifies night perimeter security intrusion threat', async () => {
    const result = await bedrock.analyzeScene({
      scenarioContext: 'Suspicious individual in dark hoodie loitering near perimeter after midnight'
    });

    assert.equal(result.details.personDetected, true);
    assert.equal(result.details.suspiciousActivity, true);
    assert.ok(result.recommendedAction.includes('floodlight') || result.recommendedAction.includes('lights') || result.recommendedAction.includes('lock'));
  });

  await t.test('motion pre-filter suppresses benign ambient noise without token expenditure', async () => {
    const result = await bedrock.analyzeScene({
      scenarioContext: 'Tree branches swaying vigorously in high wind casting shadows on porch'
    });

    assert.equal(result.motionFilter.passedThreshold, false, 'Benign foliage movement should be filtered');
    assert.equal(result.bedrockMetadata.inputTokens, 0, 'Zero tokens should be billed on filtered frames');
    assert.ok(result.motionFilter.costSavingsUsdEstimated > 0, 'Cost savings should be recorded');
    assert.equal(result.details.suspiciousActivity, false);
  });
});
