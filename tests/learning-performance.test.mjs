import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createNativePreviewSlots, createPreviewCache, previewInputForMaterial } from '../app/learn/library/material-preview-cache.ts';
import { cacheForRequest } from 'vinext/cache';
import { createRequestContext, runWithRequestContext } from '../node_modules/vinext/dist/shims/unified-request-context.js';

const pdf = { filename: 'guide.pdf', mimeType: 'application/pdf', title: 'Guide', assetUrl: '/pdf-guides/guide.pdf' };
const template = { filename: 'template.docx', title: 'Worked example', assetUrl: '/drive-materials/template.preview.txt' };

test('concurrent preview preparation and reopen reuse one text request', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  let finish;
  globalThis.fetch = () => { requests++; return new Promise(resolve => { finish = resolve; }); };
  try {
    const cache = createPreviewCache();
    const warm = cache.prepare(template);
    assert.equal(cache.has(template), true);
    assert.equal(cache.prepare(template), warm, 'opening while warming must join the in-flight request');
    finish(new Response('# A useful lesson\nA concrete worked example.'));
    const blob = await warm;
    assert.match(await blob.text(), /^%PDF-/);
    const start = performance.now();
    for (let i = 0; i < 20; i++) assert.equal(await cache.prepare(template), blob);
    assert.ok(performance.now() - start < 50, 'warmed/reopened content should be immediately reusable');
    assert.equal(requests, 1);
  } finally { globalThis.fetch = original; }
});

test('text previews retain the generated PDF without refetching or reconverting', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; return new Response('# A worked example\nA useful, complete explanation.'); };
  try {
    const cache = createPreviewCache();
    const first = await cache.prepare(template);
    assert.match(await first.text(), /^%PDF-/);
    assert.equal(cache.peek(template), first);
    assert.equal(await cache.prepare(template), first);
    assert.equal(requests, 1);
    assert.notEqual(await cache.prepare({ ...template, title: 'A different lesson' }), first);
  } finally { globalThis.fetch = original; }
});

test('failed assets are not retained and can be retried', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => ++requests === 1 ? new Response('Unavailable', {status: 503}) : new Response('# Recovered lesson\nA worked example.');
  try {
    const cache = createPreviewCache();
    await assert.rejects(cache.prepare(template), /Material unavailable/);
    assert.equal(cache.has(template), false);
    assert.match(await (await cache.prepare(template)).text(), /^%PDF-/);
    assert.equal(requests, 2);
  } finally { globalThis.fetch = original; }
});

test('preview memory is bounded and no object URLs are kept in the cache', async () => {
  const cache = createPreviewCache(2);
  const inputs = [1, 2, 3].map(i => ({ filename: `${i}.txt`, title: `Lesson ${i}`, source: `Meaningful example ${i}` }));
  for (const input of inputs) await cache.prepare(input);
  assert.equal(cache.peek(inputs[0]), undefined);
  assert.ok(cache.peek(inputs[2]) instanceof Blob);
  const small = createPreviewCache(24, 1);
  await small.prepare(inputs[0]);
  assert.equal(small.peek(inputs[0]), undefined);
});

test('warming excludes private endpoints, external URLs and original media', () => {
  assert.equal(previewInputForMaterial(null), null);
  assert.deepEqual(previewInputForMaterial({ ...pdf, fileId: 'pdf' }), pdf);
  for (const assetUrl of ['/api/private.pdf', 'https://example.com/a.pdf', '//example.com/a.pdf']) {
    assert.equal(previewInputForMaterial({ ...pdf, fileId: 'pdf', assetUrl }), null);
  }
  assert.equal(previewInputForMaterial({ fileId: 'video', filename: 'lesson.mp4', mimeType: 'video/mp4', title: 'Video', fallbackAssetUrl: '/drive-materials/transcript.txt' }), null);
});

test('workspace lookup deduplicates only inside the same request', async () => {
  let calls = 0;
  const lookup = cacheForRequest(async () => ({ call: ++calls }));
  const [first, second] = await Promise.all([1, 2].map(() => runWithRequestContext(createRequestContext(), async () => {
    const pair = await Promise.all([lookup(), lookup()]);
    assert.equal(pair[0], pair[1]);
    return pair[0];
  })));
  assert.notEqual(first, second, 'different accounts/plan cookies must not share request data');
  assert.equal(calls, 2);
  assert.notEqual(await lookup(), await lookup(), 'no cache outside a request');
});

test('routing fix uses native prefetch without remounting or replacing guards/progress', async () => {
  const source = await readFile(new URL('../app/components/member-shell.tsx', import.meta.url), 'utf8');
  assert.match(source, /router\.prefetch\("\/learn\/roadmap"\)/);
  assert.match(source, /router\.prefetch\("\/learn\/library"\)/);
  assert.match(source, /\[pathname, profile\.access\.library, router\]/);
  assert.match(source, /useLinkStatus/);
  assert.doesNotMatch(source, /<RoadmapProgressProvider\s+key=/);
  const session = await readFile(new URL('../app/lib/demo-session.ts', import.meta.url), 'utf8');
  assert.match(session, /resolveWorkspaceProfile = cacheForRequest/);
});

test('native PDF readers are bounded and background warming cannot evict an open reader', () => {
  const slots = createNativePreviewSlots();
  const evicted = [];
  assert.equal(slots.acquire('a', () => evicted.push('a')), true);
  assert.equal(slots.acquire('b', () => evicted.push('b'), true), true);
  assert.equal(slots.acquire('c', () => evicted.push('c')), false);
  assert.equal(slots.acquire('c', () => evicted.push('c'), true, true), true);
  assert.deepEqual(evicted, ['a']);
  assert.equal(slots.acquire('d', () => evicted.push('d'), false, true), false);
  slots.close('b');
  assert.equal(slots.acquire('d', () => evicted.push('d'), false, true), true);
  assert.deepEqual(evicted, ['a', 'b']);
  slots.release('c');
  assert.equal(slots.acquire('e', () => evicted.push('e')), true);
});

test('native PDF preparation retains the original reader and never substitutes a Blob URL', async () => {
  const viewer = await readFile(new URL('../app/learn/library/material-viewer.tsx', import.meta.url), 'utf8');
  assert.match(viewer, /const directUrl = source === undefined && assetUrl && isPdfAsset\(filename, mimeType\) \? assetUrl : null/);
  assert.match(viewer, /if \(directUrl\) return;/);
  const dialog = await readFile(new URL('../app/learn/library/library-material-dialog.tsx', import.meta.url), 'utf8');
  assert.match(dialog, /open \|\| retainNative/);
  assert.match(dialog, /hidden=\{!open\}/);
  assert.match(dialog, /nativePreviewSlots\.release\(titleId\)/);
  assert.match(dialog, /if \(retention.sourceKey !== nativeKey\) setRetention\(\{ sourceKey: nativeKey, retained: open && nativeKey !== null \}\)/, 'A -> B -> A while closed must discard the old source retention state');
});
