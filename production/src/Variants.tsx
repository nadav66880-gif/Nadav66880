import React from 'react';
import {AbsoluteFill, Img, Sequence, useCurrentFrame} from 'remotion';
import {TL, img, prog, easeOut, lerp, ease, bump} from './lib';
import {Opening} from './scenes/Opening';
import {Post1} from './scenes/Post1';
import {Post3} from './scenes/Post3';
import {Outro} from './scenes/Outro';
import {SCROLL_B} from './scenes/Whip';
import {Profile, tileScreen} from './ui/Profile';
import {Tap} from './ui/Phone';
import {Env, Grade} from './Stage';
import {Captions, Cap} from './Captions';
import {useFonts} from './Main';

const C = TL.captions as Cap[];
const shift = (c: Cap, d: number, y = c.y): Cap => ({...c, from: c.from + d, to: c.to + d, y});

/* ---------- 15 s cut: search -> profile -> pilates carousel -> brand ---------- */
export const CUT15 = {seg2: 56, p3: 80, outro: 80 + (TL.outro - TL.p3)};
export const CUT15_LEN = CUT15.outro + (TL.total - TL.outro);
export const CUT15_AUDIO_SPLIT = {aEnd: 56, bStart: TL.p3 - 24}; // master frames
const ScrollToB: React.FC = () => {
  const f = useCurrentFrame();
  const t = prog(f, 0, 16, ease);
  const r = tileScreen('b12', SCROLL_B);
  const tapAt = TL.tapB12 - (TL.p3 - 24);
  return (<AbsoluteFill style={{transform: `translateX(${(1 - prog(f, 0, 8, easeOut)) * 300}px)`}}>
    <Profile scroll={lerp(0, SCROLL_B, t)} vblur={bump(t) * 70} pressed={f >= tapAt ? 'b12' : undefined} />
    <Tap x={r.x + r.w / 2} y={r.y + r.h / 2} f={f - tapAt} />
  </AbsoluteFill>);
};
export const Cut15: React.FC = () => {
  useFonts();
  const d = CUT15.p3 - TL.p3;
  return (<AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={CUT15.seg2}><Opening /></Sequence>
    <Sequence from={CUT15.seg2} durationInFrames={CUT15.p3 - CUT15.seg2}><ScrollToB /></Sequence>
    <Sequence from={CUT15.p3} durationInFrames={CUT15.outro - CUT15.p3}><Post3 /></Sequence>
    <Sequence from={CUT15.outro}><Outro /></Sequence>
    <Captions items={[{...C[0], to: 54}, shift(C[3], d), shift(C[4], d), shift(C[5], d)]} />
  </AbsoluteFill>);
};

/* ---------- Alt opening A: brand sting -> profile -> first carousel ---------- */
export const ALT_A = {sting: 45, skip: 56, len: 45 + (TL.p1 + 120 - 56)};
const Sting: React.FC = () => {
  const f = useCurrentFrame();
  const a = prog(f, 4, 22, easeOut), out = prog(f, 34, 45);
  const flash = Math.max(0, 1 - Math.abs(f - 30) / 5);
  return (<AbsoluteFill style={{opacity: 1 - out}}>
    <Env tint="#17140f" />
    <Img src={img('logo_crop.png')} style={{position: 'absolute', left: 190, top: 790, width: 700, opacity: a, transform: `scale(${1.1 - 0.1 * a})`, filter: `blur(${(1 - a) * 8}px)`}} />
    <AbsoluteFill style={{background: '#fff', opacity: flash * 0.45}} />
    <Grade />
  </AbsoluteFill>);
};
export const AltOpeningA: React.FC = () => {
  useFonts();
  const d = ALT_A.sting - ALT_A.skip;
  return (<AbsoluteFill style={{background: '#000'}}>
    <Sequence from={d} durationInFrames={TL.p1}><Opening /></Sequence>
    <Sequence from={TL.p1 + d}><Post1 /></Sequence>
    <Sequence durationInFrames={ALT_A.sting}><Sting /></Sequence>
    <Captions items={[{...C[0], from: 50, to: 100, y: 1500}, shift(C[1], d)]} />
  </AbsoluteFill>);
};
/* ---------- Alt opening B: cold open straight on the real profile grid ---------- */
export const ALT_B = {skip: 66, len: TL.p1 + 120 - 66};
export const AltOpeningB: React.FC = () => {
  useFonts();
  const d = -ALT_B.skip;
  return (<AbsoluteFill style={{background: '#000'}}>
    <Sequence from={d} durationInFrames={TL.p1}><Opening /></Sequence>
    <Sequence from={TL.p1 + d}><Post1 /></Sequence>
    <Captions items={[{...C[0], from: 2, to: 44, y: 1500}, shift(C[1], d)]} />
  </AbsoluteFill>);
};

/* ---------- vertical cover ---------- */
import {SERIF, HE_FONT} from './fonts';
export const Cover: React.FC = () => {
  useFonts();
  return (<AbsoluteFill style={{background: '#000'}}>
    <Post1 at={TL.p1Steps.start + 2 * (TL.p1Steps.hold + TL.p1Steps.move) + 8} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.8) 100%)'}} />
    <Img src={img('logo_crop.png')} style={{position: 'absolute', left: 320, top: 150, width: 440}} />
    <div style={{position: 'absolute', top: 1500, width: '100%', textAlign: 'center', fontFamily: SERIF, fontSize: 64, letterSpacing: 6, color: '#f3ece2'}}>Nadav Ohana Photography</div>
    <div dir="rtl" style={{position: 'absolute', top: 1590, width: '100%', textAlign: 'center', fontFamily: HE_FONT, fontSize: 46, fontWeight: 500, color: '#e9dcc8'}}>רגעים · מקומות · סיפורים</div>
  </AbsoluteFill>);
};
