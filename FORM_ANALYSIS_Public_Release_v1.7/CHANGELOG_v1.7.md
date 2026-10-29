# FORM ANALYSIS Public v1.7 — 2026-10-27

- Added 04 角速度: 上胴角速度, 下胴角速度, 捻転角速度; 3 metric cards, interactive series selector, shared graph, CSV columns.
- Unit °/s. Upper/lower velocities estimated from changes in shoulder/hip horizontal projected widths; twist = upper - lower (same sample).
- User supplied MotionCheck p5.js used as an algorithmic reference. Implementation uses only public independent 2D math, not private Alpha program files.
- Respects frame smoothing 1–5, default 3. Invalid keypoints cause missing (blank) samples.
- Keeps previous metric/plot sizing for 01/02/03; 04 uses same plot dimensions.
- Offline PWA cache revision, version, docs, and export filenames updated to v1.7.

## Limitations
2D projected angle change is **not** measured 3D axial rotation. Absolute angular speed can be affected by camera view, body inclination, occlusion, sign convention, and projection singularities.

## 2026-10-28 — 04 角速度 chart uses angles (version remains v1.7)

- Three upper cards remain peak **angular velocity** values (°/s).
- The three selectable chart series and their live legend pills now show **projected angle** (°): `upperAngle`, `lowerAngle`, and `twistAngle = upperAngle - lowerAngle` per frame.
- Angular velocity continues to be calculated by differentiating the corresponding angles; CSV includes both angular velocity (°/s) and angle (°) columns.
- Existing 01–03 behavior, card heights, shared chart height and output settings remain unchanged.
- These are 2D apparent projected angles, NOT validated 3D axial rotation measurements.

## 2026-10-28 — Show force overlay toggle in all four charts (v1.7)

- The existing `床反力 N` checkbox now remains available in tabs 01–04.
- 01/03/04: toggles the separate drive/lead resultant force series (F2/F1) on a secondary N axis; angle chart in 04 keeps the primary ° axis and peak °/s cards.
- 02: switches its selected foot-force curves off/on while preserving which force series are selected; off-state displays an explicit message instead of meaningless scale values.
- The checkbox state is shared across chart tabs and remains in effect when switching tabs.
- Bumped offline cache identifier and stylesheet/script asset revision; no change to the biomechanical calculations.

### 2026-10-29
- 位置を平滑化した後の速度・加速度への再度の移動平均を廃止し、二重平滑化によるピーク減衰を抑制。
- 設定1〜5フレーム（初期値3）、角度3系列と床反力4タブON/OFF、動画保存などは維持。

## 04 角度／角速度 グラフ切替（v1.7 維持）
- 上胴・下胴・捻転に角度（°）と角速度（°/s）の計6カードを配置。
- 角速度カードは従来のピーク値（°/s）を維持。角度カードは角度の絶対ピーク参考値。
- 選択した系列の単位が変わると03と同様に旧系列を非表示にし、縦軸とタイトルを切り替える。
- 床反力 NのオーバーレイON/OFFおよび右軸は維持。
- 位置系列の1回平滑化、角度系列の1回平滑化を維持し、微分後の再平滑化は実施しない。

## 2026-10-29 — キーポイント時間平滑化のみ（v1.7維持）

- 設定1〜5フレーム（初期値3）で、MediaPipe 2Dキーポイント座標の時間移動平均を解析内で1回だけ実施。中心欠測を補完しない。
- 重心・各部合成位置・並進速度／加速度・床反力・並進エネルギー・投球指先距離・回旋角度／角速度への**追加平滑化を廃止**。角度の投影幅比やリリース距離系列の後段平滑化も削除。
- 接地判定用の足部座標3点中央値フィルタを削除（3連続観測によるイベント判定は維持）。
- 同じ処理済みキーポイントを骨格描画・グラフ・CSV・カード表示で使用。
- 公開版の範囲を維持し、非公開Alpha専用の独自アルゴリズムは取り込まない。


## 2026-10-29: conventional local Wiener-style option (version remains v1.7)
- Introduced user-selectable keypoint-only temporal method near pose model settings: conventional **local Wiener-style variance-adaptive** smoothing (default), or previous simple moving average. Sample window 1–5, default 3.
- The local gain uses only three-point-neighborhood mean and variance, and a clip-level lower-quartile local variance estimate. This is a conventional local-statistics filter, NOT the private Alpha algorithm.
- One pass on original MediaPipe keypoints x/y. No additional smoothing on CoM, speed, acceleration, GRF, angle or angular velocity; missing center keypoints remain missing.
- A high local variance can be caused by either motion or a false single-frame outlier: no guarantee of preserved true peak or noise removal. No event/biomechanical confidence-based adaptation implemented.
