# FORM ANALYSIS Public Preview v1.4 — verification

## Implemented changes

- Positive horizontal force sign for each foot is **toward the pelvis midpoint** (simplified COM); retain pitch-direction signed horizontal reaction as distinct fields `leadHorizontalWorld` and `driveHorizontalWorld`. The mathematical world/pitch-direction components sum to `forceHorizontal`.
- Elementary 2D sequential candidate events: **lead liftoff → lead touchdown → drive liftoff → optional drive touchdown**. Candidates use toe and heel changes across at least 3 frames. No COM-acceleration contact algorithm, two-pass fusion or advanced research heuristics are shipped.
- Lead foot has 0 N during inferred lead-flight phase, drive foot has 0 N during inferred drive-flight phase. With no candidate events, the existing both-feet-supported assumption is used.
- Video diagram arrows stay directed from each foot to the pelvis center. Event markers ▲/▼ on chart use orange for lead foot and blue for drive foot.
- CSV includes event/phase metadata and both **local COM-directed signs** and **global/pitch-direction signs** for horizontal reaction.

## Checks performed

- Node JS syntax check — PASS.
- Twelve synthetic logic test groups covering all four combinations of throwing hand and travel direction, no-motion/no-event, stage support gating, world-component conservation, positive lead horizontal force pointing toward pelvis — PASS.
- SVG marker browser simulation: correct four event markers in ordered sequence — PASS.
- Inline browser UI checks: 390×844, 768×1024, 1024×768, 1440×900. No JavaScript errors, force tab has six cards; no document horizontal overflow — PASS.
- MediaPipe models, JS and WASM: package seven same-origin vendor assets hash checked — PASS.

## Not yet established

- Real MediaPipe 0.10.35 inference completion on user footage and true contact timestamp accuracy: NOT VERIFIED in this environment.
- Real force-plate agreement and Safari/iPad physical-device validation: NOT VERIFIED.

## Publication caution

The simplified sequential contact heuristic is present in the distributed JavaScript and **will be disclosed publicly if this ZIP is published**. Confirm whether any related patent claims remain unfiled, and have university IP counsel review before deployment. This is a reference sports-analysis visualization, not a validated measurement device.
