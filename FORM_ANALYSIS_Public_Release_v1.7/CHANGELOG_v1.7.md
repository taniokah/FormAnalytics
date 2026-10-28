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

## 2026-10-28 — Show force overlay toggle in all four charts (v1.7)

- The existing `床反力 N` checkbox now remains available in tabs 01–04.
- 01/03/04: toggles the separate drive/lead resultant force series (F2/F1) on a secondary N axis; angle chart in 04 keeps the primary ° axis and peak °/s cards.
- 02: switches its selected foot-force curves off/on while preserving which force series are selected; off-state displays an explicit message instead of meaningless scale values.
- The checkbox state is shared across chart tabs and remains in effect when switching tabs.
- Bumped offline cache identifier and stylesheet/script asset revision; no change to the biomechanical calculations.
