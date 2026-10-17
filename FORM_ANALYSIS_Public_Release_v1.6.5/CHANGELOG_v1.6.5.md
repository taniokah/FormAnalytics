# FORM ANALYSIS Public v1.6.5

- iOS Safari向け動画読込：イベント登録を src/load より前に移動。
- メタデータ取得の監視を拡張し、45秒待機後に1回のみ再試行。
- 失敗時にはBlob URLを解放し、既存の動画があれば復元。
- 全画面表示、グラフ、20秒解析機能は据え置き。

## ホーム画面の解析条件（同バージョン再更新）
- 身長・体重・性別の下に「投球方向」「投球腕」を2列で配置。
- ホーム画面での選択を解析設定 `direction` と `hand` に反映し、設定ダイアログとの往復でも値を維持。
- iPhone向けの余白と選択欄の文字サイズを調整。

## 左右足の高さ差を用いた接地候補（同バージョン更新）
- 従来の動作時系列に加え、両足の踵・つま先の画像内高さを比較し、上方の足を離地候補とする。足首が確認できる場合は足首高低差も補助確認に使用。
- 上方の足のつま先・踵がともに 7.5 cm 相当以上高い状態が3フレーム連続した場合に離地候補とし、4.2 cm 相当の閾値にヒステリシスを持たせる。値はカメラ映像上での推定であり物理的な接触を保証しない。
- 高さ差の候補がある時は時系列推定より優先し、非接地候補側 F1 または F2 の床反力を0 Nとして反対脚側へ配分。高さ差が確認できなくなった場合は元の時系列推定へ戻る。
- グラフのイベントマーカー、CSVの接地状態・判定出典を結果と整合。CSVに `contactSource`, `footHeightDiffM` を追加。
- 段差・投手マウンドの高低差・カメラの遠近差などによる誤判定があり得るため、未検証の簡易判定であることを明示。非公開の重心軌道予測による接地判定は含まない。

## iPhone動画読み込み修正（v1.6.5、同一バージョン内）
- ファイル選択後の動画メタデータ取得待機を最大180秒（3分）に変更。旧45秒+30秒再試行は廃止。
- メタデータを取得するまで1秒ごとに経過秒数と読み込み状態をホーム画面・通知に表示。
- 選択直後の `fileInput.value=''` を廃止し、iOS SafariでのFile参照の早期解放を回避。
- `loadedmetadata`, `loadeddata`, `canplay`, `durationchange` などを監視。デコードエラーやタイムアウト時は明示的にエラーを表示し、既存動画を復元。
- 新規ファイル選択があれば以前の読み込み待機を中止し、新しい読み込みへ切り替える。
- 既存の軸足・踏込足離地／接地ヒューリスティック（高低差および足部動作順序）は変更せず維持。
- 注意：ファイル選択シートが閉じるのは選択完了時のiOS標準動作です。OSによるタブ再読み込みや非対応コーデックに対してアプリ側の待機時間だけでの解決は保証しません。
- 読み込み中にSafariがページを再読み込みした場合、同一セッション内の再起動後に原因切り分け用のメッセージを表示します（Fileデータや名前は保存しません）。

## iPhone MOV reading regression mitigation (2026-10-17)
- Restore v1.6.1 automatic media preloading (auto rather than metadata).
- Show the video viewer while waiting for Safari metadata, avoiding a display:none media ancestor.
- Preserve up to 180 seconds of waiting; show a persistent loading state and allow users to tap ▶ to initiate native playback.
- Log file-read health and media readyState/networkState if loading fails.
- Reset file input on change so the exact same MOV can be selected again.
- Analysis remains disabled until metadata is available.
- No changes to pose estimation, load partitioning, contact heuristics, or charts.

## 脚別水平床反力の符号表示統一（v1.6.5 同一バージョン再修正）
- 軸足 F2 と踏込足 F1 の水平床反力表示は、それぞれの足部から骨盤中心へ向かう向きを正として統一。
- 従来の共通進行方向配分から付与された負符号を、プレビューの足→骨盤中心矢印の表示方向に合わせて変更。脚別水平表示値は内向き正の参考大きさ（非負）とする。
- 公開版の簡易モデルは、個々の足の水平反力ベクトルの作用方向を独立推定しない。実測の向きや外向き反力の有無を示すものではない。
- 従来の進行方向基準の符号付き成分 leadHorizontalWorld / driveHorizontalWorld およびその合計 forceHorizontal は変更せず、CSVに維持。
- 脚別の鉛直成分・合力の大きさ・接地候補・動画読込・グラフUIは変更なし。
