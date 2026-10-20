# FORM ANALYSIS Public v1.6.7 — Video export verification

## Implementation
- Compact 「↓ 動画保存」 button positioned immediately above playback controls; visible in normal and fullscreen preview.
- Exports the analyzed interval (up to 20s), using the preview's Video / Skeleton / Force arrows visibility choices.
- Produces a browser-local silent MP4 or WebM through Canvas.captureStream + MediaRecorder; no server-side encoding.
- Output frame is aspect-ratio preserving (longest side <=1280 px, even dimensions) with a nominal 30fps canvas capture.
- Recording progress, cancellation, an automatic download, and a persistent manual download link are provided.
- User controls are temporarily locked during export and the original playback time is restored afterward.

## Executed tests (headless Chromium, not actual iPhone Safari)
- Real 2-second, 480 x 270 H.264 sample MP4 loaded via app file picker: PASS.
- Video ON export to MP4 and successful decoding/ffprobe: PASS (H.264, 480 x 270, 2.003 seconds, silent).
- Video OFF + Skeleton ON + Force arrows ON, using injected synthetic pose samples: PASS. Saved MP4 displayed colored pose skeleton and both force arrows against a dark background.
- Export cancel operation returned button to ready state without JS errors: PASS.
- Responsive toolbar placement on 390px viewport: PASS.
- JavaScript syntax and Service Worker syntax (node --check): PASS.
- ZIP CRC and asset checksum integrity: PASS.

## Outstanding
- Actual iPhone Safari, longer 20-second real pitching videos, hardware MediaRecorder and device file-saving behavior: NOT TESTED. MP4 availability depends on browser implementation. Audio is intentionally not included.
- Synthetic pose injection was testing-only and is NOT included in the release JS.
