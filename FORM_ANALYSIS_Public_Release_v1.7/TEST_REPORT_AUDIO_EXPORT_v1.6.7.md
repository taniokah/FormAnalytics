# FORM ANALYSIS Public v1.6.7 — Optional audio in video export

## Scope
- Added an `音声あり` checkbox adjacent to the video export button. Unchecked by default.
- Unchecked: preserves existing silent Canvas/MediaRecorder export.
- Checked: routes decoded original media audio through Web Audio to a MediaStreamDestination, and records the resulting audio track together with the composed Canvas video.
- Original video, skeleton, and force-arrow layer choices remain independent and unchanged.
- Recording controls remain locked while export is in progress; initial mute setting is restored afterward.
- Saves through MediaRecorder as MP4 where an H.264/AAC profile is advertised, otherwise WebM+Opus or another supported browser combination.

## Executed checks
- JavaScript syntax: PASS (Node.js `--check`).
- Test asset: 3-second H.264 MP4, 440-Hz sine wave AAC track, 640x360 video.
- Headless Chromium with inline HTML/CSS/JS (local-file and localhost navigation restricted in the QA environment): PASS.
- Silent export: H.264 video-only MP4, no audio track: PASS (2 sequential exports).
- Audio export: VP8/Opus WebM with an actual non-silent sound waveform (approx. -21.1 dB average) confirmed using `ffprobe` and `ffmpeg volumedetect`: PASS (2 sequential exports).
- Switching ON/OFF between successive exports: PASS.
- Compact toolbar layout (320, 390, 768, 1440px widths) in headless Chromium: PASS.
- iPhone Safari device test: NOT PERFORMED. AudioContext and MediaRecorder interoperability may vary across Safari and iOS versions.

## Notes
- Source files with no audio may produce a silent audio track even when the checkbox is enabled. File content is not uploaded to a server.
- Some Safari versions may block unmuted programmatic playback or MediaRecorder audio/video mixing. In that case, use silent export, or a browser that supports the required media capture APIs.
- Browser export of original audio is not an exact stream copy; audio is re-encoded by the browser.
