# FORM ANALYSIS Public v1.7 — 2026-10-27

- Added 04 角速度: 上胴角速度, 下胴角速度, 捻転角速度; 3 metric cards, interactive series selector, shared graph, CSV columns.
- Unit °/s. Upper/lower velocities estimated from changes in shoulder/hip horizontal projected widths; twist = upper - lower (same sample).
- User supplied MotionCheck p5.js used as an algorithmic reference. Implementation uses only public independent 2D math, not private Alpha program files.
- Respects frame smoothing 1–5, default 3. Invalid keypoints cause missing (blank) samples.
- Keeps previous metric/plot sizing for 01/02/03; 04 uses same plot dimensions.
- Offline PWA cache revision, version, docs, and export filenames updated to v1.7.

## Limitations
2D projected angle change is **not** measured 3D axial rotation. Absolute angular speed can be affected by camera view, body inclination, occlusion, sign convention, and projection singularities.

## 2026-10-28 — 04 角速度 chart uses angles (version remains v1.7)

- Three upper cards remain peak **angular velocity** values (°/s).
- The three selectable chart series and their live legend pills now show **projected angle** (°): `upperAngle`, `lowerAngle`, and `twistAngle = upperAngle - lowerAngle` per frame.
- Angular velocity continues to be calculated by differentiating the corresponding angles; CSV includes both angular velocity (°/s) and angle (°) columns.
- Existing 01–03 behavior, card heights, shared chart height and output settings remain unchanged.
- These are 2D apparent projected angles, NOT validated 3D axial rotation measurements.
