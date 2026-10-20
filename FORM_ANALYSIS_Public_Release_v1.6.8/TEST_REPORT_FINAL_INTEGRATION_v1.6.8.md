# FORM ANALYSIS v1.6.8 final integrated regression test

## Scope
- 01 speed: 8 cards (including both fingertip peaks), 02 forces: 6 cards, 03 mechanics and distances: 8 cards.
- All tabs: same reference card and chart heights at 1440x900, 1366x768, 900x800, 768x900, 390x844, 375x812, and 320x720 viewport sizes.
- Fingertip series: selected background uses an explicit series color rather than a white/undefined fallback.
- Fingertip maximum: left/right summary cards receive maxima from the same per-frame signals used by the plotted series.
- Release distance: forward distance from drive-ankle rear reference to throwing index fingertip (wrist fallback). First prominent peak highlighted by diamond in graph.
- Synthetic series with a smaller earlier peak and larger later peak correctly picks the earlier peak. The value in the release card is the value at that event.
- Metadata: corrected exported filename / CSV version to v1.6.8 and clarified anthropometric sex correction label.

## Limitations
- Tests used synthetic position tracks in headless Chromium, not force-plate ground truth or a physical iPhone Safari device.
- The release estimate is a kinematic heuristic, not confirmed separation of the ball from the hand.
- Proprietary/research-scope intellectual-property review is recommended before publishing the release algorithm.
