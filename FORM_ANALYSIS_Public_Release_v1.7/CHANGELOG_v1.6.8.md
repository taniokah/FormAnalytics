# FORM ANALYSIS Public v1.6.8

- Chandler regression masses with sex-specific de Leva adjustment; 2D projected CoM, five-frame position smoothing.
- Same-frame foot force identity: F1 = hypot(F1x,F1z), F2 = hypot(F2x,F2z). Horizontal components are inward-positive reference magnitudes, not independently measured vectors.
- Final speed-card order (8): CoM, head center, thorax center, pelvis center, bilateral shoulders, elbows, wrists, and fingertips.
- Maintained single pose inference pass, video recording, audio checkbox, contact heuristic, offline assets and settings.
- Anthropometric coverage threshold: at least 93% of model body mass visible per frame; missing output otherwise.


## 解析精度（時間平滑化）の選択
設定画面の姿勢推定モデル選択の近くに1〜5フレームの移動平均設定を追加（初期値3）。位置の時間平均、および既存の速度・加速度の平滑化段数に適用します。1は平均処理なし、5はより滑らかですがピークが減衰する可能性があります。

- Reorganized speed and dynamics tabs into eight metric cards; kept six force cards, synchronized compact sizing and chart dimensions.

### UI refinement (v1.6.8, unchanged version)
- Standardized the six GRF cards and eight dynamics cards against the eight speed-card dimensions (01); reserved the vacant fourth row for GRF on desktop.
- Standardized graph heights on 01/02/03 while retaining a minimum 320 px plot height and scrolling on compact displays.
- Corrected the metric summary aggregation to include the left/right fingertip speed series displayed in the graph.

### UI/metrics revision (v1.6.8)
- Unified 01/02/03 chart height and metric height (01 as reference).
- Included both fingertip series in summary extrema and assigned distinct left/right colors so selected graph buttons never become white/invisible.
- Replaced hand-wrist maximum-speed release X/Y proxy with the estimated forward hand-extension distance from a drive-ankle backward reference; show the distance time-series and ◆ estimated release event (first prominent peak).
- The peak is a provisional proxy, not observed ball release.
