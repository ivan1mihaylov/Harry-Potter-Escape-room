/* ============================================================
   audio.js — всички звуци се синтезират в WebAudio.
   Без външни файлове, значи няма какво да се счупи офлайн.
   ============================================================ */
import { S } from './state.js';

let ctx = null;
let master = null;
let ambientNodes = [];

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() { ac(); }
export function setEnabled(on) {
  S.sound = on;
  if (master) master.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.05);
  if (on) startAmbient(); else stopAmbient();
}
export function isEnabled() { return S.sound !== false; }

function tone({ freq = 440, dur = 0.3, type = 'sine', vol = 0.3, glide = null, delay = 0, attack = 0.01 }) {
  const c = ac(); if (!c || !isEnabled()) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.4, vol = 0.2, filter = 900, type = 'lowpass', delay = 0, sweep = null }) {
  const c = ac(); if (!c || !isEnabled()) return;
  const t0 = c.currentTime + delay;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const bq = c.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(filter, t0);
  if (sweep) bq.frequency.exponentialRampToValueAtTime(sweep, t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bq); bq.connect(g); g.connect(master);
  src.start(t0);
}

/* ---------- палитра от звуци ---------- */
export const sfx = {
  click:   () => tone({ freq: 620, dur: 0.07, type: 'triangle', vol: 0.14 }),
  hover:   () => tone({ freq: 900, dur: 0.04, type: 'sine', vol: 0.05 }),
  good:    () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, dur: 0.5, type: 'sine', vol: 0.2, delay: i * 0.075 })); },
  bad:     () => { tone({ freq: 160, dur: 0.35, type: 'sawtooth', vol: 0.16, glide: 70 }); noise({ dur: 0.3, vol: 0.1, filter: 400 }); },
  unlock:  () => { [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone({ freq: f, dur: 0.8, type: 'sine', vol: 0.17, delay: i * 0.09 })); noise({ dur: 0.7, vol: 0.07, filter: 200, sweep: 3000 }); },
  spell:   () => { tone({ freq: 180, dur: 0.45, type: 'sawtooth', vol: 0.13, glide: 1400 }); noise({ dur: 0.4, vol: 0.13, filter: 500, sweep: 5000, type: 'bandpass' }); },
  whoosh:  () => noise({ dur: 0.55, vol: 0.16, filter: 250, sweep: 2600, type: 'bandpass' }),
  door:    () => { noise({ dur: 1.5, vol: 0.2, filter: 160, type: 'lowpass' }); tone({ freq: 70, dur: 1.4, type: 'sine', vol: 0.22 }); },
  chime:   () => { [1046.5, 1396.9].forEach((f, i) => tone({ freq: f, dur: 1.1, type: 'sine', vol: 0.12, delay: i * 0.12 })); },
  rune:    () => { [880, 1174.7, 1567.98].forEach((f, i) => tone({ freq: f, dur: 0.9, type: 'triangle', vol: 0.13, delay: i * 0.06 })); },
  tick:    () => tone({ freq: 1500, dur: 0.03, type: 'square', vol: 0.05 }),
  heart:   () => { tone({ freq: 55, dur: 0.18, type: 'sine', vol: 0.3 }); tone({ freq: 48, dur: 0.22, type: 'sine', vol: 0.22, delay: 0.24 }); },
  hiss:    () => noise({ dur: 1.1, vol: 0.09, filter: 3200, type: 'highpass' }),
  page:    () => noise({ dur: 0.28, vol: 0.1, filter: 2600, type: 'highpass' }),
  coin:    () => { [1760, 2093, 2637].forEach((f, i) => tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.08, delay: i * 0.04 })); },
  roar:    () => { tone({ freq: 90, dur: 1.2, type: 'sawtooth', vol: 0.2, glide: 40 }); noise({ dur: 1.1, vol: 0.18, filter: 700, sweep: 120 }); },
  victory: () => {
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5, 1567.98];
    notes.forEach((f, i) => tone({ freq: f, dur: 1.1, type: 'sine', vol: 0.16, delay: i * 0.13 }));
    notes.forEach((f, i) => tone({ freq: f / 2, dur: 1.4, type: 'triangle', vol: 0.09, delay: i * 0.13 }));
  },
};

/* ---------- фонов „шепот на замъка“ ---------- */
export function startAmbient() {
  const c = ac(); if (!c || !isEnabled() || ambientNodes.length) return;
  const g = c.createGain(); g.gain.value = 0.02; g.connect(master);
  // много бавно въртящи се обертонове = хладен, кух замък
  [55, 82.4, 110, 164.8].forEach((f, i) => {
    const o = c.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.03 + i * 0.017;
    const lg = c.createGain(); lg.gain.value = 0.9;
    lfo.connect(lg); lg.connect(o.frequency);
    const og = c.createGain(); og.gain.value = 0.35 / (i + 1);
    o.connect(og); og.connect(g);
    o.start(); lfo.start();
    ambientNodes.push(o, lfo);
  });
  ambientNodes.push(g);
}
export function stopAmbient() {
  ambientNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch (e) {} });
  ambientNodes = [];
}
