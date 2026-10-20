# FORM ANALYSIS Public Preview v1.6.6

This public preview uses a 2D single-pass pose detector with approximate pelvis center, filed support-point load allocation and an elementary, unvalidated sequential foot-motion heuristic. Advanced non-public research algorithms are not distributed in this repository.

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

## v1.6.6 changes
- Graph series toggles display a playback-synchronized value and its unit (e.g. 踏込 合力 / 45.7 N).
- Combined left/right metrics show both values in their single tab.
- On narrow screens, the tabs scroll horizontally rather than shrink into illegibility; graph minimum height stays at 320 px on iPhone.
- After leaving the 20-second analyzed interval, displayed sample values become “—” (no extrapolation).
- Summary metric cards keep their existing behavior; force formulas and CSV series are unchanged.

### v1.6.6 再作成版の画面
カードは名称と数値・単位の2行で表示します。系列選択ボタンも2行で、スマートフォンでの高さはv1.6.1と同じ30pxです。系列ボタンは横にスクロールできます。

## v1.6.6 フルスクリーン操作

全画面ボタンはプレイヤー全体（動画・オーバーレイ・再生コントローラ・ステータス）を全画面表示します。同じボタンを再度押すと通常サイズに戻ります。Escape キーでも解除できます。iPhone Safari 等で標準 Fullscreen API が利用できない場合は、画面全体を使う CSS フォールバックに切り替わります。全画面中も再生、一時停止、シーク、コマ送り・戻しを利用できます。

ホーム画面から投球方向（画面右／画面左）と投球腕（右投げ／左投げ）を指定できます。これらは解析設定にも反映されます。

## v1.6.6 相対足高補助判定

公開版は脚の局所動作時系列に加えて、左右の踵・つま先双方の相対的な画面上の高さ（足首も確認可能な場合は補助）を使い、上方の足が3フレーム以上連続して持ち上がったとき離地候補とします。床反力の脚別配分・グラフ・CSVに反映します。足の前後位置による遠近差、マウンド、段差、カメラ傾斜などで誤判定します。接地イベントは確定判定ではありません。

### iPhone動画読込時の動作（v1.6.6）
動画選択直後、メタデータ取得まで最大180秒待機し、経過秒を表示します。ファイル選択画面が閉じること自体はiOS標準動作です。3分経過や対応外形式の場合は読込エラーを画面内に残します。iCloud上の動画は先にiPhone本体へダウンロードしてから選択してください。非公開の接地・離地判定法は含まず、足部動作と左右高低差の簡易候補判定を用いています。

## 脚別の水平床反力の向き（v1.6.6 再修正版）
公開版では、踏込足（F1）・軸足（F2）のいずれも**足から骨盤中心へ向かう向きを正**として脚別水平床反力を表示します。表示される値はその向きを仮定した水平成分の参考大きさであり、現行モデルが各足の実際の水平方向を独立に識別・測定したものではありません。
一方、CSV の `leadHorizontalWorld`・`driveHorizontalWorld` は**投球方向を正**とする符号付きの配分成分で、こちらの合計は `forceHorizontal` と一致します。脚別水平表示列と混同しないでください。


## License / 利用許諾

FORM ANALYSIS独自部分には [FORM ANALYSIS Research & Non-Commercial License v1.0](./LICENSE) が適用されます。研究・教育目的の非商用利用は無償です。商用利用には事前の有償契約が必要です。

The original FORM ANALYSIS components are distributed under the FORM ANALYSIS Research & Non-Commercial License v1.0. Non-commercial research and educational use is free of charge; Commercial Use requires a separate paid written agreement in advance. See LICENSE and LICENSE_JA.md. Third-party components retain their own licenses.

## v1.6.6 解析中の表示

従来の単一推定（各フレーム1回のみ）を変更せず、解析中のプレビューをプログレスバーに切り替えます。バーは完了済み推定フレーム数に基づき更新し、解析中止にも対応します。姿勢推定モデルの選択・解析設定はv1.6.5と同一です。


## v1.6.6 — 位置系列の最大5フレーム平滑化
- 各有効な位置サンプルを前後2フレーム、最大5点・0.16秒以内で中心移動平均。欠測中央点の補完なし。
- 骨盤中心代理点、上体・関節・足部支持点を平滑化し、速度・加速度・床反力参考推定へ反映。接地候補イベントの検出は変更なし。
- 姿勢推定の反復や加重平均は追加していません。


## v1.6.8 動画保存
動画・骨格・床反力矢印の各表示設定を保持して解析区間を録画します。音声は初期状態では保存されません。「音声あり」にチェックすると、対応するブラウザでは元動画の音声も録画します（Web AudioとMediaRecorderが必要）。MediaRecorderに対応するブラウザが必要です。


### v1.6.8 / 更新事項
- 身体部分質量による2D重心推定（Chandler質量回帰＋de Leva性別比率補正）。実測・3D重心ではありません。
- 各脚の合力は同一フレームの水平成分と鉛直成分の二乗和平方根で算出します。
- 速度カードは重心、頭部中心、胸部中心、骨盤中心、両肩、両肘、両手首、両手先の8枚。両手先速度は左右の各フレームをグラフと共有し、カードには左右の最大値を表示します。


### 解析精度（時間平滑化）
設定画面で1〜5フレームを選択できます（初期値3）。小さい値は短時間のピークを保持しやすい一方でノイズが増えることがあり、大きい値はグラフが安定する一方でピークが小さくなることがあります。精度向上を保証する設定ではありません。


Public UI update: eight speed indicators (including head center and fingertips), six unchanged ground reaction force indicators, and eight dynamics/distance indicators. Release point is a throwing-wrist speed-peak 2D proxy, not observed ball release. Segment energies use assumed mass fractions and should not be treated as validated measurements.


**推定リリースポイント / Estimated release point (public v1.6.8):** グラフは軸足足首の後方基準位置から投球側指先（欠測時は手首）までの前方距離（m）の時間変化を示し、◆は最初の有意な伸展ピークを示します。/ The graph shows forward fingertip distance from a rear drive-ankle reference (m), with ◆ marking the first prominent extension peak. This is not a direct measurement of ball release.
