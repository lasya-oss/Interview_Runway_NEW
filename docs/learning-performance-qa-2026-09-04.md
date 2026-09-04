# Roadmap and Library performance QA

Local-only changes based on production source `e951e1ecf144f39c3e84f9228a50213acea5aeb0`. No Sites save, release, push or deployment was performed.

## Findings

- The original Library dialog already opened synchronously. The slow part was material availability: the native PDF reader was created only on opening and destroyed on closing. Text companions were fetched and converted again after each open. Deep-linked PDFs also waited for a post-hydration catalogue import.
- Read-only production measurements found approximately 3.34 seconds to first byte for a 33,784-byte PDF and a 6,743-byte text preview; transfer after first byte was negligible. PDF generation took about 10 ms cold and under 2 ms at repeated p95, so generation CPU does not explain a multi-second delay. These measurements identify response latency, not the particular hosting/CDN subsystem responsible.
- Installed Vinext 0.0.50 keys route prefetches by both destination and source route. The persistent sidebar's one-shot viewport prefetch did not prepare the return journey when the current page changed.
- The layout and page independently resolved the same workspace profile, repeating access/progress reads in one HTTP request.

## Changes

- Keep at most two native PDF readers ready for visible or intentionally targeted cards. Background preparation does not evict an open reader. Closed readers are hidden from layout, focus and accessibility; leaving the category/page releases them. Original URLs, PDF contents, native streaming, downloads and fullscreen remain intact.
- Reuse generated text-preview Blobs and in-flight preparations in a bounded cache: up to 24 completed entries / 4 MiB. Each mounted text viewer still owns and revokes its own object URL. Background preparation is limited and respects Data Saver / slow connections. Original PDFs are not converted to Blob URLs.
- Prepare the native Roadmap/Library return route after pathname changes; enable native prefetch for parameterized Roadmap material links. Use native pending-link state for immediate sidebar click acknowledgement, without replacing routing or the progress provider.
- Supply the catalogue during server rendering for an existing `?pdf=` deep link, avoiding the extra client import before opening its material.
- Deduplicate workspace resolution only within the current HTTP request using Vinext's request-local cache. No cross-request account/entitlement cache was introduced.

## Browser measurements

Tests used the production build, a loopback-only QA identity, and an artificial 3,300 ms delay on cold material/RSC responses to reproduce the observed response latency. The harness is outside the Site source and does not alter production authentication. Measurements are click-to-DOM/iframe events, not tool-call duration or production after-deployment results.

| Interaction | Before | After |
| --- | --- | --- |
| Library to Roadmap, prepared return route | 3,350 ms to section content | 44 ms |
| Roadmap to Library, prepared route | No comparable baseline sample | 19-56 ms |
| Sidebar click acknowledgement | No explicit pending feedback | 1-6 ms |
| Final Loop PDF, material available when opening | 3,351 ms cold iframe load | Prepared reader revealed in 26 ms |
| Final Loop PDF reopen | No comparable baseline sample | Prepared reader revealed in 17 ms; no additional PDF request |
| Technical Baseline PDF | No comparable baseline sample | Prepared reader revealed in 7 ms |
| Unprepared Timed Technical Rehearsal PDF | Cold requests remain network-bound | Reader inserted in 7 ms; PDF loaded in 3,341 ms |
| Route after native prefetch expiration | Cold requests remain network-bound | 6 ms click feedback; 3,372 ms to section content |

Final Loop, Technical Baseline and Timed Technical Rehearsal PDFs were visually checked in the actual native reader. The correct material appeared in each. At most two readers were present; leaving Library removed all readers. Reopening Final Loop did not issue another material request. A sample task remained checked (1/24, 4%) after navigating away and back. The graph-traversal Roadmap lesson also opened with its correct content.

The local harness was subsequently made faithful to the observed HTTP ETag/304 behavior (60 ms conditional response delay). The original baseline samples were cold responses, so this does not change their 3,300 ms imposed delay. Native-reader retention does not depend on HTTP-cache reuse. An attempted original-PDF Blob approach and an HTTP-warm-only approach were rejected during QA; neither is the final implementation.

## Validation and boundaries

- Final `npm test`: **85/85 passed** (72 rendered-route/content tests, 9 performance tests, 4 Second Seat tests); its production build passed. `npm run lint` and `git diff --check` passed.
- Full test command includes the production build, rendered-route/content suite, Second Seat suite and performance regressions.
- Performance regressions cover in-flight text deduplication/reuse, retriable failures, memory bounds, safe preparation sources, request-local isolation, native routing, two-reader eviction/protection, source-change retention and original PDF URL preservation.
- Existing tests continue to cover plan selection/access, protected routes, billing validation, library assets, roadmap destinations and progress scoping.
- No learning assets, catalogue content, roadmap mappings, plan definitions, authentication rules, entitlement rules, billing logic, progress persistence or hosting configuration were edited. The workspace-profile change is request-local read deduplication only.
- Generated text-preview cache behavior is covered automatically. A complete browser visual check of every generated Blob preview was not established: the available browser tooling restricts Blob URL navigation. No attempt was made to bypass that restriction.

## Remaining limitations

This is not a claim that every cold request is now instant. Selecting a material before preparation completes, selecting an evicted material, or navigating after Vinext's roughly 30-second prefetch lifetime can still incur the server response delay. The installed public router API cannot refresh one expired prefetch without refreshing the current route. No private router patch, broad account cache, dependency upgrade or extra refresh polling was introduced.

The existing build warning for chunks over 500 KiB remains. Cold-production response latency needs separate hosting/runtime investigation before claiming complete elimination of the reported delay. Production behavior after these changes has not been measured because deployment was explicitly excluded.
