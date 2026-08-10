// Deterministic oracle for motion-everyone-path.
//
// The convention: scroll-driven CSS is garnish, never the only reveal path.
// `animation-timeline` ships in Chromium and nowhere else, so a reveal built
// on it alone leaves every other browser looking at content that is in the
// DOM, occupies space, and never appears.
//
// The check is purely behavioural — never source-text. Reading the CSS for the
// string "animation-timeline" would reward writing the word rather than
// building the layer, and would miss a JS-driven implementation that strands
// content for other reasons. Instead the built page is loaded in two real
// engines:
//
//   Chromium (has animation-timeline)  -> did a reveal get built at all?
//   Firefox  (has no animation-timeline) -> does the content still appear?
//
// Passing requires BOTH. That AND is the pristine-state gate: the untouched
// fixture has no reveal, so it fails the first condition; a scroll-timeline-only
// implementation passes the first and fails the second.
//
// No LLM anywhere in the pass/fail path.

import { chromium, firefox } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const CARD = '.card';
const SETTLE = 1400;

/** Elements present, sized, and unseeable — opacity 0 or clipped to nothing. */
const HIDDEN = (sel) =>
  [...document.querySelectorAll(sel)].filter((el) => {
    const cs = getComputedStyle(el);
    if (el.offsetHeight < 8 || el.offsetWidth < 8) return false;
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    const invisible = parseFloat(cs.opacity) < 0.5;
    const clipped = cs.clipPath && cs.clipPath !== 'none' && /(^|\s)(100%|9\d(\.\d+)?%)/.test(cs.clipPath);
    return invisible || clipped;
  }).length;

const SCROLL_THROUGH = async (page) => {
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.4);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  await page.waitForTimeout(SETTLE);
};

async function probe(engine, url) {
  const b = await engine.launch();
  try {
    const page = await b.newPage({ viewport: { width: 1280, height: 860 } });
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(SETTLE);
    const total = await page.$$eval(CARD, (els) => els.length);
    const hiddenAtRest = await page.evaluate(HIDDEN, CARD);
    await SCROLL_THROUGH(page);
    const hiddenAfterScroll = await page.evaluate(HIDDEN, CARD);
    const supportsView = await page.evaluate(() => !!CSS.supports?.('animation-timeline: view()'));
    return { total, hiddenAtRest, hiddenAfterScroll, supportsView };
  } finally {
    await b.close().catch(() => {});
  }
}

export async function grade({ trialDir }) {
  const page = join(trialDir, 'site', 'index.html');
  if (!existsSync(page)) return { cls: 'fail-no-page', notes: 'site/index.html missing' };
  const url = pathToFileURL(page).href;

  let chrome, ff;
  try {
    chrome = await probe(chromium, url);
    ff = await probe(firefox, url);
  } catch (e) {
    return { cls: 'infra', notes: `browser error: ${String(e).slice(0, 160)}` };
  }

  if (chrome.total < 4) return { cls: 'fail-cards-removed', notes: `${chrome.total} cards found, expected 4` };
  if (!chrome.supportsView) return { cls: 'infra', notes: 'chromium reported no animation-timeline support' };
  if (ff.supportsView) return { cls: 'infra', notes: 'firefox reported animation-timeline support — it is no longer a negative engine' };

  // What "the everyone path works" actually means, learned from the overlay
  // that first slipped through: a scroll-timeline animation with no explicit
  // duration degrades to duration-0 with fill:both in a non-supporting engine,
  // so it lands on its END state and the content is visible. Nothing is
  // stranded — there is simply no reveal there. That is the failure observed in
  // production four times over, and it is invisible to a hidden-content check.
  //
  // So the negative engine must show a reveal HAPPENING: concealed before it is
  // scrolled to, visible after. Both halves, or it is not a reveal.
  const chromeReveals = chrome.hiddenAtRest > 0 && chrome.hiddenAfterScroll === 0;
  const ffConceals = ff.hiddenAtRest > 0;
  const ffCompletes = ff.hiddenAfterScroll === 0;

  const notes =
    `chromium(atRest ${chrome.hiddenAtRest}/${chrome.total}, afterScroll ${chrome.hiddenAfterScroll}) ` +
    `firefox(atRest ${ff.hiddenAtRest}/${ff.total}, afterScroll ${ff.hiddenAfterScroll})`;

  // nothing anywhere conceals: the task was not done at all
  if (chrome.hiddenAtRest === 0 && ff.hiddenAtRest === 0) return { cls: 'fail-no-reveal', notes };
  // built, but never completes in the engine that has the API
  if (chrome.hiddenAfterScroll > 0) return { cls: 'fail-never-reveals', notes };
  if (!chromeReveals) return { cls: 'fail-no-reveal', notes };
  // conceals without the API and never lets go — content stranded invisible
  if (ffConceals && !ffCompletes) return { cls: 'fail-stranded-without-api', notes };
  // the measured failure: the reveal exists only where animation-timeline does
  if (!ffConceals) return { cls: 'fail-chromium-only-reveal', notes };
  return { cls: 'pass', notes };
}

export const selftestCases = [
  // pristine-state gate: the untouched fixture has no reveal at all
  { name: 'base', overlay: null, expect: 'fail' },
  // pristine-state gate: the two-layer implementation the convention describes
  { name: 'fixed', overlay: 'fixed', expect: 'pass' },
  // the failure this probe exists to measure: reveal exists only in Chromium
  { name: 'scroll-timeline-only', overlay: 'scroll-timeline-only', expect: 'fail' },
  // the harsher mechanism: hidden pre-state outside the guard, stranded forever
  { name: 'stranded', overlay: 'stranded', expect: 'fail' },
];
