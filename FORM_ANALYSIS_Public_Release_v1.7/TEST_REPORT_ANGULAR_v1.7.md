# FORM ANALYSIS Public v1.7 — 04 Angular velocity / 角速度

## Implementation

- References: user-provided MotionCheck 0.7en p5.js (`sketch.js`: shoulder/waist projected-angle estimation and `speed3` angular derivative) and independent 2D-projection equations.
- Outputs: `upperAngular`, `lowerAngular`, `twistAngular` (degrees per second); `twistAngular = upperAngular - lowerAngular`, same frame, never independent peak subtraction.
- Confidence limits: signed transverse shoulder/hip horizontal projection is a *reference proxy*, not 3D axial rotation. Motion direction and handedness fix the presumed sense of progression. A 2D side-view cannot identify absolute yaw or separate forward/reverse turns.
- Missing landmark observations propagate as null; isolated implausible tracking jumps can be rejected. No value is inferred for a missing central sample. Time smoothing setting 1–5 controls width smoothing; derivative uses neighboring times.
- UI: 04 tab, three cards, three selectable graph series; plot geometry and card styling shared with 01–03. Force overlay hidden on angular page. CSV carries the three columns and caution comments.

## Verified in this environment

- `node --check` on main JS and service worker: passed.
- Mathematical test: independent 57.3°/s and 25.8°/s rotations recovered from smooth synthetic projection at 30–34fps (three-frame case); twist equals their difference to floating-point precision.
- Frame-smoothing modes 1,2,3,4,5: passed synthetic rate/twist tests.
- Missing landmarks at frame 30: no rate created at missing frame or across its derivative discontinuity.
- Totally missing pose sequences: all new series null, not zero.
- Four-tab DOM contents and asset-path static assertions: passed.
- ZIP CRC integrity check: passed.

## Not verified

- Automated headless browser screenshot/layout verification was blocked by execution environment policy (`ERR_BLOCKED_BY_ADMINISTRATOR` for localhost and local files).
- iPhone 13 mini Safari and real baseball pitching video validation: NOT performed.

## Important scientific limitation

Rotational velocities inferred only from planar landmarks are not reliable measurements of transverse-plane 3D angular velocity. Camera position, translational movement, out-of-plane projection, body lean, initial reference width, landmark swaps and near-profile poses can bias estimated rate. Use the outputs only as experimental 2D angular-progression indicators.
