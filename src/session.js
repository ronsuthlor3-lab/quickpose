// Session planning and practice statistics. Pure functions: no DOM, tested under `node --test`.

/** Classic gesture-class schedules: [count, seconds] steps. */
export const PRESETS = {
  warmup: [[10, 30]],
  classic: [[10, 30], [5, 60], [3, 300], [1, 600]],
  quick: [[20, 30]],
  long: [[4, 300], [2, 900]],
};

/** Seeded PRNG (mulberry32), so a session can be reproduced in tests. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, random = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Turn a schedule into a list of rounds, each with a reference.
 * References are used in shuffled order; when the session is longer than the pool,
 * the pool is reshuffled and reused, avoiding the same reference twice in a row.
 * @param {number[][]} steps   [[count, seconds], ...]
 * @param {any[]} pool         references (image ids or prompt texts)
 * @returns {{seconds: number, ref: any}[]}
 */
export function planSession(steps, pool, random = Math.random) {
  const total = steps.reduce((n, [count]) => n + count, 0);
  if (!pool.length || !total) return [];
  const refs = [];
  let deck = [];
  while (refs.length < total) {
    if (!deck.length) {
      deck = shuffle(pool, random);
      if (pool.length > 1 && deck[0] === refs[refs.length - 1]) deck.push(deck.shift());
    }
    refs.push(deck.shift());
  }
  const rounds = [];
  for (const [count, seconds] of steps) for (let i = 0; i < count; i++) rounds.push({ seconds, ref: refs[rounds.length] });
  return rounds;
}

/** Parse "10x30s, 5x1m, 2x5m" into steps. Returns null when it cannot be read. */
export function parseSchedule(text) {
  const parts = String(text).split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  const steps = [];
  for (const p of parts) {
    const m = /^(\d{1,3})\s*[x×*]\s*(\d{1,4})\s*(s|sec|m|min)?$/i.exec(p);
    if (!m) return null;
    const count = Number(m[1]);
    const seconds = Number(m[2]) * (/^m/i.test(m[3] || 's') ? 60 : 1);
    if (!count || seconds < 5 || seconds > 7200) return null;
    steps.push([count, seconds]);
  }
  return steps;
}

export function formatSchedule(steps) {
  return steps.map(([c, s]) => `${c}x${s % 60 === 0 ? `${s / 60}m` : `${s}s`}`).join(', ');
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export const totalSeconds = (steps) => steps.reduce((n, [c, s]) => n + c * s, 0);

/** Local calendar day "YYYY-MM-DD" for a Date. */
export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Practice statistics from a log of finished sessions [{at: ISO string, seconds, drawings}].
 * Streak = consecutive days up to today (or up to yesterday, if nothing yet today).
 */
export function practiceStats(log, now = new Date()) {
  const days = new Set(log.map((e) => dayKey(e.at)));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = dayKey(weekAgo);
  const week = log.filter((e) => dayKey(e.at) >= weekStart);
  return {
    streak,
    totalDrawings: log.reduce((n, e) => n + (e.drawings || 0), 0),
    totalMinutes: Math.round(log.reduce((n, e) => n + (e.seconds || 0), 0) / 60),
    weekMinutes: Math.round(week.reduce((n, e) => n + (e.seconds || 0), 0) / 60),
    days: days.size,
  };
}
