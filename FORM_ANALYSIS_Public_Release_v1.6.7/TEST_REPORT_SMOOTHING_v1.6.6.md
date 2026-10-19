# FORM ANALYSIS Public v1.6.6 — Five-frame position smoothing: verification

## Implementation

- Ordinary centered mean using at most 5 positions (i-2 through i+2).
- Include only observations whose timestamps are within 0.16 seconds of the current frame.
- Missing center observations stay missing; invalid neighbors are excluded.
- Smoothed data: 2D pelvis midpoint proxy, thorax midpoint, shoulders, elbows, wrists, fingertips, left/right ankle tracks, and foot support-point tracks.
- Derivatives use smoothed position tracks; existing three-frame scalar smoothing for speed/acceleration is retained.
- Raw pose landmarks remain the basis for the existing foot-contact candidate detector; overlay skeleton remains raw; overlay pelvis center and plotted kinematics use the smoothed 2D pelvis midpoint.
- Preserves single inference per sampled frame; no iterative processing, altered image exposure/saturation, or confidence-weighted keypoint fusion.

## Checks

- JavaScript and Service Worker syntax: PASS (`node --check`).
- Mean at center frame vs. mathematically expected five-point average: PASS.
- End-of-clip windows, missing central keypoints, missing adjacent keypoints, irregular timestamp gaps: PASS.
- 25-frame synthetic pitching sequence: center positions, derived velocity, approximate GRF: PASS.
- Contact phases and event timestamps compared with unmodified v1.6.6: UNCHANGED on tested synthetic sequence.
- Program settings and UI HTML unchanged except static-asset cache-busting query strings.
- Original model binaries and vendor assets: verified unchanged (SHA-256).
- ZIP archive integrity: PASS.

## Limitations

- No actual 20-second iPhone Safari analysis or force-plate accuracy validation was run here.
- Centered smoothing introduces up to two-frame temporal lookahead and reduces rapid peaks; no improvement in biomechanical validity is guaranteed.
- For low sample rates or missing neighbors, the average may use fewer than five positions.
