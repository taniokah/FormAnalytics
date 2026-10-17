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

## v1.6.5 UI tests (synthetic data)
- Chromium via inline HTML/CSS/JavaScript harness, 320×700, 390×844, 768×1024, 1440×900: **PASS**, no JavaScript page errors.
- Current time 4.35 s maps to nearest sample and updates lead and drive resultant tabs to 45.7 N and 98.3 N: **PASS**.
- Out-of-range playback position displays “—”, L/R values display within a shared tab, selected series toggle still works: **PASS**.
- Mobile chart height >=320 px, minimum series tab width >=106 px, tab horizontal overflow without squeezing the SVG: **PASS**.
- Full 20-second video analysis with real MediaPipe and Safari device: **NOT RETESTED**.

### v1.6.5 再作成版の確認項目
- 2行表示の系列ボタン／指標カード（3行目の補足説明を非表示）
- 系列ボタン高さはPC 37px／幅767px以下 30px
- 解析の実行結果は変更せず、動画シーク位置の現在値表示を維持

**再作成版のブラウザ静的UI検証（模擬表示）**
- 320 / 390 / 768 / 1440px ビューポートで系列ボタン領域の高さを計測：30 / 30 / 37 / 37px。
- 320px・390pxでグラフ領域の高さ320px、ページ横はみ出しなし、系列ボタンのみ横スクロール。
- 動的DOM検証：6系列の系列ボタン生成、補足説明の3行目削除、模擬現在値「2.7 N」「12.3 N」を再生時点として反映。
- JavaScript構文チェック通過、ZIP整合性・SHA256照合通過予定。
- 実動画によるMediaPipe動作確認とiPhone Safari実機検証は未実施。


### v1.6.5 compact controls 修正検証
- グラフ上部の「床反力 N」トグルとPNG・CSVボタンの高さ・文字サイズが一致することをChromiumで検証。
- 画面幅320px、375px、390px、430px、768px、1440pxで高さはそれぞれ21、21、24、16、21、23px。各画面幅で3つの操作が一致。
- 全6画面幅でトグルのチェック操作・再チェック動作、6系列タブの存在、JavaScriptエラーなし、ページ横はみ出しなしを確認。
- 最大20秒解析、従来の脚別床反力2系列表示、既存ロジックは未変更。
- ブラウザテストはChromiumによる模擬解析データ使用。iPhone実機Safariおよび実動画解析は未検証。


### v1.6.5 外枠高さの統一検証（再修正版）
- 「床反力 N」「↓ PNG」「↓ CSV」の3つの外枠を同じ固定border-box高さ、同一の文字サイズ、同一の上端位置に指定。
- Chromiumで320px・375px・390px・430px・768px・1440pxを測定し、各幅で3つの高さ（23/23/24/24/26/26px）、文字サイズ、上端座標が一致することを確認（誤差0px）。
- すべての幅で「床反力 N」ON/OFF切替、既存系列タブ、ページ横方向はみ出しなし、JavaScriptエラーなしを確認。
- Javascript構文検査、配布ZIP内ファイル照合を実施。実動画解析とiPhone実機Safariは未検証。




## v1.6.5 fullscreen controller / player QA

- Browser: Chromium headless, app HTML/CSS/JS inlined to avoid external network (media file generated locally). Existing application code ran without console pageerrors.
- Tested desktop 1366×768, mobile emulation 390×844 and 320×667, tablet 768×1024.
- Native fullscreen: fullscreen viewer (video + overlay + playback controls + metadata), and second click restores prior viewer size. Fullscreen button accessibility label and `aria-pressed` follow status. **PASS** on all four viewports.
- 3-second locally generated MP4: play advances currentTime, pause works, seeking to 1.7s updates video time, back/forward step changes time. Controls remain visible in fullscreen. **PASS**.
- Disable Element.requestFullscreen to exercise CSS fullscreen fallback. Transport remains visible and Escape exits. **PASS** on all four viewports.
- Overlay redraw is invoked at fullscreen transitions. Real pose/force inference with recorded footage, iPhone Safari actual-device behavior, and patented model accuracy are **NOT VERIFIED**.

- 同版再更新: ホームの投球方向・投球腕フィールドと既存設定キーへの連携を追加（構文・ZIP確認）。

## v1.6.5 同版更新：左右足の高さ差に基づく接地候補
- `node --check`: アプリJS / Service Worker 構文チェック合格。
- 生成姿勢系列による10件のテスト合格：同高支持、踏込足離地、軸足離地、踵のみ上昇、短時間ノイズ、キーポイント欠落、F1=0、F2=0、左右投球腕入替、スケール欠落時のフォールバック。
- ブラウザ画面の静的起動テスト合格：Chromiumの390px・768px・1440pxでJavaScript実行時エラーなし。外部アセットを使わないHTML直結テスト。
- 画像の実測足場条件やiPhone Safari上での動画解析精度は未検証。
- CSV `contactSource` の文字列列出力と高さ差列を追加。推定を実測床反力と取り違えないこと。

## iPhone動画読み込み180秒対応（同一v1.6.5再修正）

- `node --check js/public-v1.6.5.js`：成功。
- Chromium 390px 模擬動画読込テスト：60秒、179秒は待機中、180秒経過で画面内に持続的なエラーを表示：成功。
- Chromium 390px 模擬動画読込テスト：90秒で `loadedmetadata` を受信後に解析画面へ移行：成功。
- Chromium 390px 実MP4（2秒、H.264、320×240）をファイル入力から読み込み、duration/サイズを取得：成功。
- 既存の簡易接地・離地判定および支持反力配分の10項目単体テスト：成功（踏込・軸足の離地／接地、短時間ノイズ、踵のみ上昇、左右入替等）。
- 実機iPhone Safariでの読み込み、および大容量MOV/HEVCの読み込みは未検証。ファイル選択画面が閉じることはiOS標準動作であり、メモリ不足によるタブ再起動や非対応コーデックは待機時間延長だけでは防げません。

## iPhone MOV import rework
- JavaScript syntax / browser synthetic load / local MOV tests: see validation output.
- iPhone Safari physical device and original IMG_8265.mov: not available for validation.

- Automated browser: locally generated MOV H.264 (2.5 s) metadata imported successfully in Chromium.
- Same file reselected successfully.
- Synthetic late metadata (only when preview visible) imported successfully.
- JavaScript console errors in these tests: 0.

## v1.6.5 horizontal inward-positive display regression
- F1 / F2 horizontal display columns now show the inward-positive *reference magnitude* consistent with the preview arrow convention (foot to pelvis), including when the stored pitch-direction component is negative.
- Signed pitch-direction components, their summed balance, ground-contact gating, the force magnitudes, and video loading remain unchanged.
- Caveat: actual sign of per-foot shear is not independently estimated by this public model; displayed positive numbers do not establish actual inward-directed ground force.

### Local automated checks for inward-positive display revision
- `node --check js/public-v1.6.5.js`: PASS.
- 36 synthetic allocator cases (two video travel directions × three net horizontal accelerations × two projected foot layouts × three contact phases): PASS. Both display series nonnegative; flight-phase load = 0; resultant magnitudes invariant; signed `*HorizontalWorld` fields still sum to `forceHorizontal`.
- Vendor model/WASM files identical to the immediate preceding iOS MOV loader release: PASS.
- Safari on-device and measured foot-direction accuracy: NOT VERIFIED.
