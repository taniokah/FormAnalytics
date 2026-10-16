# FORM ANALYSIS Public Preview v1.5 — verification

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

## v1.5 changes
- Analyze up to 20 seconds from the specified start time; the default end time 0 means up to 20 seconds or the end of the video.
- 10/15/30/60 samples per second, up to 1201 samples for 20 seconds at 60 samples/s.
- Responsive chart coordinates and in-bounds axes; graph scales across the full analysis interval.
- Same-origin offline MediaPipe WASM and Heavy/Full pose assets retained.


## v1.6 regression / static validation
- Chart overlay now references `driveResultant` and `leadResultant`; one toggle controls both.
- Both use the same right-hand axis (N). Mathematical estimator is unchanged.
- JavaScript syntax, ZIP structure and static source assertions checked.
- Browser end-to-end 20-second video analysis not executed.

## v1.6.1 verification
- Single force toggle controls two SVG graph paths, driveResultant and leadResultant.
- Changed display label, right axis, title, and Japanese help terminology to 床反力.
- Original 20-second maximum and per-foot force math unchanged.
- JavaScript syntax and ZIP integrity checked. Browser UI tests passed at 390×844, 768×1024, 1024×768, and 1440×900 without JS errors or horizontal overflow. Synthetic SVG tests confirmed both overlaid curves appear on a single toggle ON and both disappear on OFF. Actual footage-based inference remains unverified.

## v1.6.3 UI tests (synthetic data)
- Chromium via inline HTML/CSS/JavaScript harness, 320×700, 390×844, 768×1024, 1440×900: **PASS**, no JavaScript page errors.
- Current time 4.35 s maps to nearest sample and updates lead and drive resultant tabs to 45.7 N and 98.3 N: **PASS**.
- Out-of-range playback position displays “—”, L/R values display within a shared tab, selected series toggle still works: **PASS**.
- Mobile chart height >=320 px, minimum series tab width >=106 px, tab horizontal overflow without squeezing the SVG: **PASS**.
- Full 20-second video analysis with real MediaPipe and Safari device: **NOT RETESTED**.

### v1.6.3 再作成版の確認項目
- 2行表示の系列ボタン／指標カード（3行目の補足説明を非表示）
- 系列ボタン高さはPC 37px／幅767px以下 30px
- 解析の実行結果は変更せず、動画シーク位置の現在値表示を維持

**再作成版のブラウザ静的UI検証（模擬表示）**
- 320 / 390 / 768 / 1440px ビューポートで系列ボタン領域の高さを計測：30 / 30 / 37 / 37px。
- 320px・390pxでグラフ領域の高さ320px、ページ横はみ出しなし、系列ボタンのみ横スクロール。
- 動的DOM検証：6系列の系列ボタン生成、補足説明の3行目削除、模擬現在値「2.7 N」「12.3 N」を再生時点として反映。
- JavaScript構文チェック通過、ZIP整合性・SHA256照合通過予定。
- 実動画によるMediaPipe動作確認とiPhone Safari実機検証は未実施。
