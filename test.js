import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createDefaultState,
  computePodMetrics,
  formatGoalValue,
  PRESET_STUDY_GOALS,
  toggleUserTimer,
  reconcileRunningTimers,
} from './src/data/studyData.js';
import {
  getTexts,
  getGoalTitle,
  getWeekdayLabel,
} from './src/data/i18n.js';
import { createAppServer } from './server.js';

// 1. Verify default state & pod metrics calculation
const defaultState = createDefaultState();
const metrics = computePodMetrics(defaultState);

assert.equal(metrics.combinedPercent, 43, 'Default combinedPercent should be 43');
assert.equal(metrics.inSyncCount, 2, 'Default inSyncCount should be 2');
assert.equal(metrics.totalDailyGoals, 7, 'Default totalDailyGoals should be 7');
assert.equal(metrics.user1Dots, 12, 'Default user1Dots should be 12');
assert.equal(metrics.user2Dots, 12, 'Default user2Dots should be 12');

// 2. Verify formatGoalValue formatting
const studyHoursGoal = PRESET_STUDY_GOALS.find((g) => g.id === 'study-hours');
const flashcardsGoal = PRESET_STUDY_GOALS.find((g) => g.id === 'flashcards');
const readingGoal = PRESET_STUDY_GOALS.find((g) => g.id === 'reading');

assert.equal(formatGoalValue(studyHoursGoal, 360), '6h');
assert.equal(formatGoalValue(studyHoursGoal, 430), '7h 10m');
assert.equal(formatGoalValue(flashcardsGoal, 2200), '2,200');
assert.equal(formatGoalValue(readingGoal, 5), '5 pgs');

// 2b. Verify iOS PWA Manifest, Icons, Service Worker & Standalone Detector
const manifest = JSON.parse(fs.readFileSync('./public/manifest.json', 'utf8'));
assert.equal(manifest.id, '/');
assert.equal(manifest.display, 'standalone');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);
assert.ok(fs.existsSync('./public/apple-touch-icon.png'));
assert.ok(fs.existsSync('./public/icon-192.png'));
assert.ok(fs.existsSync('./public/icon-512.png'));
assert.ok(fs.existsSync('./public/sw.js'));
assert.ok(fs.existsSync('./src/components/IosPwaInstallModal.jsx'));

// 2c. Verify Bilingual Arabic (ar) & English (en) Localization + RTL Safeguards
const enTexts = getTexts('en');
const arTexts = getTexts('ar');
assert.equal(enTexts.together, 'Together');
assert.equal(arTexts.together, 'معاً');
assert.equal(getGoalTitle(studyHoursGoal, 'ar', false), 'دراسة عميقة');
assert.equal(getGoalTitle(flashcardsGoal, 'ar', true), 'البطاقات');
assert.equal(getWeekdayLabel('M', 0, 'ar'), 'ن');
const indexCss = fs.readFileSync('./src/index.css', 'utf8');
assert.ok(indexCss.includes('[dir="rtl"] *:not(.font-mono)'));
assert.ok(indexCss.includes('inset-inline-start: 52px'));
assert.ok(indexCss.includes('backdrop-filter: none'));
const heroGaugeSrc = fs.readFileSync('./src/components/HeroGauge.jsx', 'utf8');
assert.ok(heroGaugeSrc.includes("lang !== 'ar'"));

// 2d. Verify Wall-Clock Background Timer (survives screen lock / backgrounding)
const t0 = 1_700_000_000_000;
const startedTimerState = toggleUserTimer(
  defaultState,
  'user1',
  1500,
  'Deep Study',
  false,
  t0
);
assert.equal(startedTimerState.user1.studyingNow, true);
assert.equal(startedTimerState.user1.timerEndAt, t0 + 1_500_000);
// Simulate 10 minutes (600s) with screen locked (zero JS ticks during lock)
const after10Min = reconcileRunningTimers(startedTimerState, t0 + 600_000);
assert.equal(after10Min.changed, true);
assert.equal(after10Min.nextState.user1.timerRemainingSec, 900);
assert.equal(after10Min.nextState.user1.studyingNow, true);
// Simulate timer finishing while screen was locked (26 minutes elapsed)
const afterFinish = reconcileRunningTimers(startedTimerState, t0 + 1_560_000);
assert.equal(afterFinish.nextState.user1.studyingNow, false);
assert.equal(afterFinish.completedUsers.length, 1);
assert.equal(afterFinish.completedUsers[0].minutes, 25);
const u1HoursAfter = afterFinish.nextState.goals.find(
  (g) => g.id === 'study-hours'
).user1;
assert.equal(u1HoursAfter, 360 + 25);

// 3. Verify SQLite API endpoints in-memory
const server = createAppServer(':memory:');

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // GET /api/pods/ZAU8PP
  const getRes = await fetch(`${baseUrl}/api/pods/ZAU8PP`, {
    signal: AbortSignal.timeout(3000),
  });
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.equal(getJson.code, 'ZAU8PP');
  assert.equal(getJson.state.podCode, 'ZAU8PP');
  assert.equal(getJson.state.streak, 12);

  // POST /api/pods/ZAU8PP/sync
  const updatedState = { ...getJson.state, streak: 15 };
  const syncRes = await fetch(`${baseUrl}/api/pods/ZAU8PP/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: updatedState }),
    signal: AbortSignal.timeout(3000),
  });
  assert.equal(syncRes.status, 200);
  const syncJson = await syncRes.json();
  assert.equal(syncJson.ok, true);
  assert.equal(syncJson.state.streak, 15);

  // POST /api/pods/create
  const createRes = await fetch(`${baseUrl}/api/pods/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(3000),
  });
  assert.equal(createRes.status, 200);
  const createJson = await createRes.json();
  assert.match(createJson.code, /^[A-Z0-9]{6}$/);
  assert.equal(createJson.state.podCode, createJson.code);

  console.log('ALL TESTS PASSED');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
