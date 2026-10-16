# FORM ANALYSIS Public Preview v1.6.4

This public preview uses a 2D single-pass pose detector with approximate pelvis center, filed support-point load allocation and an elementary, unvalidated sequential foot-motion heuristic. No unreleased 2-pass research contact model, Chandler coefficient correction, segment rotation model or release localization is included.

## Changes

- Foot contact candidates follow the sequence: lead liftoff, lead touchdown, drive liftoff, optional drive touchdown. A missing sequence is not fabricated; with no detected events both feet are assumed supported.
- Off-ground candidate foot receives 0 N in the simplified force distribution, while the other foot receives the full available force.
- Horizontal force shown for each foot is signed **positive toward pelvis midpoint**. Internal horizontal global/pitch-direction values remain separate in CSV and satisfy Fx_total = F1x_world + F2x_world.
- Graph ▲/▼ markers distinguish candidate takeoff/touchdown. Orange = lead / blue = drive. These are not measured events.

Run using start_mac.command or start_windows.bat (Python 3). All JavaScript, WASM and MediaPipe models are distributed under vendor/ and fetched only from the same origin. No video upload occurs.

**Publication caution:** This release discloses the high-level contact-event sequence and its simplified 2D implementation. University IP review is required before public posting, especially if related patent applications have not yet been filed. Commercial use requires a separate license.

## v1.6 changes
- Analyze up to 20 seconds from the specified start time; the default end time 0 means up to 20 seconds or the end of the video.
- 10/15/30/60 samples per second, up to 1201 samples for 20 seconds at 60 samples/s.
- Responsive chart coordinates and in-bounds axes; graph scales across the full analysis interval.
- Same-origin offline MediaPipe WASM and Heavy/Full pose assets retained.

## v1.6 changes
- Replace the former single "total vertical GRF" chart overlay with **two overlaid foot resultant magnitudes**: drive-foot (blue) and lead-foot (orange).
- One toggle controls both plotted lines, with shared right-hand force axis in N and two series in the legend.
- Existing foot allocation calculations, independent per-foot force cards, and 20-second video limit remain unchanged.
- Both lines are modeled estimates (not force-plate measurements).

## v1.6.1 changes
- Single compact checkbox button named **床反力 N**. Orange checked state, pale orange pill, dark check mark.
- The single checkbox overlays drive (F2) and lead (F1) per-foot resultant floor reaction magnitudes concurrently. Default enabled.
- Terminology in the UI consistently uses 床反力 rather than 地面反力.
- Chart right-axis heading is 床反力 (N). No estimation formulas changed.

## v1.6.4 changes
- Graph series toggles display a playback-synchronized value and its unit (e.g. 踏込 合力 / 45.7 N).
- Combined left/right metrics show both values in their single tab.
- On narrow screens, the tabs scroll horizontally rather than shrink into illegibility; graph minimum height stays at 320 px on iPhone.
- After leaving the 20-second analyzed interval, displayed sample values become “—” (no extrapolation).
- Summary metric cards keep their existing behavior; force formulas and CSV series are unchanged.

### v1.6.4 再作成版の画面
カードは名称と数値・単位の2行で表示します。系列選択ボタンも2行で、スマートフォンでの高さはv1.6.1と同じ30pxです。系列ボタンは横にスクロールできます。

## v1.6.4 フルスクリーン操作

全画面ボタンはプレイヤー全体（動画・オーバーレイ・再生コントローラ・ステータス）を全画面表示します。同じボタンを再度押すと通常サイズに戻ります。Escape キーでも解除できます。iPhone Safari 等で標準 Fullscreen API が利用できない場合は、画面全体を使う CSS フォールバックに切り替わります。全画面中も再生、一時停止、シーク、コマ送り・戻しを利用できます。
