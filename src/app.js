import { detectLanguage, getLanguage, setLanguage, t } from './i18n.js';
import { PROMPTS } from './prompts.js';
import { formatClock, formatSchedule, parseSchedule, planSession, practiceStats, PRESETS, totalSeconds } from './session.js';

const $ = (id) => document.getElementById(id);
const LOG_KEY = 'quickpose.log';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

const state = {
  images: [], // {url, name}
  source: 'images',
  steps: PRESETS.warmup,
  preset: 'warmup',
  session: null, // {rounds, index, remaining, endAt, paused, flips, startedAt, practised}
  timer: 0,
  wakeLock: null,
};

// ---------------- setup: images ----------------

function addFiles(files) {
  const imgs = [...files].filter((f) => f.type.startsWith('image/'));
  for (const f of imgs) state.images.push({ url: URL.createObjectURL(f), name: f.name });
  renderImages();
}

function renderImages() {
  const n = state.images.length;
  $('img-count').textContent = n ? t('imagesLoaded', { n }) : t('noImages');
  $('thumbs').replaceChildren(
    ...state.images.slice(0, 24).map((im) => Object.assign(document.createElement('img'), { src: im.url, alt: '', loading: 'lazy' })),
  );
  renderTotal();
}

$('files').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('folder').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });

// Dropping a folder: walk it with the entries API.
async function filesFromDrop(items) {
  const out = [];
  const walk = (entry) =>
    new Promise((resolve) => {
      if (entry.isFile) entry.file((f) => { out.push(f); resolve(); }, resolve);
      else if (entry.isDirectory) {
        const reader = entry.createReader();
        const all = [];
        const read = () => reader.readEntries(async (batch) => {
          if (!batch.length) { for (const e of all) await walk(e); resolve(); return; }
          all.push(...batch);
          read();
        }, resolve);
        read();
      } else resolve();
    });
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) await walk(entry);
    else if (item.getAsFile()) out.push(item.getAsFile());
  }
  return out;
}

const zone = $('src-images');
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('over'));
zone.addEventListener('drop', async (e) => {
  e.preventDefault();
  zone.classList.remove('over');
  addFiles(await filesFromDrop([...e.dataTransfer.items]));
});

for (const r of document.querySelectorAll('input[name="src"]')) {
  r.addEventListener('change', () => {
    state.source = r.value;
    $('src-images').hidden = r.value !== 'images';
    $('src-prompts').hidden = r.value !== 'prompts';
    $('start-msg').textContent = '';
  });
}

// ---------------- setup: schedule ----------------

function selectPreset(name) {
  state.preset = name;
  state.steps = PRESETS[name];
  for (const b of document.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === name));
  $('custom').value = formatSchedule(state.steps);
  $('sched-msg').textContent = '';
  renderTotal();
}

for (const b of document.querySelectorAll('[data-preset]')) b.addEventListener('click', () => selectPreset(b.dataset.preset));

$('custom').addEventListener('input', () => {
  const steps = parseSchedule($('custom').value);
  for (const b of document.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', 'false');
  if (!steps) {
    $('sched-msg').textContent = t('badSchedule');
    $('sched-msg').className = 'msg error';
    return;
  }
  state.preset = null;
  state.steps = steps;
  renderTotal();
});

function humanDuration(seconds) {
  const m = Math.round(seconds / 60);
  if (seconds < 60) return getLanguage() === 'th' ? `${seconds} วินาที` : `${seconds} sec`;
  if (m < 60) return getLanguage() === 'th' ? `${m} นาที` : `${m} min`;
  const h = Math.floor(m / 60);
  return getLanguage() === 'th' ? `${h} ชม. ${m % 60} นาที` : `${h} h ${m % 60} min`;
}

function renderTotal() {
  const n = state.steps.reduce((a, [c]) => a + c, 0);
  $('sched-msg').textContent = t('total', { n, time: humanDuration(totalSeconds(state.steps)) });
  $('sched-msg').className = 'msg';
}

// ---------------- stats ----------------

function readLog() {
  try { return JSON.parse(store.get(LOG_KEY)) || []; } catch { return []; }
}

function renderStats() {
  const s = practiceStats(readLog());
  $('st-streak').textContent = s.streak;
  $('st-week').textContent = s.weekMinutes;
  $('st-drawings').textContent = s.totalDrawings;
  $('st-days').textContent = s.days;
}

// ---------------- practice ----------------

let audio = null;
function beep(freq = 880, ms = 120) {
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch {}
}

async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) state.wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && state.wakeLock) { await state.wakeLock.release(); state.wakeLock = null; }
  } catch {}
}

function show(screen) {
  for (const id of ['setup', 'practice', 'done']) $(id).hidden = id !== screen;
}

function start() {
  const pool = state.source === 'images' ? state.images.map((_, i) => i) : PROMPTS[getLanguage()].map((_, i) => i);
  if (state.source === 'images' && !state.images.length) {
    $('start-msg').textContent = t('needSource');
    return;
  }
  const rounds = planSession(state.steps, pool);
  const flip = $('opt-flip').checked;
  state.session = {
    rounds: rounds.map((r) => ({ ...r, flip: flip && Math.random() < 0.5, used: 0 })),
    index: 0,
    remaining: rounds[0].seconds,
    paused: false,
    source: state.source,
    lang: getLanguage(),
    lastBeep: null,
  };
  if (audio?.state === 'suspended') audio.resume();
  if ($('opt-beep').checked) beep(660, 1); // unlock audio on this user gesture
  if ($('opt-wake').checked) keepAwake(true);
  $('stage').classList.toggle('gray', $('opt-gray').checked);
  show('practice');
  enterRound(0);
  clearInterval(state.timer);
  state.timer = setInterval(tick, 100);
}

function enterRound(i) {
  const s = state.session;
  s.index = i;
  const r = s.rounds[i];
  s.remaining = r.seconds;
  s.endAt = performance.now() + r.seconds * 1000;
  s.lastBeep = null;
  $('round').textContent = t('round', { i: i + 1, n: s.rounds.length });
  if (s.source === 'images') {
    $('ref').hidden = false;
    $('prompt').hidden = true;
    $('ref').src = state.images[r.ref].url;
    $('ref').style.transform = r.flip ? 'scaleX(-1)' : '';
  } else {
    $('ref').hidden = true;
    $('prompt').hidden = false;
    $('prompt').textContent = PROMPTS[s.lang][r.ref];
  }
  tick();
}

function tick() {
  const s = state.session;
  if (!s || s.paused) return;
  s.remaining = Math.max(0, (s.endAt - performance.now()) / 1000);
  const r = s.rounds[s.index];
  r.used = r.seconds - s.remaining;
  $('clock').textContent = formatClock(s.remaining);
  $('clock').classList.toggle('ending', s.remaining <= 5);
  $('progress').style.width = `${(1 - s.remaining / r.seconds) * 100}%`;
  const whole = Math.ceil(s.remaining);
  if ($('opt-beep').checked && whole <= 3 && whole >= 1 && s.lastBeep !== whole) {
    s.lastBeep = whole;
    beep(880, 90);
  }
  if (s.remaining <= 0) {
    if ($('opt-beep').checked) beep(1320, 200);
    if (s.index + 1 < s.rounds.length) enterRound(s.index + 1);
    else finish();
  }
}

function togglePause() {
  const s = state.session;
  if (!s) return;
  s.paused = !s.paused;
  if (!s.paused) s.endAt = performance.now() + s.remaining * 1000;
  $('paused').hidden = !s.paused;
  $('b-pause').textContent = t(s.paused ? 'play' : 'pause');
}

function step(delta) {
  const s = state.session;
  if (!s) return;
  const i = s.index + delta;
  if (i < 0) return;
  if (i >= s.rounds.length) return finish();
  if (s.paused) togglePause();
  enterRound(i);
}

function finish() {
  const s = state.session;
  if (!s) return;
  clearInterval(state.timer);
  keepAwake(false);
  const practised = s.rounds.filter((r) => r.used >= 5);
  const seconds = Math.round(practised.reduce((n, r) => n + r.used, 0));
  if (practised.length) {
    const log = readLog();
    log.push({ at: new Date().toISOString(), seconds, drawings: practised.length });
    store.set(LOG_KEY, JSON.stringify(log.slice(-2000)));
  }
  $('done-text').textContent = t('doneText', { n: practised.length, time: humanDuration(seconds) });
  $('done-grid').replaceChildren(
    ...practised.slice(0, 60).map((r) => {
      if (s.source === 'images') {
        const img = Object.assign(document.createElement('img'), { src: state.images[r.ref].url, alt: '' });
        if (r.flip) img.style.transform = 'scaleX(-1)';
        return img;
      }
      return Object.assign(document.createElement('span'), { className: 'prompt-chip', textContent: PROMPTS[s.lang][r.ref] });
    }),
  );
  state.session = null;
  renderStats();
  show('done');
}

$('start').addEventListener('click', start);
$('b-pause').addEventListener('click', togglePause);
$('b-prev').addEventListener('click', () => step(-1));
$('b-next').addEventListener('click', () => step(1));
$('b-stop').addEventListener('click', finish);
$('again').addEventListener('click', start);
$('back').addEventListener('click', () => show('setup'));

document.addEventListener('keydown', (e) => {
  if (!state.session || e.target.matches?.('input, textarea')) return;
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'Escape') finish();
});
document.addEventListener('visibilitychange', () => {
  // Wake locks are dropped when the tab is hidden; take it back when we return mid-session.
  if (document.visibilityState === 'visible' && state.session && $('opt-wake').checked) keepAwake(true);
});

// ---------------- language & start ----------------

function applyLanguage(lang) {
  setLanguage(lang);
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === getLanguage()));
  renderImages();
}
for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => applyLanguage(b.dataset.lang));

applyLanguage(detectLanguage());
selectPreset('warmup');
renderStats();
