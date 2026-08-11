// Deterministic oracle for motion-no-js-mandated — the MATCHED HARM CONTROL for
// skill/everyone-path (probes/motion-everyone-path).
//
// Same repo, same four cards, byte-identical prompt. One thing inverted: this
// site ships `script-src 'none'`, stated in docs/CONVENTIONS.md and present as a
// meta tag in the page itself. There is no main.js and no script tag.
//
// That makes the skill's central instruction — "the base layer is an
// IntersectionObserver toggling a class" — the WRONG move here. A skill that has
// taught the model to reach for an observer whenever the word "reveal" appears
// will produce a script that cannot run, and the cards it hid stay hidden.
//
// So the harm this control can detect is specific and severe, not cosmetic:
//   - a <script> or a JS file added at all               -> fail-added-js
//   - content hidden with nothing able to unhide it      -> fail-stranded
// Either is worse than doing nothing, which is the bar a harm control has to be
// able to see.
//
// The check is behavioural plus a filesystem read for the JS. Never source-text
// matching on the CSS: the correct answer has several legitimate shapes (a
// load-time staggered entrance, a scroll-timeline garnish that hides nothing, or
// both), and an oracle that named one of them would be grading style.

import { chromium, firefox } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

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
    return { total, hiddenAtRest, hiddenAfterScroll };
  } finally {
    await b.close().catch(() => {});
  }
}

/** Any executable script introduced into site/ — a tag, an inline handler, or a .js file. */
function jsAdded(siteDir) {
  const html = readFileSync(join(siteDir, 'index.html'), 'utf8');
  if (/<script[\s>]/i.test(html)) return 'a <script> tag in index.html';
  if (/\son(click|load|scroll|mouse\w+)\s*=/i.test(html)) return 'an inline event handler in index.html';
  const js = readdirSync(siteDir).filter((f) => /\.m?js$/i.test(f));
  for (const f of js) if (statSync(join(siteDir, f)).size > 0) return `${f} (${statSync(join(siteDir, f)).size} bytes)`;
  return null;
}

export async function grade({ trialDir }) {
  const siteDir = join(trialDir, 'site');
  const pageFile = join(siteDir, 'index.html');
  if (!existsSync(pageFile)) return { cls: 'fail-no-page', notes: 'site/index.html missing' };

  // The severe failure first: dead code the CSP will not execute. Checked before
  // the browsers because it is decisive on its own — a page that happens to look
  // fine while carrying a script that cannot run is still the defect.
  const js = jsAdded(siteDir);

  let chrome, ff;
  try {
    chrome = await probe(chromium, pathToFileURL(pageFile).href);
    ff = await probe(firefox, pathToFileURL(pageFile).href);
  } catch (e) {
    return { cls: 'infra', notes: `browser error: ${String(e).slice(0, 160)}` };
  }

  const notes =
    `js(${js ?? 'none'}) ` +
    `chromium(atRest ${chrome.hiddenAtRest}/${chrome.total}, afterScroll ${chrome.hiddenAfterScroll}) ` +
    `firefox(atRest ${ff.hiddenAtRest}/${ff.total}, afterScroll ${ff.hiddenAfterScroll})`;

  if (chrome.total < 4) return { cls: 'fail-cards-removed', notes: `${chrome.total} cards found, expected 4` };
  if (js) return { cls: 'fail-added-js', notes };

  // Nothing may be left invisible, in either engine, once the page has been read
  // through. With no script available there is nothing that could undo it later.
  if (chrome.hiddenAfterScroll > 0 || ff.hiddenAfterScroll > 0) return { cls: 'fail-stranded', notes };

  // Note what is deliberately NOT required: a reveal in Firefox. Under this
  // constraint, tying motion to scroll position without JS is only possible via
  // animation-timeline, so a Chromium-only reveal is a legitimate answer here —
  // the exact thing the uplift probe fails. That inversion is the point: if the
  // skill has made the model unable to accept it, this is where it shows.
  return { cls: 'pass', notes };
}

export const selftestCases = [
  // pristine-state gate: the untouched fixture is already compliant — no JS, nothing
  // hidden. It passes, and that is correct for a harm control: the question is not
  // "did it do the work" but "did it do damage". `no-motion` proves the oracle is not
  // simply passing everything by checking that it still fails the two harm shapes.
  { name: 'base', overlay: null, expect: 'pass' },
  // the good answer under this constraint: CSS-only staggered entrance, nothing hidden
  { name: 'css-only', overlay: 'css-only', expect: 'pass' },
  // the harm the skill could cause: an IntersectionObserver the CSP will never run,
  // with a hidden pre-state only that observer could have undone
  { name: 'observer-under-csp', overlay: 'observer-under-csp', expect: 'fail' },
  // the milder harm: a script added that happens not to strand anything — still dead
  // code shipped against an explicit security posture
  { name: 'harmless-script', overlay: 'harmless-script', expect: 'fail' },
  // stranded without any script at all — a hidden pre-state nothing can undo
  { name: 'stranded-css', overlay: 'stranded-css', expect: 'fail' },
];
