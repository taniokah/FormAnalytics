# FORM ANALYSIS

**動画から投球フォームを可視化する、ブラウザベースのマーカーレス動作解析ツール。**

**公開版 v1.6.7** · **研究・教育目的は無償／商用利用は別途有償契約が必要** · [English README](./README.md)

> **公開プレビュー**  
> 推定結果は参考値です。力板等による実測や、医学的・競技的な診断を代替するものではありません。

---


### 表示状態を反映した動画保存（v1.6.7）

再生コントロールの上の **「↓ 動画保存」** から、**動画／骨格／床反力矢印** のON/OFFを反映した動画を保存できます。解析済み区間（最大20秒）を、初期状態は音声なしで記録します。「**音声あり**」にチェックすると、元動画の音声も動画に含めます。音声の取得にはブラウザのWeb AudioとMediaRecorderへの対応が必要で、iPhone Safariでは利用できない場合があります。記録は端末内でリアルタイムに行い、再生時間程度かかります。保存形式はブラウザに応じてMP4またはWebM、最大長辺1280px・30fpsです。iPhone Safari実機での録画確認は未実施です。

### 概要

FORM ANALYSIS は、スマートフォンなどで撮影した投球動画を使い、姿勢推定、身体各部の速度、脚別の推定床反力などをブラウザ内で計算・可視化するアプリケーションです。解析用動画を外部の解析サーバーへ送信せず、端末上で処理します。

**公開版 v1.6.7** は、標準的な2D姿勢推定と簡易的な力学モデルに基づくプレビューです。公開されている結果は、精密な3次元計測や検証済みの床反力計測を意味するものではありません。

### アプリを開く

- [公開版 v1.6.7 を開く（GitHub Pages）](https://taniokah.github.io/FormAnalytics/FORM_ANALYSIS_Public_Release_v1.6.7/)
- [公開版 v1.6.7 のファイルを見る（GitHub）](./FORM_ANALYSIS_Public_Release_v1.6.7/)

GitHub Pages の公開設定、ファイル配置、ブラウザのキャッシュ状況によっては反映に時間がかかることがあります。

### 主な機能

| 分類 | 内容 |
| --- | --- |
| 姿勢推定 | MediaPipe Pose Landmarker によるマーカーレス2D姿勢解析。鼻・目・耳・口のランドマークと細い接続線を表示（頭部の円・楕円輪郭は非表示） |
| 速度 | 骨盤中心、胸郭中心、肩・肘・手首・手先などの画面内動作から算出した速度 |
| 床反力 | 踏込足 F1 と軸足 F2 の推定床反力（合力・鉛直・水平の参考値） |
| 支持状態 | 足の動きと左右の相対的な高さの差に基づく接地・離地**候補**の簡易推定 |
| グラフ | 再生時刻と同期する系列値表示、表示切替、タブの横スクロール |
| 動画操作 | 動画／骨格／反力矢印の表示切替、再生・シーク、全画面表示 |
| 出力 | グラフのPNG画像、解析データのCSV |

動画の**解析対象区間は最大20秒**です。長い動画では解析する開始・終了位置を指定できます。解析フレーム数や所要時間は端末の性能と設定によって変化します。

### 使い方

1. 全身が映るように、できるだけ横方向から投球動画を撮影します。可能であれば60 fps以上を推奨します。
2. ホーム画面で身長・体重・性別（記録用）・画面内の投球方向・投球腕（右投げ／左投げ）を指定します。
3. 「動画を選ぶ」から動画を読み込みます。
4. 解析区間やサンプリング設定を確認して解析を実行します。
5. 動画とグラフを連動させながら、速度、脚別の推定床反力、その他の解析指標を確認します。必要に応じてPNG・CSVを保存できます。

**撮影時の注意：** 全身および足部が見切れず、カメラが大きく動かない映像を推奨します。斜め方向からの撮影、遮蔽、マウンドの傾斜、カメラの傾きなどは推定に影響します。

**iPhoneで動画を読み込めない場合：** 動画を端末内に保存してから再選択する、MOV/HEVCから互換性の高いH.264/MP4へ変換する、Safariでページを再読み込みする、といった方法を試してください。機種・コーデック・動画サイズによっては読み込めない場合があります。

### 床反力の見方と限界

- **F1：踏込足（前脚）**、**F2：軸足（後脚）**の推定床反力を示します。
- 合力は、各脚の水平・鉛直成分から求める**大きさ**です（単位：N）。
- 公開版で表示する脚別**水平床反力**は、**各足から骨盤中心へ向かう方向を正**とした参考値です。実際の反力方向を各脚で独立に計測したものではありません。
- CSVの `leadHorizontalWorld` / `driveHorizontalWorld` は、これとは異なる**投球方向基準の符号付き成分**です。表示用の内向き正の値と混同しないでください。
- 接地・離地は足部の2D移動や左右高低差に基づく**ヒューリスティックな候補判定**です。足場の段差、マウンド、遠近差などにより誤判定することがあります。
- 「骨盤中心」は全身の質量分布から算出した**全身重心（CoM）ではありません**。推定速度・反力の解釈にはこの違いに注意してください。

この公開プレビューは、研究・教育・フォームの観察に利用することを想定しています。数値を確定的な運動能力評価、医療判断、傷害リスク判定に直接使用しないでください。

### 技術構成とプライバシー

- HTML / CSS / JavaScript による静的Webアプリケーション
- MediaPipe Tasks Vision（JavaScript / WASM）および Pose Landmarker モデル
- 端末内・ブラウザ内での推論と計算（動画を解析サーバーへアップロードしません）
- 推論用のモデル・WASM等は公開版ディレクトリ内に同梱し、同一オリジンから配信

初回起動時にはアプリ本体やモデルの取得が必要です。キャッシュの状態によってはオフラインで利用できない場合があります。

### 論文等での引用（Citation）

論文・学会発表・研究報告で本アプリの解析結果を使用する場合は、**使用したソフトウェアのバージョン**を明示し、次の「アプリケーション」の書誌情報を引用してください。研究手法の背景について記述する場合には、あわせて関連するSIT2026・WCB2026の発表を引用してください。

**アプリケーション（公開版 v1.6.7）**

> 谷岡 広樹 (2026)．*FORM ANALYSIS*（公開版 v1.6.7）[コンピュータソフトウェア]．GitHub．https://github.com/taniokah/FormAnalytics/tree/main/FORM_ANALYSIS_Public_Release_v1.6.7

**関連研究：SIT2026（日本語発表）**

> 谷岡 広樹，横堀 薫，湯佐 航平，殖栗 正登 (2026)．「マーカーレス解析による投球動作加速局面の両脚床反力推定」．*Sports Informatics and Technology 2026 (SIT2026)*，A-1-3，東京，2026年7月．[徳島大学研究業績データベース](https://db.db.tokushima-u.ac.jp/cgi-bin/edb_browse?EID=467404)

**関連研究：WCB2026（国際学会発表）**

> Tanioka, H., & Ueguri, M. (2026). *Real-Time Markerless and Serverless Estimation of Dual-Foot Ground Reaction Forces during the Acceleration Phase of Baseball Pitching*. 10th World Congress of Biomechanics (WCB 2026), Vancouver, Canada, July 2026. [Tokushima University research record](https://web.db.tokushima-u.ac.jp/cgi-bin/edb_browse?ACT=BROWSE&EID=467401)

**BibTeX形式の引用例（そのままコピーして利用できます）**

```bibtex
@misc{tanioka2026formanalysis,
  author       = {Tanioka, Hiroki},
  title        = {{FORM ANALYSIS} (Public Release v1.6.7)},
  year         = {2026},
  howpublished = {Computer software, GitHub repository},
  url          = {https://github.com/taniokah/FormAnalytics/tree/main/FORM_ANALYSIS_Public_Release_v1.6.7}
}

@inproceedings{tanioka2026sit,
  author    = {Tanioka, Hiroki and Yokobori, Kaoru and Yusa, Kohei and Ueguri, Masato},
  title     = {Markerless Estimation of Ground Reaction Forces during Baseball Pitching Acceleration},
  booktitle = {Sports Informatics and Technology 2026 (SIT2026)},
  year      = {2026},
  address   = {Tokyo, Japan},
  note      = {Conference paper A-1-3},
  url       = {https://db.db.tokushima-u.ac.jp/cgi-bin/edb_browse?EID=467404}
}

@misc{tanioka2026wcb,
  author       = {Tanioka, Hiroki and Ueguri, Masato},
  title        = {Real-Time Markerless and Serverless Estimation of Dual-Foot Ground Reaction Forces during the Acceleration Phase of Baseball Pitching},
  year         = {2026},
  howpublished = {10th World Congress of Biomechanics (WCB 2026), Vancouver, Canada},
  url          = {https://web.db.tokushima-u.ac.jp/cgi-bin/edb_browse?ACT=BROWSE\&EID=467401}
}
```

上記3件は [`references.bib`](./references.bib) からも取得できます。アプリの解析結果を掲載するときは `tanioka2026formanalysis`、研究手法を説明するときは必要に応じて `tanioka2026sit`・`tanioka2026wcb` を引用してください。引用は学術的なお願いであり、ソフトウェアライセンスの追加条件ではありません。

各研究発表と**公開アプリの実装・評価条件は同一とは限りません**。公開版は簡易的な2D推定による参考可視化であり、関連発表の実験精度をそのまま保証するものではありません。英語書誌情報とBibTeXは[英語版の引用情報](./README.md#citation-and-references)をご覧ください。リポジトリ直下の [`CITATION.cff`](./CITATION.cff) はGitHubの「Cite this repository」に対応しています。

### 利用許諾と特許出願について

**FORM ANALYSIS Research & Non-Commercial License v1.0** を適用します。これは**商用利用を制限する独自ライセンス**であり、オープンソースライセンスではありません。

- **研究・教育・個人の非営利利用：無償**。学術研究、授業、非営利の検証、成果の論文発表を含みます。
- **商用利用：事前の有償ライセンス契約が必須**。有償のスポーツ指導・フォーム解析、スポーツジム等の営業利用、商用アプリへの組込み、企業の商用研究開発等が対象です。
- **特許出願中（Patent Pending）**：一部機能に関連する技術について特許を出願中です。特許権の成立を示すものではありません。
- **第三者製コンポーネント**：MediaPipe等には各自のライセンスが適用されます。

利用条件の全文は [LICENSE（英語原文）](./LICENSE)、[LICENSE_JA.md（日本語参考訳）](./LICENSE_JA.md) を参照してください。商用契約については[プロジェクト管理者](https://github.com/taniokah)へお問い合わせください。学術研究でも商用製品開発を主目的とする受託研究等は商用利用に該当する場合があるため、利用目的が不明な場合は事前にご確認ください。

### 免責

本ソフトウェアおよび推定結果は**無保証**で提供されます。推定値の精度・再現性・目的適合性は保証されません。第三者の権利については [THIRD_PARTY_NOTICE.md](./THIRD_PARTY_NOTICE.md) をご確認ください。

**管理者：[ @taniokah ](https://github.com/taniokah)**

### 解析進捗表示（v1.6.7）

解析中は動画の再生映像を表示せず、**完了した推定フレーム数 ÷ 予定フレーム数**から計算したプログレスバーを表示します。姿勢推定は従来どおり1回のみ実行し、各サンプルフレームにつき1回だけ姿勢推定します。モデル選択を含む設定画面は従来のままです。

### 位置系列の平滑化（v1.6.7）

公開版では、全身重心ではなく**骨盤中心（2D代理点）**、胸郭中心、上肢関節、左右足首間隔、足部支持点の位置系列に、一般的な中心移動平均を適用します。各時刻について前後2フレームを含む最大5フレーム（時間差0.16秒以内）の有効な位置を平均し、平滑化した位置から速度・加速度と参考床反力を計算します。中央フレームの位置が欠測した場合は補完しません。接地・離地の候補イベント判定自体は変更していません。複数回推定・信頼度加重融合・未公開の研究用補正技術は含みません。
