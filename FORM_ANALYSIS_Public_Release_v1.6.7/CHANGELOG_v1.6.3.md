# FORM ANALYSIS Public v1.6.3 — Playback-synchronized values

- Each graph series tab now shows its current sample value (and unit), at the playback/seek position.
- Side-by-side L/R channels are displayed within their shared tab.
- Readable minimum tab dimensions with horizontal scrolling on narrow screens; the graph itself retains a 320 px minimum height on iPhone.
- Outside the selected analysis interval, tabs show “—” rather than using out-of-range values.
- Static metric cards continue to show the existing summary figures.
- Pose estimation, force calculations and 20-second analysis interval remain unchanged.

## 再作成版：系列タブの高さ・2行表示の調整
- 指標カードの第3行の補足説明を削除。指標名／数値＋単位の2行に統一。
- 再生時点の値を表示する系列ボタンを、v1.6.1の高さ（PC 37px／スマホ 30px）に戻した。
- iPhoneでは系列ボタンのみ横スクロール。グラフは高さ320pxを維持。
- 空欄値には単位を表示しない。再生位置との同期、解析ロジックに変更なし。
- ブラウザキャッシュ更新用にService Workerを別キャッシュへ切り替え。

## v1.6.3 微修正（配布版再ビルド）
- グラフ上部の「床反力 N」トグルの余白、チェックボックス、文字サイズを縮小。PNG・CSVボタンと縦寸法・フォントサイズを統一。
- 3つの操作は今までと同じ位置・機能を維持。床反力2系列の同時表示・解析・グラフ表示は変更なし。
- 旧キャッシュを避けるためCSSキャッシュキー／Service Workerキャッシュキーを更新。バージョン表示は1.6.3のまま。

## v1.6.3 枠高さ統一（再修正版）
- 「床反力 N」「↓ PNG」「↓ CSV」の**外枠の高さ**をCSSで完全に統一。PC 26px、スマートフォン 24px（380px以下は23px）。文字サイズも共通化。
- iOS Safariで差が出ないよう、buttonのネイティブ外観を無効化し、box-sizing・line-height・border・paddingを統一。
- CSSリビジョンとService Workerキャッシュキーを更新。床反力2系列表示、動画解析、グラフ描画は変更していません。
