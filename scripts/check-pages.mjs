#!/usr/bin/env node
/**
 * Dev-only page-budget check. Nothing in the app ships a PDF.
 *
 * The assignment rule is three A4 pages per answer. To prove it, the script
 * prints each subject into a throw-away PDF inside the operating system's temp
 * folder, counts the sheets, then deletes the file. If a question overflowed
 * onto a fourth page the check fails with the subject name.
 *
 * It uses the Chrome/Edge that is already installed — no npm package and no
 * browser download.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'web');
const PAGES_PER_QUESTION = 3;

/** Question count comes from the assignment paper, not from the HTML. */
const SUBJECTS = [
  { id: '5BCA1_COM_DCOM', questions: 2 },
  { id: '5BCA2_Multimedia', questions: 3 },
  { id: '5BCA3_JAVA', questions: 3 },
  { id: '5BCA4_Oracle', questions: 3 },
  { id: '5BCA5_Centre_Management', questions: 2 }
];

/* ------------------------------------------------------------- browser */

function onPath(name) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(finder, [name], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  const first = String(res.stdout).split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  return first && existsSync(first) ? first : null;
}

function findBrowser() {
  const override = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (override && existsSync(override)) return override;

  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/snap/bin/chromium'
        ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  for (const name of ['google-chrome', 'chrome', 'chromium', 'msedge', 'microsoft-edge']) {
    const found = onPath(name);
    if (found) return found;
  }

  return null;
}

/* ------------------------------------------------------------- printing */

function printToPdf(browser, htmlPath, pdfPath) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    '--no-pdf-header-footer',
    '--print-to-pdf-no-header',
    '--virtual-time-budget=4000',
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href
  ];

  const res = spawnSync(browser, args, { encoding: 'utf8', timeout: 180000 });
  if (res.error) throw res.error;
  if (res.status !== 0 || !existsSync(pdfPath)) {
    throw new Error(`headless print failed (exit ${res.status}): ${res.stderr || res.stdout || ''}`);
  }
}

/** Count /Type /Page objects — accurate for the PDFs Chrome produces. */
function countPages(pdfPath) {
  const raw = readFileSync(pdfPath).toString('latin1');
  const pages = (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length;
  if (pages > 0) return pages;
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  return counts.length ? Math.max(...counts) : 0;
}

/* ----------------------------------------------------------------- main */

function main() {
  const browser = findBrowser();
  if (!browser) {
    console.warn('warning: no Chrome/Edge found; set CHROME_PATH to run the page-budget check.');
    return;
  }

  // Throw-away folder: nothing here is committed, bundled or published.
  const temp = mkdtempSync(path.join(os.tmpdir(), 'bca-page-check-'));
  const problems = [];

  const wanted = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const chosen = wanted.length
    ? SUBJECTS.filter((subject) => wanted.some((name) => subject.id.includes(name)))
    : SUBJECTS;

  console.log(`browser: ${browser}`);
  console.log(`scratch: ${temp}\n`);

  try {
    for (const subject of chosen) {
      const htmlPath = path.join(WEB, `${subject.id}.html`);
      if (!existsSync(htmlPath)) {
        problems.push(`${subject.id}: page missing`);
        continue;
      }

      const pdfPath = path.join(temp, `${subject.id}.pdf`);
      printToPdf(browser, htmlPath, pdfPath);

      const pages = countPages(pdfPath);
      const expected = subject.questions * PAGES_PER_QUESTION;
      console.log(`${pages === expected ? 'ok  ' : 'FAIL'} ${subject.id.padEnd(22)} ${pages}/${expected} pages`);

      if (pages !== expected) {
        problems.push(`${subject.id}: ${pages} pages, expected ${expected} (a page overflowed or is missing)`);
      }
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }

  if (problems.length) {
    console.error('\nPage budget broken:');
    for (const problem of problems) console.error(` - ${problem}`);
    process.exit(1);
  }

  console.log('\nEvery answer fits its three A4 sheets.');
}

main();
