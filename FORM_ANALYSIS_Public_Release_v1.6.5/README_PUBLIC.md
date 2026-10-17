# FORM ANALYSIS Public Preview v1.6.5

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

## v1.6.5 changes
- Graph series toggles display a playback-synchronized value and its unit (e.g. 踏込 合力 / 45.7 N).
- Combined left/right metrics show both values in their single tab.
- On narrow screens, the tabs scroll horizontally rather than shrink into illegibility; graph minimum height stays at 320 px on iPhone.
- After leaving the 20-second analyzed interval, displayed sample values become “—” (no extrapolation).
- Summary metric cards keep their existing behavior; force formulas and CSV series are unchanged.

### v1.6.5 再作成版の画面
カードは名称と数値・単位の2行で表示します。系列選択ボタンも2行で、スマートフォンでの高さはv1.6.1と同じ30pxです。系列ボタンは横にスクロールできます。

## v1.6.5 フルスクリーン操作

全画面ボタンはプレイヤー全体（動画・オーバーレイ・再生コントローラ・ステータス）を全画面表示します。同じボタンを再度押すと通常サイズに戻ります。Escape キーでも解除できます。iPhone Safari 等で標準 Fullscreen API が利用できない場合は、画面全体を使う CSS フォールバックに切り替わります。全画面中も再生、一時停止、シーク、コマ送り・戻しを利用できます。

ホーム画面から投球方向（画面右／画面左）と投球腕（右投げ／左投げ）を指定できます。これらは解析設定にも反映されます。

## v1.6.5 相対足高補助判定

公開版は脚の局所動作時系列に加えて、左右の踵・つま先双方の相対的な画面上の高さ（足首も確認可能な場合は補助）を使い、上方の足が3フレーム以上連続して持ち上がったとき離地候補とします。床反力の脚別配分・グラフ・CSVに反映します。足の前後位置による遠近差、マウンド、段差、カメラ傾斜などで誤判定します。接地イベントは確定判定ではありません。

### iPhone動画読込時の動作（v1.6.5）
動画選択直後、メタデータ取得まで最大180秒待機し、経過秒を表示します。ファイル選択画面が閉じること自体はiOS標準動作です。3分経過や対応外形式の場合は読込エラーを画面内に残します。iCloud上の動画は先にiPhone本体へダウンロードしてから選択してください。非公開の接地・離地判定法は含まず、足部動作と左右高低差の簡易候補判定を用いています。

## 脚別の水平床反力の向き（v1.6.5 再修正版）
公開版では、踏込足（F1）・軸足（F2）のいずれも**足から骨盤中心へ向かう向きを正**として脚別水平床反力を表示します。表示される値はその向きを仮定した水平成分の参考大きさであり、現行モデルが各足の実際の水平方向を独立に識別・測定したものではありません。
一方、CSV の `leadHorizontalWorld`・`driveHorizontalWorld` は**投球方向を正**とする符号付きの配分成分で、こちらの合計は `forceHorizontal` と一致します。脚別水平表示列と混同しないでください。
