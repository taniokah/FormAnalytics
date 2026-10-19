# FORM ANALYSIS Public v1.6.6 — verification notes

- Baseline: Public v1.6.5.
- Existing pose model selection and settings unchanged.
- Each sampled frame is analyzed once.
- Chromium mock pose-estimator test (390px and 1440px): 16 frames, 16 inferences, progress 100%, overlay hidden after completion. PASS.
- Cancellation button: stopped analysis and returned from progress overlay. PASS.
- JavaScript / Service Worker syntax and ZIP integrity checks: PASS.
- Real iPhone Safari test: NOT performed.
- Real MediaPipe model test: NOT performed (test environment blocks local HTTP access).
- Progress percentage represents completed frame work, not precise remaining wall-clock time.
