# InterviewRunway Vault production workspace

This workspace implements `funnel_level_1_gen_req.md` as a complete,
review-gated content library. Planned inventory and built-file manifests remain
separate so an AI-generated asset cannot be mistaken for a publishable one.

## Built delivery

- 112 no-face, 1920×1080 H.264 explainer videos, each 5–15 minutes.
- 112 scene-synchronized Hume-narrated editions using four approved voices;
  silent masters are retained separately.
- 112 transcripts, 112 SRT caption files, and 112 storyboards.
- 320 branded PDFs spanning DSA, system design, behavioral, remote work,
  career, operations, roadmaps, and company preparation.
- 18 editable Microsoft Word templates.
- 50 company evidence ledgers with public-source candidates and an explicit
  named-human verification gate.

The visual system uses the website's exact `#FF6B2C` afterburner accent and
`#FF8A54` hot variant over its midnight/steel surfaces. The exact website logo
asset is reused; category-specific yellow, cyan, purple, and green accents are
not used in delivered videos or PDFs.

The narrated set contains 596,082 characters across 10.494 hours of finished
video. Real mock recordings and real student debriefs are explicitly excluded
and were not simulated.

## Folder map

- `catalog/production_catalog.json`: intended 450-asset inventory.
- `content/`: editable transcript, storyboard, and PDF source material.
- `sources/company/`: public-source candidate ledgers.
- `output/video/`: original silent video masters.
- `output/video_voiced/`: narrated videos plus JSON/CSV delivery manifests.
- `output/pdf/`, `output/templates/`: built document delivery files.
- `output/manifest.json` and `output/manifest.csv`: reconciled delivery manifests.
- `output/exclusions.json`: intentional exclusions.
- `reviews/assets/`: one publication-blocking review record per primary asset.
- `reviews/automated_qa.json`: latest automated QA evidence.
- `mock-interviews/scripts/`: all 30 full-dialogue mock interviews.
- `mock-interviews/manifest.json` and `manifest.csv`: script delivery inventory and voice-assignment state.
- `mock-interviews/audio/`: 30 mastered Hume interview files, per-turn WAVs, timestamp timelines, and audio manifests.
- `mock-interviews/`: category matrix, Match View design, approved pilots, and scenario sources.

## Rebuild and validate

Use the bundled Codex document runtime:

```bash
PYTHON=/Users/pratheepbv/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
$PYTHON vault/scripts/generate_catalog.py
$PYTHON vault/scripts/generate_full_sources.py
$PYTHON vault/scripts/build_silent_videos.py
$PYTHON vault/scripts/build_all_voiced_videos.py
$PYTHON vault/scripts/build_pdfs.py
$PYTHON vault/scripts/build_full_pdfs.py
$PYTHON vault/scripts/build_full_templates.py
$PYTHON vault/scripts/build_full_manifest.py
$PYTHON vault/scripts/validate_full_vault.py
$PYTHON vault/scripts/validate_voiced_videos.py
$PYTHON vault/scripts/generate_mock_interviews.py
$PYTHON vault/scripts/build_mock_interview_manifest.py
$PYTHON vault/scripts/assign_mock_interview_voices.py
$PYTHON vault/scripts/generate_mock_interview_audio.py --dry-run
$PYTHON vault/scripts/generate_mock_interview_audio.py --remaster-only
$PYTHON vault/scripts/validate_mock_interview_audio.py
$PYTHON vault/scripts/build_mock_interview_videos.py
$PYTHON vault/scripts/validate_mock_interview_videos.py
python3 /Users/pratheepbv/.codex/skills/mock-int-gen/scripts/validate_interviews.py \
  --catalog vault/mock-interviews/catalog.json \
  --scripts-dir vault/mock-interviews/scripts \
  --report vault/reviews/mock_interview_scripts_qa.json
```

`research_company_sources.py` performs a network refresh of candidate evidence
URLs and is intentionally separate from the deterministic build.

## Publish gate

Every primary asset is `publishable: false`. Publication requires named-human
source, technical/factual, editorial, and final visual sign-off. Company banks
also require three independent public sources including a source confirmed as
recent; remote tax/legal material requires a qualified freshness review.

