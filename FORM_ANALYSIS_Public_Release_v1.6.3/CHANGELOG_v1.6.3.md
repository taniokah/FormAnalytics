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
