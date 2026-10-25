# QuickPose — gesture-drawing practice timer

**▶ Use it now: https://ronsuthlor3-lab.github.io/quickpose/**

[ภาษาไทย](README.th.md)

Practise gesture drawing like in a life-drawing class: references appear one at a time on a timer.
Use **your own reference images** (a whole folder at once) or **text prompts** when you have none.
Images open on your device only — **nothing is uploaded**. Free, no sign-up.

## Features

- **Class-style timing:** warm-up 10×30s · classic 30s → 1m → 5m → 10m · quick 20×30s · long poses, or type your own, e.g. `10x30s, 5x1m, 2x5m`
- **Smart shuffle:** every reference is used before any repeats, never the same one twice in a row
- **Random mirroring** so you draw what you see, not what you remember, and a **greyscale** mode for values
- **Countdown beeps** for the last 3 seconds and **screen wake lock** while practising
- **Shortcuts:** Space pause/play · ← back · → skip · Esc finish
- **Stats:** day streak, minutes in the last 7 days, total drawings (stored in this browser)
- **32 text prompts** in Thai and English, written for this project

No reference images are bundled, so nobody's copyright is at stake: bring photos you took or that are licensed for practice.

## Development

Static site, vanilla JS modules, no build step. Session planning and stats live in `src/session.js` and are tested
with `npm test` (Node 20+).

## License

MIT. Part of a set of [free tools for artists](https://github.com/ronsuthlor3-lab).
