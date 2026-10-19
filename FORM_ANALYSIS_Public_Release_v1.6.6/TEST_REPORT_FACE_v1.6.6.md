# FORM ANALYSIS Public v1.6.6 — Face Overlay QA

- Scope: canvas-only display of Pose Landmarker 0-10 landmarks and approximate head outline.
- Existing body landmarks, positional smoothing, GRF calculations, single-pass inference and app settings unchanged.
- Face landmarks drawn only where `lookup()` confirms sufficient visibility/presence; low-confidence segments are omitted.
- Small or geometrically implausible ovals are suppressed. The oval is an illustration, not a measured head boundary.
- Service Worker cache key and script URLs updated to invalidate earlier v1.6.6 assets.
