import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatClock, formatSchedule, parseSchedule, planSession, practiceStats, PRESETS, rng, totalSeconds } from '../src/session.js';

test('presets add up', () => {
  assert.equal(totalSeconds(PRESETS.classic), 10 * 30 + 5 * 60 + 3 * 300 + 600);
});

test('schedule text round-trips', () => {
  assert.deepEqual(parseSchedule('10x30s, 5x1m, 2 × 5 min'), [[10, 30], [5, 60], [2, 300]]);
  assert.equal(formatSchedule([[10, 30], [5, 60]]), '10x30s, 5x1m');
  assert.equal(parseSchedule('hello'), null);
  assert.equal(parseSchedule('3x2s'), null, 'too short to be useful');
});

test('a session uses every reference before repeating, and never repeats back to back', () => {
  const pool = ['a', 'b', 'c', 'd'];
  const rounds = planSession([[10, 30]], pool, rng(42));
  assert.equal(rounds.length, 10);
  assert.deepEqual([...new Set(rounds.slice(0, 4).map((r) => r.ref))].sort(), pool);
  for (let i = 1; i < rounds.length; i++) assert.notEqual(rounds[i].ref, rounds[i - 1].ref);
});

test('round durations follow the schedule order', () => {
  const rounds = planSession([[2, 30], [1, 60]], [1, 2, 3], rng(1));
  assert.deepEqual(rounds.map((r) => r.seconds), [30, 30, 60]);
});

test('empty pool gives no rounds', () => {
  assert.deepEqual(planSession([[5, 30]], []), []);
});

test('clock formatting', () => {
  assert.equal(formatClock(59.2), '1:00');
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(-3), '0:00');
});

test('streak counts consecutive days, allowing today to be empty', () => {
  const now = new Date(2026, 9, 26, 20, 0);
  const at = (d) => new Date(2026, 9, d, 10, 0).toISOString();
  const log = [{ at: at(23), seconds: 600, drawings: 10 }, { at: at(24), seconds: 300, drawings: 5 }, { at: at(25), seconds: 60, drawings: 2 }];
  assert.equal(practiceStats(log, now).streak, 3);
  assert.equal(practiceStats([...log, { at: at(26), seconds: 60, drawings: 1 }], now).streak, 4);
  assert.equal(practiceStats([{ at: at(20), seconds: 60, drawings: 1 }], now).streak, 0);
  const s = practiceStats(log, now);
  assert.equal(s.totalDrawings, 17);
  assert.equal(s.weekMinutes, 16);
});
