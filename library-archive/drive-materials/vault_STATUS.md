# Vault production status

## Built

| Deliverable | Count | State |
|---|---:|---|
| Silent no-face explainer videos | 112 | Built; 1080p H.264, 5–15 minutes |
| Hume-narrated explainer videos | 112 | Built; four approved voices, scene-synchronized, QA passed |
| Transcripts / SRT / storyboards | 112 each | Built and paired to every video |
| Branded PDFs | 320 | Built |
| Editable Word templates | 18 | Built |
| Primary assets | 450 | Reconciled in JSON and CSV manifests |
| Company evidence ledgers | 50 | Candidate sources collected; human verification open |

The narrated library contains 596,082 characters and 10.494 hours of finished
video. Silent masters remain intact. Real mock recordings and real student
debriefs were excluded exactly as requested.

Voice assignment: DSA uses `8b9ed861-3382-455d-9c03-a40671943d6b` (40),
system design uses `cb1a4fae-dad5-4729-bd73-a43f570b9117` (40), behavioral
uses `3b8223cb-30e4-4472-9952-21f89f20548d` (18), and remote uses Pavitra2
`2e4f5fed-e691-4d6a-bdbe-82880007ad4b` (14).

Automated QA passes 5,278 checks with zero failures. Final visual QA rendered
938 PDF pages, 25 Word pages, and three representative frames from every video;
the detected blank-page defect was corrected before the final pass.

Website-style alignment is complete: all video and PDF accents now use the
website's `#FF6B2C` afterburner orange, with `#FF8A54` only as a secondary hot
orange. The previous yellow and category-specific accent colors were removed.

## Remaining before publication

1. Named-human editorial and technical sign-off for every asset.
2. Freshness/qualified review for India tax, GST, contracts, visas, payment,
   and compensation guidance.
3. Company-bank source verification: three independent public sources,
   including one confirmed recent source; thin banks stay unpublished.
4. Final visual inspection on release candidates after any reviewer edits.
5. Human pronunciation and listening review of the narrated release candidates.

Automated QA is recorded in `reviews/automated_qa.json`; automation never
converts the human review gate into approval.
Narrated-video QA is recorded in `reviews/voiced_video_qa.json`, with the
delivery manifest in `output/video_voiced/manifest.json`.

## Mock-interview expansion

The synthetic practice-interview collection has 30 dialogue scripts, Hume
audio masters, and synchronized Match View videos across five categories. A
spoken-delivery review exposed scripted candidate prose and uneven pacing in
the first production method. One recruiter pilot has now been rewritten and
rebuilt with sentence-sized Hume utterances, native per-voice speed, and no
post-generation tempo stretch. It measures 152.3 candidate WPM against 159.3
interviewer WPM and passes pilot audio/video QA. The other 29 assets remain on
the superseded timing method and are not release candidates. Library-wide
rewrite, voice calibration, and regeneration are paused for human approval of
the corrected pilot.

