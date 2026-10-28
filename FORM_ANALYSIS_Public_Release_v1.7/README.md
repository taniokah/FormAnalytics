# FORM ANALYSIS

**A browser-based, markerless tool for visualizing baseball pitching mechanics from video.**

**Public Release v1.7** · **Free for non-commercial research and education / Paid license required for commercial use** · [日本語 README](./README_JA.md)

> **Public preview**  
> Results are approximate estimates, not force-plate measurements or medical/performance diagnoses.

---


### Exporting annotated video (v1.7)

Select **↓ Save video** above the playback controls. The current **Video / Skeleton / Force arrows** visibility choices are applied to the recorded video. The analyzed segment (up to 20 seconds) is exported without audio by default. Check **音声あり (Include audio)** beside the export button to attempt to include the original video audio. Audio recording requires browser support for Web Audio and MediaRecorder, and may not work on all iPhone Safari versions. Encoding takes approximately the video's playback duration. Output is MP4 or WebM depending on browser support. Recording is performed locally and is limited to 1280px on the longest side and 30fps. Safari on iPhone is not yet device-tested.

### Overview

FORM ANALYSIS is a browser-based application for visualizing baseball pitching mechanics from video recorded with a smartphone or other camera. It estimates pose, motion-derived velocities, and approximate per-foot ground reaction forces (GRFs) **locally in the browser**, without uploading the selected video to an analysis server.

**Public Release v1.7** is a preview based on standard 2D pose estimation and simplified mechanics. It is not a validated 3D motion-capture or force-plate measurement system.

### Open the app

- [Launch Public Release v1.7 (GitHub Pages)](https://taniokah.github.io/FormAnalytics/FORM_ANALYSIS_Public_Release_v1.7/)
- [Browse the v1.7 files (GitHub)](./FORM_ANALYSIS_Public_Release_v1.7/)

GitHub Pages configuration, deployment propagation, or browser caching may affect availability of the latest files.

### Features

| Category | Description |
| --- | --- |
| Pose | Markerless 2D pose estimation using MediaPipe Pose Landmarker; includes nose, eye, ear, and mouth keypoints and subtle connecting lines without a head outline. |
| Velocity | Motion-derived estimates for pelvis/chest centers, shoulders, elbows, wrists, and fingertips |
| GRF | Approximate per-foot ground reaction force magnitude and horizontal/vertical components for lead foot F1 and drive foot F2 |
| Foot events | Heuristic **candidates** for foot contact and liftoff based on 2D foot motion and relative foot height |
| Charts | Playback-synchronized values, selectable series, horizontally scrollable tabs |
| Playback | Video/skeleton/force-arrow toggles, scrubbing, and full-screen playback |
| Export | PNG charts and CSV results |

The analyzed video interval is limited to **20 seconds per analysis**. For longer recordings, select the start/end of the interval. Processing time depends on device capability and settings.

### Quick start

1. Record a pitching motion with the full body visible, preferably from the side. A frame rate of 60 fps or higher is recommended when available.
2. Enter height, weight, sex (for recordkeeping), onscreen pitching direction, and throwing arm (right/left).
3. Choose a video file.
4. Confirm the analysis interval and sampling options, then run the analysis.
5. Review synchronized playback, velocity charts, approximate per-foot GRFs, and other metrics. Export PNG or CSV if needed.

**Recording tips:** Keep the full body and feet visible and minimize camera movement. Oblique views, occlusion, mound slope, and camera tilt may reduce reliability.

**If video loading fails on iPhone:** Try saving the video locally before selecting it, converting MOV/HEVC to H.264/MP4, or reloading the page in Safari. Compatibility varies by device, codec, and file size.

### Interpreting GRF estimates

- **F1 denotes the lead/stride foot**; **F2 denotes the drive/back foot**.
- The reported resultant is the **magnitude** formed from the estimated horizontal and vertical components, in newtons (N).
- The public UI uses a **positive-toward-pelvis-center** convention for the per-foot horizontal GRF display. This is a reference-direction assumption, **not** an independent measurement of the actual force direction for each foot.
- CSV fields `leadHorizontalWorld` and `driveHorizontalWorld` instead retain **signed components along the pitching-direction axis**. Do not interpret them using the same sign convention as the UI reference values.
- Contact and liftoff events are **heuristic candidates**, not confirmed contact events. Camera perspective, sloped surfaces, and differences in foot depth may introduce errors.
- The displayed **pelvis center is not a full-body center of mass (CoM)** computed from segment mass distributions.

This preview is intended for research, education, and qualitative motion review. Do not use its estimates as definitive measures of athletic performance or as the sole basis for medical decisions or injury-risk assessment.

### Technology and privacy

- Static HTML / CSS / JavaScript application
- MediaPipe Tasks Vision (JavaScript / WASM) and Pose Landmarker models
- On-device, in-browser processing; the selected video is not uploaded to an analysis server
- Bundled model and WASM assets loaded from the same origin

Initial setup requires the browser to download application and model assets. Offline operation depends on successful asset caching and browser storage policies.

<a id="citation-and-references"></a>
### Citation and references

If you report results obtained with this application in a paper, presentation, or research report, **cite the specific software version used**. When discussing the underlying research, also cite the relevant conference presentations below as appropriate.

**Software (Public Release v1.7)**

> Tanioka, H. (2026). *FORM ANALYSIS* (Public Release v1.7) [Computer software]. GitHub. https://github.com/taniokah/FormAnalytics/tree/main/FORM_ANALYSIS_Public_Release_v1.7

**Related research — SIT2026**

> Tanioka, H., Yokobori, K., Yusa, K., & Ueguri, M. (2026). *Markerless Estimation of Ground Reaction Forces during Baseball Pitching Acceleration* (conference paper A-1-3). Sports Informatics and Technology 2026 (SIT2026), Tokyo, Japan, July 2026. [Tokushima University research record](https://db.db.tokushima-u.ac.jp/cgi-bin/edb_browse?EID=467404)

**Related research — WCB2026**

> Tanioka, H., & Ueguri, M. (2026). *Real-Time Markerless and Serverless Estimation of Dual-Foot Ground Reaction Forces during the Acceleration Phase of Baseball Pitching*. 10th World Congress of Biomechanics (WCB 2026), Vancouver, Canada, July 2026. [Tokushima University research record](https://web.db.tokushima-u.ac.jp/cgi-bin/edb_browse?ACT=BROWSE&EID=467401)

The **public application's implementation and validation conditions are not necessarily identical** to the methods reported at these conferences. The published conference findings should not be interpreted as validation of all measurements generated by the public preview.

**BibTeX (software and related conference presentations)**

```bibtex
@misc{tanioka2026formanalysis,
  author       = {Tanioka, Hiroki},
  title        = {{FORM ANALYSIS} (Public Release v1.7)},
  year         = {2026},
  howpublished = {Computer software, GitHub repository},
  url          = {https://github.com/taniokah/FormAnalytics/tree/main/FORM_ANALYSIS_Public_Release_v1.7}
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

GitHub's **Cite this repository** feature is supported by the root-level [`CITATION.cff`](./CITATION.cff). The citation metadata identifies the public software; SIT2026 and WCB2026 are separate scholarly references, not alternative names for this software release. The same entries are available in [`references.bib`](./references.bib). Citation is requested as good scholarly practice, not imposed as an additional condition of the software license.

### License, commercial licensing, and patents

FORM ANALYSIS is distributed under the **FORM ANALYSIS Research & Non-Commercial License v1.0**, a **proprietary, source-available license**, not an open-source license.

- **Free of charge for non-commercial research, education, and personal evaluation**, including reporting academic findings.
- **A separate paid license, agreed to in writing before use, is REQUIRED for Commercial Use**, including paid analysis or coaching services, commercial gyms, product integration, and commercial research and development.
- **Patent pending:** Certain features relate to technologies for which patent applications are pending. No patent grant or final claim scope is asserted by this statement.
- **Third-party components** such as MediaPipe remain subject to their own licenses and conditions.

See [LICENSE (authoritative English text)](./LICENSE) and [LICENSE_JA.md (Japanese reference translation)](./LICENSE_JA.md). For commercial licensing, contact the [project maintainer](https://github.com/taniokah). Sponsored research primarily serving commercial product development may qualify as Commercial Use; seek clarification in uncertain cases.

### Disclaimer

The Software and all estimates are provided **AS IS**, without warranty of accuracy, reproducibility, or fitness for any purpose. See [THIRD_PARTY_NOTICE.md](./THIRD_PARTY_NOTICE.md) for upstream licensing.


---

**Maintained by [@taniokah](https://github.com/taniokah)**

### Analysis progress (v1.7)

During analysis, a determinate progress bar replaces the playing video preview. The percentage reflects **completed frame inferences divided by the total scheduled frames**. The pose model and original single-pass calculation are unchanged; the application runs a single pose inference per sampled frame. The existing model-selection settings are unchanged.

### Position smoothing (v1.7)

The public release applies a conventional centered moving mean to the 2D projected Chandler/de Leva CoM estimate, thorax, upper-limb joint tracks, ankle spacing, and foot support locations **before** differentiation and approximate force allocation. Each valid center uses up to five frames (two before, itself, and two after), limited to observations within 0.16 s. Missing centers are not synthesized. This does **not** implement repeat inference, confidence-weighted fusion, or any unreleased research algorithm. The contact-event heuristic itself remains unchanged.


### v1.7 / 更新事項
- 身体部分質量による2D重心推定（Chandler質量回帰＋de Leva性別比率補正）。実測・3D重心ではありません。
- 各脚の合力は同一フレームの水平成分と鉛直成分の二乗和平方根で算出します。
- 速度カードは重心、頭部中心、胸部中心、骨盤中心、両肩、両肘、両手首、両手先の8枚。両手先速度は左右の各フレームをグラフと共有し、カードには左右の最大値を表示します。


### Temporal smoothing setting
Settings allow 1–5 frames of temporal averaging (default: 3). Lower values preserve short-duration peaks but may be noisy; higher values smooth the signals but can reduce peaks. This is not a validated accuracy ranking.


Public UI update: eight speed indicators (including head center and fingertips), six unchanged ground reaction force indicators, and eight dynamics/distance indicators. Release point is a throwing-wrist speed-peak 2D proxy, not observed ball release. Segment energies use assumed mass fractions and should not be treated as validated measurements.


**推定リリースポイント / Estimated release point (public v1.7):** グラフは軸足足首の後方基準位置から投球側指先（欠測時は手首）までの前方距離（m）の時間変化を示し、◆は最初の有意な伸展ピークを示します。/ The graph shows forward fingertip distance from a rear drive-ankle reference (m), with ◆ marking the first prominent extension peak. This is not a direct measurement of ball release.


### v1.7 — Angular velocities (2D projected estimates)

The **04 Angular Velocity / 角速度** tab plots apparent upper-trunk, lower-trunk, and relative twist angular velocities in **deg/s**. The algorithm uses the projected horizontal separation of the shoulder/hip landmarks and temporal derivatives, inspired by the supplied MotionCheck p5.js prototype. Twist angular velocity equals upper minus lower in the same frame. The result depends on throw hand, video direction, viewpoint, landmark reliability, and selectable smoothing (1–5 frames). **These are not observed 3D axial angular velocities.** Invalid observations appear as missing values; graphs/CSV never replace them by zero.

### v1.7 angular plot update (2026-10-28)

The three 04 Angular Velocity metric cards retain the estimated peak angular speeds (deg/s). The corresponding chart and live series selectors now show apparent projected *angles* (deg): upper torso, lower torso, and twist (upper minus lower, frame-aligned). CSV includes both angle and angular-velocity series. These 2D projection values are **not measured 3D axial rotation angles**.
