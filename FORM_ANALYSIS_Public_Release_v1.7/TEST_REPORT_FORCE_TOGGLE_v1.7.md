# v1.7 — グラフ床反力表示切替 / force toggle verification

## Scope

- Based on `FORM_ANALYSIS_Public_Release_v1.7_ANGLE_GRAPH_COMPLETE_OFFLINE.zip`.
- Tabs 01–04 all show the original `床反力 N` checkbox.
- 01/03/04 ON: show F2/F1 resultant overlays on the right N axis alongside primary graph. OFF: remove both overlay curves, labels and secondary N-axis.
- 02 ON: preserve existing selected force curves and plot them on the original N axis. OFF: hide them, display an explicit empty-state message, preserve selected-series state for restoring.
- Checkbox state persists across page changes. No GRF physics or underlying analysis data changes.

## Testing

- Chromium headless with self-contained inline HTML/CSS and a **temporary test-only JS hook**, using synthetic time-series data.
- Viewports: desktop 1280×960 and mobile 390×844.
- On each viewport, verified all four tabs have a visible toggle; ON/OFF/ON curves; N secondary axis on/off for 01/03/04; 04 angle curves remain present when force overlay is off; 02 force curves absent on OFF and restored on ON.
- Verified checkbox shared state when switching tabs, and no uncaught page JavaScript exceptions under synthetic data.
- `node --check` for JavaScript and service worker, and ZIP integrity validation.

## Limits

- Synthetic fixtures, not actual pitching footage. iPhone Safari real-device behavior not tested.
- The browser test used a separate, temporary debug-instrumented JS copy; the delivered JS remains unmodified by test hooks.
