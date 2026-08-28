// First-party copies for the supplied material that is currently enabled for
// direct reading inside InterviewRunway. Keep this separate from the catalog
// so adding more mirrored text records does not change the Drive metadata.
export const DRIVE_MATERIAL_CONTENT: Readonly<Record<string, string>> = {
  "1UujMIm3TJlMlHAjwTOuNC3l7nqbOjPax": `# InterviewRunway Vault production workspace

This workspace implements \`funnel_level_1_gen_req.md\` as a complete,
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

The visual system uses the website's exact \`#FF6B2C\` afterburner accent and
\`#FF8A54\` hot variant over its midnight/steel surfaces. The exact website logo
asset is reused; category-specific yellow, cyan, purple, and green accents are
not used in delivered videos or PDFs.

The narrated set contains 596,082 characters across 10.494 hours of finished
video. Real mock recordings and real student debriefs are explicitly excluded
and were not simulated.

## Folder map

- \`catalog/production_catalog.json\`: intended 450-asset inventory.
- \`content/\`: editable transcript, storyboard, and PDF source material.
- \`sources/company/\`: public-source candidate ledgers.
- \`output/video/\`: original silent video masters.
- \`output/video_voiced/\`: narrated videos plus JSON/CSV delivery manifests.
- \`output/pdf/\`, \`output/templates/\`: built document delivery files.
- \`output/manifest.json\` and \`output/manifest.csv\`: reconciled delivery manifests.
- \`output/exclusions.json\`: intentional exclusions.
- \`reviews/assets/\`: one publication-blocking review record per primary asset.
- \`reviews/automated_qa.json\`: latest automated QA evidence.
- \`mock-interviews/scripts/\`: all 30 full-dialogue mock interviews.
- \`mock-interviews/manifest.json\` and \`manifest.csv\`: script delivery inventory and voice-assignment state.
- \`mock-interviews/audio/\`: 30 mastered Hume interview files, per-turn WAVs, timestamp timelines, and audio manifests.
- \`mock-interviews/\`: category matrix, Match View design, approved pilots, and scenario sources.

## Rebuild and validate

Use the bundled Codex document runtime:

\`\`\`bash
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
python3 /Users/pratheepbv/.codex/skills/mock-int-gen/scripts/validate_interviews.py \\
  --catalog vault/mock-interviews/catalog.json \\
  --scripts-dir vault/mock-interviews/scripts \\
  --report vault/reviews/mock_interview_scripts_qa.json
\`\`\`

\`research_company_sources.py\` performs a network refresh of candidate evidence
URLs and is intentionally separate from the deterministic build.

## Publish gate

Every primary asset is \`publishable: false\`. Publication requires named-human
source, technical/factual, editorial, and final visual sign-off. Company banks
also require three independent public sources including a source confirmed as
recent; remote tax/legal material requires a qualified freshness review.
`,
  "1zheM2-l5t403epnqG2pM0kN6A-FctcJm": `# Vault production status

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

Voice assignment: DSA uses \`8b9ed861-3382-455d-9c03-a40671943d6b\` (40),
system design uses \`cb1a4fae-dad5-4729-bd73-a43f570b9117\` (40), behavioral
uses \`3b8223cb-30e4-4472-9952-21f89f20548d\` (18), and remote uses Pavitra2
\`2e4f5fed-e691-4d6a-bdbe-82880007ad4b\` (14).

Automated QA passes 5,278 checks with zero failures. Final visual QA rendered
938 PDF pages, 25 Word pages, and three representative frames from every video;
the detected blank-page defect was corrected before the final pass.

Website-style alignment is complete: all video and PDF accents now use the
website's \`#FF6B2C\` afterburner orange, with \`#FF8A54\` only as a secondary hot
orange. The previous yellow and category-specific accent colors were removed.

## Remaining before publication

1. Named-human editorial and technical sign-off for every asset.
2. Freshness/qualified review for India tax, GST, contracts, visas, payment,
   and compensation guidance.
3. Company-bank source verification: three independent public sources,
   including one confirmed recent source; thin banks stay unpublished.
4. Final visual inspection on release candidates after any reviewer edits.
5. Human pronunciation and listening review of the narrated release candidates.

Automated QA is recorded in \`reviews/automated_qa.json\`; automation never
converts the human review gate into approval.
Narrated-video QA is recorded in \`reviews/voiced_video_qa.json\`, with the
delivery manifest in \`output/video_voiced/manifest.json\`.

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
`,
  "15pq1I-AvIlzB1chvJrNCbX81n_YRRVFQ": `# Topological Sort: Pattern recognition and reusable templates

## Opening

This lesson builds an interview-ready mental model for Topological Sort, with emphasis on recognition and reusable template. The goal is not to memorize a code shape. The goal is to recognize when the pattern is justified, name the invariant before implementation, and explain why every pointer, state update, or recursive step preserves correctness. The core mental model is simple: Order a directed acyclic graph so every prerequisite appears before what depends on it. During an interview, say the model out loud before touching the editor. That gives the interviewer a testable plan and gives you a reference point when edge cases appear.

## Recognition cues

Strong cues include prerequisites, build order, dependency scheduling, and detect directed cycle. These phrases are evidence, not proof. Translate the prompt into three questions: what part of the input is active, what summary changes incrementally, and what decision lets you discard work permanently? If those answers line up with this pattern, proceed. If the prompt requires arbitrary reordering, nonlocal updates, or a guarantee the pattern cannot provide, choose another tool. A disciplined candidate explains both why a pattern fits and what would make it fail.

## State and invariant

Write the invariant in one sentence: Every queued node currently has zero unresolved incoming dependencies. Treat that sentence as a contract. Before the loop or recursion begins, show why it is true. For every update, explain why it remains true. At termination, connect it directly to the returned answer. This structure turns code narration into a short correctness proof. It also exposes common bugs early: if a variable cannot be connected to the invariant, it may be unnecessary or updated at the wrong time.

## Implementation plan

Use this sequence: build adjacency and indegree, seed all zero-indegree nodes, decrement each outgoing edge once, and compare output count with node count. Start with the clearest correct implementation, then discuss optimization. Name boundary conventions explicitly. If duplicates, empty inputs, or invalid parameters change behavior, decide that behavior before coding. Keep the implementation vocabulary aligned with your explanation: names such as left, right, distance, parent, count, or best should describe their role, not their type. This makes the dry run and test discussion much faster.

## Worked reasoning

Use this representative example: Course Schedule succeeds when Kahn's algorithm emits all courses; a shorter output proves a cycle. Before calculating, predict what the state should mean after the first meaningful step. Then trace at least one normal transition, one boundary transition, and one transition that changes the best answer. Do not narrate every assignment. Narrate the decisions that rule out alternatives. In a live interview, a small table with input position, active state, and current answer is usually enough to make the reasoning visible.

## Complexity

The target analysis is: O(V + E) time and space. Explain the bound by counting operations, not by pointing at the visual nesting of loops. A nested loop can still be linear when a pointer moves only forward across the entire execution. Conversely, a short implementation can hide expensive copies, slicing, sorting, or repeated hashing. State time, auxiliary space, output space when relevant, and the assumptions behind the bound.

## Failure modes

The most common mistakes are reversing edge direction, missing isolated nodes, duplicate-edge indegree errors, and using undirected cycle logic. Test each one deliberately. Use an empty input, a single item, all-equal values, no valid answer, an answer at the first or last position, and the smallest input that forces the main state transition. For numeric problems, add zero, negative values, and overflow-sized totals when the prompt permits them. A good final check is to restate the invariant and verify every mutation preserves it.

## Interview talk track

A concise talk track is: I see Topological Sort because the prompt contains the relevant structural cues. My state will represent the active portion of the input, and my invariant is the contract I just stated. I will update one boundary or decision at a time, restore validity when necessary, and record the answer only when the invariant guarantees it is meaningful. The resulting complexity follows from the bounded number of state transitions. I will dry-run a boundary case before I call the solution complete.

## Practice plan

Practice in three passes. First, classify six prompts without coding and write only the state and invariant. Second, implement two canonical problems from a blank editor while speaking the proof. Third, take one near-miss problem where this pattern looks tempting but is wrong, and explain the disqualifying condition. Revisit the set after forty-eight hours. A pattern counts as learned only when you can identify it, reject it when inappropriate, implement it, test it, and explain its complexity without notes. Finish by writing one new edge case and predicting the result before running code; that prediction is evidence that the mental model, not the syntax, is doing the work.
`,
  "1Xsd3SQecVRZnHr2rN211jFYNd0iVQEQ9": `# Topological Sort: Worked interview problem

## Opening

This lesson builds an interview-ready mental model for Topological Sort, with emphasis on worked interview problem. The goal is not to memorize a code shape. The goal is to recognize when the pattern is justified, name the invariant before implementation, and explain why every pointer, state update, or recursive step preserves correctness. The core mental model is simple: Order a directed acyclic graph so every prerequisite appears before what depends on it. During an interview, say the model out loud before touching the editor. That gives the interviewer a testable plan and gives you a reference point when edge cases appear.

## Recognition cues

Strong cues include prerequisites, build order, dependency scheduling, and detect directed cycle. These phrases are evidence, not proof. Translate the prompt into three questions: what part of the input is active, what summary changes incrementally, and what decision lets you discard work permanently? If those answers line up with this pattern, proceed. If the prompt requires arbitrary reordering, nonlocal updates, or a guarantee the pattern cannot provide, choose another tool. A disciplined candidate explains both why a pattern fits and what would make it fail.

## State and invariant

Write the invariant in one sentence: Every queued node currently has zero unresolved incoming dependencies. Treat that sentence as a contract. Before the loop or recursion begins, show why it is true. For every update, explain why it remains true. At termination, connect it directly to the returned answer. This structure turns code narration into a short correctness proof. It also exposes common bugs early: if a variable cannot be connected to the invariant, it may be unnecessary or updated at the wrong time.

## Implementation plan

Use this sequence: build adjacency and indegree, seed all zero-indegree nodes, decrement each outgoing edge once, and compare output count with node count. Start with the clearest correct implementation, then discuss optimization. Name boundary conventions explicitly. If duplicates, empty inputs, or invalid parameters change behavior, decide that behavior before coding. Keep the implementation vocabulary aligned with your explanation: names such as left, right, distance, parent, count, or best should describe their role, not their type. This makes the dry run and test discussion much faster.

## Worked reasoning

Use this representative example: Course Schedule succeeds when Kahn's algorithm emits all courses; a shorter output proves a cycle. Before calculating, predict what the state should mean after the first meaningful step. Then trace at least one normal transition, one boundary transition, and one transition that changes the best answer. Do not narrate every assignment. Narrate the decisions that rule out alternatives. In a live interview, a small table with input position, active state, and current answer is usually enough to make the reasoning visible.

## Complexity

The target analysis is: O(V + E) time and space. Explain the bound by counting operations, not by pointing at the visual nesting of loops. A nested loop can still be linear when a pointer moves only forward across the entire execution. Conversely, a short implementation can hide expensive copies, slicing, sorting, or repeated hashing. State time, auxiliary space, output space when relevant, and the assumptions behind the bound.

## Failure modes

The most common mistakes are reversing edge direction, missing isolated nodes, duplicate-edge indegree errors, and using undirected cycle logic. Test each one deliberately. Use an empty input, a single item, all-equal values, no valid answer, an answer at the first or last position, and the smallest input that forces the main state transition. For numeric problems, add zero, negative values, and overflow-sized totals when the prompt permits them. A good final check is to restate the invariant and verify every mutation preserves it.

## Interview talk track

A concise talk track is: I see Topological Sort because the prompt contains the relevant structural cues. My state will represent the active portion of the input, and my invariant is the contract I just stated. I will update one boundary or decision at a time, restore validity when necessary, and record the answer only when the invariant guarantees it is meaningful. The resulting complexity follows from the bounded number of state transitions. I will dry-run a boundary case before I call the solution complete.

## Practice plan

Practice in three passes. First, classify six prompts without coding and write only the state and invariant. Second, implement two canonical problems from a blank editor while speaking the proof. Third, take one near-miss problem where this pattern looks tempting but is wrong, and explain the disqualifying condition. Revisit the set after forty-eight hours. A pattern counts as learned only when you can identify it, reject it when inappropriate, implement it, test it, and explain its complexity without notes. Finish by writing one new edge case and predicting the result before running code; that prediction is evidence that the mental model, not the syntax, is doing the work.
`,
};
