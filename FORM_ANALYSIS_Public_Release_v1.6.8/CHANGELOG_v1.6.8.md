# FORM ANALYSIS Public v1.6.8

- Chandler regression masses with sex-specific de Leva adjustment; 2D projected CoM, five-frame position smoothing.
- Same-frame foot force identity: F1 = hypot(F1x,F1z), F2 = hypot(F2x,F2z). Horizontal components are inward-positive reference magnitudes, not independently measured vectors.
- Speed card order: CoM, thorax, pelvis, shoulders, elbows, wrists; removed fingertip speed card.
- Maintained single pose inference pass, video recording, audio checkbox, contact heuristic, offline assets and settings.
- Anthropometric coverage threshold: at least 93% of model body mass visible per frame; missing output otherwise.
