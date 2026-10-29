# Standard local Wiener-style option (public v1.7)

- Input: raw MediaPipe 2D keypoints; output: smoothed x/y once only.
- Option `wiener` (default): local mean/variance plus noise variance estimated from lower quartile of local variances per landmark/axis. No specialized event or pose-constraint logic.
- Option `mean`: previous centered moving average.
- 1–5 frames; initial setting 3; center-frame absence never imputed.
- All derivatives and derived quantities computed after the single keypoint operation.
- Local Wiener adaptation is a public, well-known method, and does not guarantee novelty-free freedom to operate or peak accuracy.
- Static tests and simulated-signal tests: see build output. Actual iPhone Safari with filming data not verified.

## Automated check (2026-10-29)

- JavaScript syntax (`node --check`): PASS.
- 1–5 frames x 2 smoothing modes: PASS (synthetic keypoints).
- 3-frame old moving-average result in constructed example: 0.095000; local Wiener-style: 0.239464; source: 0.240000. **This deliberately isolated spike is NOT evidence of improved physical accuracy: it could be pose-estimation noise.**
- Missing center landmark and confidence-invalid center landmark: remain missing.
- Keypoint-only single filtering, smoothing mode setting binding and legacy mode: PASS.
- ZIP CRC and embedded Heavy/Full models + WASM: PASS.
- Browser rendering, iPhone Safari and true biomechanical peak accuracy: NOT VERIFIED.
