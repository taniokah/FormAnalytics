# FORM ANALYSIS Public v1.6.8

- Chandler regression masses with sex-specific de Leva adjustment; 2D projected CoM, five-frame position smoothing.
- Same-frame foot force identity: F1 = hypot(F1x,F1z), F2 = hypot(F2x,F2z). Horizontal components are inward-positive reference magnitudes, not independently measured vectors.
- Speed card order: CoM, thorax, pelvis, shoulders, elbows, wrists; removed fingertip speed card.
- Maintained single pose inference pass, video recording, audio checkbox, contact heuristic, offline assets and settings.
- Anthropometric coverage threshold: at least 93% of model body mass visible per frame; missing output otherwise.


## 解析精度（時間平滑化）の選択
設定画面の姿勢推定モデル選択の近くに1〜5フレームの移動平均設定を追加（初期値3）。位置の時間平均、および既存の速度・加速度の平滑化段数に適用します。1は平均処理なし、5はより滑らかですがピークが減衰する可能性があります。

- Reorganized speed and dynamics tabs into eight metric cards; kept six force cards, synchronized compact sizing and chart dimensions.
