export const STRINGS = {
  th: {
    tagline: 'ตัวจับเวลาฝึกวาดท่าทาง (gesture drawing) ใช้รูปอ้างอิงของคุณเอง',
    privacy: 'รูปของคุณเปิดในเครื่องเท่านั้น ไม่ถูกอัปโหลดไปไหน',
    source: '1. เลือกสิ่งที่จะวาด',
    srcImages: 'รูปอ้างอิงของฉัน',
    srcPrompts: 'โจทย์เป็นข้อความ (ไม่ต้องมีรูป)',
    pickFiles: 'เลือกรูป',
    pickFolder: 'เลือกทั้งโฟลเดอร์',
    dropHint: 'หรือลากรูป/โฟลเดอร์มาวางตรงนี้',
    imagesLoaded: 'เลือกแล้ว {n} รูป',
    noImages: 'ยังไม่ได้เลือกรูป',
    promptsInfo: 'สุ่มโจทย์ เช่น "คนก้มผูกเชือกรองเท้า" แล้ววาดจากความจำหรือจินตนาการ',
    schedule: '2. ตั้งเวลา',
    pWarmup: 'วอร์มอัพ',
    pClassic: 'คลาสมาตรฐาน',
    pQuick: 'เร็ว 30 วิ',
    pLong: 'ท่ายาว',
    custom: 'กำหนดเอง เช่น 10x30s, 5x1m, 2x5m',
    badSchedule: 'อ่านรูปแบบเวลาไม่ออก ลองแบบ 10x30s, 5x1m',
    total: 'รวม {n} ภาพ · {time}',
    options: '3. ตัวเลือก',
    optFlip: 'สลับซ้าย-ขวาแบบสุ่ม (ฝึกไม่ให้จำภาพ)',
    optGray: 'ขาวดำ (ฝึกน้ำหนักแสงเงา)',
    optBeep: 'เสียงเตือน 3 วินาทีสุดท้าย',
    optWake: 'ไม่ให้หน้าจอดับระหว่างฝึก',
    start: 'เริ่มฝึก',
    needSource: 'เลือกรูปก่อน หรือเปลี่ยนเป็นโจทย์ข้อความ',

    stats: 'สถิติการฝึก',
    sStreak: 'วันติดกัน',
    sWeek: 'นาทีใน 7 วัน',
    sDrawings: 'ภาพทั้งหมด',
    sDays: 'วันที่ฝึก',
    statsNote: 'เก็บในเบราว์เซอร์นี้เท่านั้น',

    round: 'ภาพที่ {i}/{n}',
    paused: 'หยุดชั่วคราว',
    keys: 'Space หยุด/เล่น · ← ย้อน · → ข้าม · Esc จบ',
    prev: 'ย้อน',
    pause: 'หยุด',
    play: 'เล่น',
    next: 'ข้าม',
    stop: 'จบ',

    doneTitle: 'เก่งมาก! ฝึกเสร็จแล้ว 🎉',
    doneText: 'วาดไป {n} ภาพ ใช้เวลา {time}',
    again: 'ฝึกอีกรอบ',
    back: 'กลับไปตั้งค่า',

    footer: 'QuickPose เป็นซอฟต์แวร์ฟรีและโอเพนซอร์ส (MIT) ส่วนหนึ่งของชุดเครื่องมือศิลปิน ร่วมกับ Inkseal, ArtQueue และอื่นๆ',
  },
  en: {
    tagline: 'A gesture-drawing practice timer using your own reference images',
    privacy: 'Your images open on your device only. Nothing is uploaded.',
    source: '1. What to draw',
    srcImages: 'My reference images',
    srcPrompts: 'Text prompts (no images needed)',
    pickFiles: 'Choose images',
    pickFolder: 'Choose a folder',
    dropHint: 'or drop images / a folder here',
    imagesLoaded: '{n} images selected',
    noImages: 'No images selected yet',
    promptsInfo: 'Random prompts such as "Bending down to tie a shoelace" — draw from memory or imagination.',
    schedule: '2. Timing',
    pWarmup: 'Warm-up',
    pClassic: 'Classic class',
    pQuick: 'Quick 30s',
    pLong: 'Long poses',
    custom: 'Custom, e.g. 10x30s, 5x1m, 2x5m',
    badSchedule: 'Could not read that. Try 10x30s, 5x1m',
    total: '{n} drawings · {time}',
    options: '3. Options',
    optFlip: 'Randomly mirror images (stops you memorising them)',
    optGray: 'Greyscale (practise values)',
    optBeep: 'Beep for the last 3 seconds',
    optWake: 'Keep the screen on while practising',
    start: 'Start',
    needSource: 'Choose images first, or switch to text prompts',

    stats: 'Practice stats',
    sStreak: 'day streak',
    sWeek: 'minutes, last 7 days',
    sDrawings: 'drawings',
    sDays: 'days practised',
    statsNote: 'Stored in this browser only',

    round: 'Drawing {i}/{n}',
    paused: 'Paused',
    keys: 'Space pause · ← back · → skip · Esc finish',
    prev: 'Back',
    pause: 'Pause',
    play: 'Play',
    next: 'Skip',
    stop: 'Finish',

    doneTitle: 'Great work! Session complete 🎉',
    doneText: '{n} drawings in {time}',
    again: 'Practise again',
    back: 'Back to setup',

    footer: 'QuickPose is free, open-source software (MIT). Part of an artist toolkit with Inkseal, ArtQueue and more.',
  },
};

let lang = 'th';

export function detectLanguage() {
  let saved = null;
  try { saved = localStorage.getItem('quickpose.lang'); } catch {}
  if (saved && STRINGS[saved]) return saved;
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'th';
}

export function setLanguage(next) {
  lang = STRINGS[next] ? next : 'th';
  try { localStorage.setItem('quickpose.lang', lang); } catch {}
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
}

export const getLanguage = () => lang;

export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
