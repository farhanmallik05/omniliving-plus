# OmniLiving+ Multimodal Vision Benchmark Dataset (50 Frames) 📊

This directory contains the ground-truth labeled evaluation dataset referenced in [BENCHMARK_REPORT.md](../../BENCHMARK_REPORT.md).

## Dataset Summary

- **Total Frames:** 50
- **Visual Test Frames:** 10 labeled 1280x720 camera frames (`frame_01.svg` - `frame_10.svg`) with Ring HUD, night vision IR telemetry, and CV bounding boxes burned in for direct visual inspection.
- **Categories:**
  1. **Courier Package Deliveries (15 frames):** Tests precision and recall identifying package couriers (Amazon Prime, FedEx, UPS, DHL, USPS, Whole Foods Grocery, DoorDash).
  2. **Elderly Care & Mobility Standstills (12 frames):** Tests safety classification for walking canes, rollators, prolonged staircase standstill, and disorientation.
  3. **Night Perimeter Security (13 frames):** Tests detection of late-night prowlers, hoodie loiterers, door handle tampering, and suppression of benign passersby (joggers, dog walkers).
  4. **Benign False-Positive Ambient Noise (10 frames):** Tests the **Structural Motion Pre-Filter** against swaying tree branches, insect reflections, and passing headlights to prevent unnecessary LLM token spend.

## Dataset Schema

Each entry in `dataset.json` contains:
```json
{
  "id": "frame_01",
  "category": "courier_delivery",
  "context": "Amazon Prime driver placing blue box on porch",
  "groundTruth": {
    "packageDetected": true,
    "carrier": "Amazon Prime",
    "urgency": "low",
    "threat": false
  }
}
```

## Reproducing the Benchmark

To run the complete automated evaluation against the dataset and regenerate the benchmark report:

```bash
# Run via npm
npm run benchmark

# Or directly via node
node scripts/run-benchmark.js
```

The script will compute:
- Confusion Matrix (TP, FP, TN, FN)
- Overall Accuracy ($\ge 90\%$)
- Precision & Recall
- F1 Score
- P95 & Mean Inference Latency
- Token Economics & Estimated Pre-Filter Cost Savings
