# FORM ANALYSIS Public Preview v1.5

This public preview uses a 2D single-pass pose detector with approximate pelvis center, filed support-point load allocation and an elementary, unvalidated sequential foot-motion heuristic. No unreleased 2-pass research contact model, Chandler coefficient correction, segment rotation model or release localization is included.

## Changes

- Foot contact candidates follow the sequence: lead liftoff, lead touchdown, drive liftoff, optional drive touchdown. A missing sequence is not fabricated; with no detected events both feet are assumed supported.
- Off-ground candidate foot receives 0 N in the simplified force distribution, while the other foot receives the full available force.
- Horizontal force shown for each foot is signed **positive toward pelvis midpoint**. Internal horizontal global/pitch-direction values remain separate in CSV and satisfy Fx_total = F1x_world + F2x_world.
- Graph ▲/▼ markers distinguish candidate takeoff/touchdown. Orange = lead / blue = drive. These are not measured events.

Run using start_mac.command or start_windows.bat (Python 3). All JavaScript, WASM and MediaPipe models are distributed under vendor/ and fetched only from the same origin. No video upload occurs.

**Publication caution:** This release discloses the high-level contact-event sequence and its simplified 2D implementation. University IP review is required before public posting, especially if related patent applications have not yet been filed. Commercial use requires a separate license.

## v1.5 changes
- Analyze up to 20 seconds from the specified start time; the default end time 0 means up to 20 seconds or the end of the video.
- 10/15/30/60 samples per second, up to 1201 samples for 20 seconds at 60 samples/s.
- Responsive chart coordinates and in-bounds axes; graph scales across the full analysis interval.
- Same-origin offline MediaPipe WASM and Heavy/Full pose assets retained.
