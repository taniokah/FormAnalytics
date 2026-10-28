# FORM ANALYSIS Public v1.7 — Angular-angle chart revision

Date: 2026-10-28

## Scope
- 04 角速度: preserve 3 card peak values as angular velocities (deg/s).
- Show 3 projected angle time series (deg) in chart and synchronized graph-series value pills.
- `upperAngle`: computed from shoulder width projection, `lowerAngle`: hip width projection, `twistAngle = upperAngle - lowerAngle` per frame.
- `upperAngular`, `lowerAngular`: centered time derivatives of their respective angle series. `twistAngular = upperAngular - lowerAngular` in the same frame.
- CSV records both angle and angular velocity tracks, with unit documentation.
- Version remains v1.7; no modifications to the 01–03 calculations and layouts.

## Executed checks
- Node.js JavaScript syntax: PASSED (public-v1.7.js and service-worker.js).
- Algorithm extracted and evaluated with 80 synthetic frames at 60 fps for smoothing modes 1/2/3/4/5: PASSED.
- Within each tested frame, twistAngle equals upperAngle minus lowerAngle: PASSED.
- Within each valid central frame, twistAngular equals upperAngular minus lowerAngular: PASSED.
- Angular velocity equals centered derivative of the plotted same-time angle series: PASSED.
- Missing shoulder/hip pose propagates a null angle and invalidates adjacent derivatives: PASSED.
- Static check that card keys and units are deg/s, while graph keys and units are deg: PASSED.
- Static check on graph title, series key mapping, and CSV fields: PASSED.
- The v1.7 cache key and script version query were updated for refresh.
- ZIP CRC and archive integrity were verified after packing.

## Not executed
- Automated real-browser rendering/screenshot test: Chromium headless invocation did not finish within timeout in this environment.
- iPhone Safari actual device, real-pitching angle validation, and comparison with 3D optical motion capture: NOT tested.

## Caution
The angle series are projected 2D apparent estimates derived from transverse projected landmark separation. They do NOT directly measure absolute 3D axial turn or genuine 3D torso twist. Displaying angles enables qualitative review of the model's apparent progression; it does not by itself validate accuracy.
