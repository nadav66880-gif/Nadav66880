/**
 * V3 — "less presentation, more ad". ~16.9 s, built only from the three original posts + the real profile UI.
 * Hook in colour (ring at sunset) -> shutter -> print -> profile tile -> floating phone -> dive into the post
 * -> 01 proposal (full-bleed) -> whip/water -> 02 venue (seamless whip-pans through the rooms)
 * -> 03 business (prints landing on a stack) -> silence -> drop: whole profile + logo -> CTA -> seamless loop.
 */
import React from 'react';
import {AbsoluteFill, Img, Sequence, Freeze, useCurrentFrame} from 'remotion';
import V from './timeline_v3.json';
import {img, prog, ease, easeOut, easeIn, lerp, clamp, W, H} from '../lib';
import {Env, Grade} from '../Stage';
import {HE_FONT, UI_FONT} from '../fonts';
import {useFonts} from '../Main';
import {PlaneCam, Full, LightLeak, Flash, logLerp, shake, flashAt, tileC, Ov, Cam, SCROLL_A, SCROLL_B} from '../v2/ReelV2';

export const V3 = V;
const S_DIVE = 4.9;
const expoInOut = (t: number) => (t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
const ramp = (f: number, a: number, b: number) => expoInOut(clamp((f - a) / (b - a))); // hard speed-ramp

/* directional (horizontal) motion blur for a full-bleed layer */
const useFid = () => 'f' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
const HBlur: React.FC<{amount: number; children: React.ReactNode}> = ({amount, children}) => {
  const id = useFid();
  const on = amount > 0.5;
  return (
    <AbsoluteFill style={{filter: on ? `url(#${id})` : undefined}}>
      {on && <svg width="0" height="0" style={{position: 'absolute'}}><filter id={id} x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${amount.toFixed(1)} 0`} /></filter></svg>}
      {children}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* HOOK — colour ring at sunset, heartbeat push, shutter, becomes a print */
/* ------------------------------------------------------------------ */
const P15 = {w: 1229, h: 1536, rx: 442, ry: 630};
export const HookV3: React.FC = () => {
  const f = useCurrentFrame();
  const sh = V.shutter;
  const tt = Math.min(f, sh);
  const beat = (x: number) => Math.exp(-Math.pow(((x % 24) - 2) / 2, 2)) * 0.022 + Math.exp(-Math.pow(((x % 24) - 8) / 2.5, 2)) * 0.012;
  const cover = H / P15.h;
  const back = ramp(f, sh + 1, sh + 11);
  const push = lerp(lerp(1.05, 1.32, prog(tt, 0, sh, ease)) + beat(tt), 0.52, back);
  const ax = lerp(P15.rx, P15.w / 2, back), ay = lerp(P15.ry, P15.h / 2, back);
  const hx = (Math.sin(tt * 0.17) * 6 + Math.sin(tt * 0.41) * 2) * (1 - back), hy = (Math.cos(tt * 0.13) * 6 + Math.cos(tt * 0.37) * 2) * (1 - back);
  const sx = 540 + hx, sy = lerp(800, 900, back) + hy;
  const k = cover * push, bw = 18 * back / Math.max(push, 0.3);
  const vis = 1 - prog(f, sh - 4, sh);
  const l2 = prog(f, 5, 12, easeOut);
  return (
    <AbsoluteFill style={{background: '#0a0806'}}>
      <Env tint="#2a1a10" glow="rgba(255,190,120,0.18)" op={back} />
      <div style={{position: 'absolute', left: sx - ax * k - bw * k, top: sy - ay * k - bw * k, width: P15.w * k + 2 * bw * k, height: P15.h * k + 2 * bw * k, background: '#f6f3ee', padding: bw * k, boxSizing: 'border-box',
        boxShadow: back > 0 ? `0 ${50 * back}px ${140 * back}px rgba(0,0,0,${0.8 * back})` : undefined, transform: `rotate(${-2.5 * back}deg)`}}>
        <Img src={img('posts/p1_05.jpeg')} style={{width: '100%', height: '100%', display: 'block', filter: `saturate(${1.12 - 0.12 * back}) contrast(1.05)`}} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.72) 100%)', opacity: 1 - back}} />
      <AbsoluteFill dir="rtl" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 1230, fontFamily: HE_FONT, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.8)', opacity: vis}}>
        <div style={{fontSize: 86, fontWeight: 800, letterSpacing: -1.5, transform: `scale(${lerp(1, 1.05, prog(f, 0, sh, ease))})`}}>יש לך שנייה אחת</div>
        <div style={{fontSize: 80, fontWeight: 300, opacity: l2, transform: `translateY(${(1 - l2) * 24}px)`, filter: `blur(${(1 - l2) * 8}px)`}}>לתפוס את הרגע הזה</div>
      </AbsoluteFill>
      <Flash a={flashAt(f, sh, 9) * 0.95} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* print -> tile -> floating phone -> dive into post 1                 */
/* ------------------------------------------------------------------ */
const a21 = tileC('a21', SCROLL_A);
const camA = (f: number): Cam => {
  const [r0, r1] = V.reveal, [d0, d1] = V.diveA;
  const s0 = 1000 / a21.h;
  if (f < d0) {
    const t = ramp(f, r0, r1 + 2);
    return {cx: lerp(a21.x, W / 2, t), cy: lerp(a21.y, H / 2 + 40, t), s: logLerp(s0, 0.62, t), rx: 11 * t, ry: -7 * t, rz: lerp(-2.5, 0, prog(f, r0, r0 + 8))};
  }
  const t = prog(f, d0, d1, easeIn), c = prog(f, d0, d0 + 10, ease);
  return {cx: lerp(W / 2, a21.x, c), cy: lerp(H / 2 + 40, a21.y, c), s: logLerp(0.62, S_DIVE, t), rx: 11 * (1 - c), ry: -7 * (1 - c)};
};
const Reveal: React.FC = () => {
  const f = useCurrentFrame() + V.reveal[0];
  const ovs: Ov[] = [
    {key: 'a21', src: 'posts/p1_05.jpeg', crop: [0, 0, 1229, 1536], op: 1 - prog(f, V.reveal[0] + 3, V.reveal[0] + 14)},
    {key: 'a21', src: 'posts/p1_01.jpeg', op: prog(f, V.diveA[0] + 8, V.diveA[1] - 3)},
  ];
  return (
    <AbsoluteFill>
      <Env tint="#2a1a10" glow="rgba(255,200,140,0.16)" drift={f * 3} />
      <PlaneCam cam={camA(f)} prev={camA(f - 1)} scroll={SCROLL_A} overlays={ovs} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 01 — proposal, full-bleed, warm                                     */
/* ------------------------------------------------------------------ */
const Story1: React.FC = () => {
  const f = useCurrentFrame() + V.s1[0];
  const [a, b, c, d, e] = V.s1;
  const warm = 'sepia(0.08) saturate(1.06)';
  let el: React.ReactNode;
  if (f < b) {
    const t = prog(f, a, a + 8, easeOut);
    el = <Full src="posts/p1_01.jpeg" s={lerp(1.35, 1.06, t) - 0.04 * prog(f, a + 8, b, ease)} blur={lerp(12, 0, prog(f, a, a + 6))} filter={warm} />;
  } else if (f < c) {
    const t = prog(f, b, b + 10, easeOut);
    el = <><Full src="posts/p1_02.jpeg" s={lerp(1.14, 1.02, prog(f, b, c, easeOut))} rot={lerp(-2.5, 0, t)} blur={lerp(20, 0, t)} filter={warm} /><LightLeak f={f} at={b - 2} dur={22} /></>;
  } else if (f < d) {
    const t = prog(f, c, c + 6, easeIn), hit = c + 6;
    const s = lerp(1.9, 1, t) * (1 + 0.04 * prog(f, hit, d, ease));
    const pw = 840, ph = pw * 1.25;
    el = (
      <AbsoluteFill style={{transform: `translate(${shake(f, hit, 16)}px, ${shake(f, hit, 10) * 0.7}px)`}}>
        <Full src="posts/p1_03.jpeg" s={1.3} blur={40} filter="brightness(0.4) saturate(1.2)" />
        <Env tint="#3a2414" glow="rgba(255,190,120,0.25)" drift={f * 3} op={0.55} />
        <div style={{position: 'absolute', left: 540 - pw / 2 - 20, top: 800 - ph / 2 - 20, width: pw + 40, height: ph + 40, background: '#f6f3ee', padding: 20, boxSizing: 'border-box',
          transform: `scale(${s}) rotate(${lerp(9, -2.5, t)}deg)`, boxShadow: `0 ${lerp(120, 30, t)}px ${lerp(200, 70, t)}px rgba(0,0,0,${lerp(0.3, 0.75, t)})`}}>
          <Img src={img('posts/p1_03.jpeg')} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </div>
      </AbsoluteFill>
    );
  } else {
    // B&W ring, slow push, shutter freeze -> white print border
    const frz = V.s1Freeze;
    const s = lerp(1.1, 1.2, prog(Math.min(f, frz), d, frz, ease));
    const cap = prog(f, frz, frz + 4, easeOut);
    el = (<>
      <AbsoluteFill style={{transform: `scale(${lerp(1, 0.9, cap)})`}}>
        {/* p1_04 has a white mat: crop to the photo area */}
        <Img src={img('posts/p1_04.jpeg')} style={{position: 'absolute', maxWidth: 'none', width: 1229 * (H / 1285) * s, height: 1536 * (H / 1285) * s,
          left: 540 - 680 * (H / 1285) * s, top: 960 - 830 * (H / 1285) * s, filter: `blur(${lerp(8, 0, prog(f, d, d + 5)).toFixed(1)}px) contrast(1.08)`}} />
        {cap > 0 && <AbsoluteFill style={{boxShadow: `inset 0 0 0 ${lerp(0, 40, cap)}px #f6f3ee`}} />}
      </AbsoluteFill>
      <Flash a={flashAt(f, frz, 6) * 0.85} />
    </>);
  }
  return <AbsoluteFill style={{background: '#000'}}>{el}<Flash a={flashAt(f, b, 3) * 0.35} /><Flash a={flashAt(f, d, 3) * 0.35} /></AbsoluteFill>;
};

/* ------------------------------------------------------------------ */
/* back into the grid -> move -> dive                                  */
/* ------------------------------------------------------------------ */
const Hop: React.FC<{start: number; back: number[]; mid: number[]; dive: number[]; fromKey: string; fromScroll: number; toKey: string; toScroll: number; fromSrc: string; fromCrop?: number[]; toSrc: string; whip?: boolean; tint: string; water?: boolean}> = (p) => {
  const f = useCurrentFrame() + p.start;
  const A = tileC(p.fromKey, p.fromScroll), B = tileC(p.toKey, p.toScroll);
  const at = (g: number) => {
    if (g < p.mid[0]) return {cam: {cx: A.x, cy: A.y, s: logLerp(S_DIVE, p.whip ? 1.0 : 1.3, prog(g, p.back[0], p.back[1], easeOut))}, scroll: p.fromScroll, vblur: 0};
    if (g < p.dive[0]) {
      const t = prog(g, p.mid[0], p.mid[1], ease);
      return {cam: p.whip ? {cx: W / 2, cy: H / 2, s: 1 - 0.08 * Math.sin(Math.PI * t)} : {cx: lerp(A.x, B.x, t), cy: lerp(A.y, B.y, t), s: 1.3}, scroll: lerp(p.fromScroll, p.toScroll, t), vblur: p.whip ? Math.sin(Math.PI * t) * 90 : 0};
    }
    const c0 = p.whip ? {x: W / 2, y: H / 2, s: 1} : {x: B.x, y: B.y, s: 1.3};
    const k = prog(g, p.dive[0], p.dive[0] + 4, ease);
    return {cam: {cx: lerp(c0.x, B.x, k), cy: lerp(c0.y, B.y, k), s: logLerp(c0.s, S_DIVE, prog(g, p.dive[0], p.dive[1], easeIn))}, scroll: p.toScroll, vblur: 0};
  };
  const c = at(f), pr = at(f - 1);
  const ovs: Ov[] = [
    {key: p.fromKey, src: p.fromSrc, crop: p.fromCrop, op: 1 - prog(f, p.back[0] + 1, p.back[1])},
    {key: p.toKey, src: p.toSrc, op: prog(f, p.dive[0] + 2, p.dive[1] - 1)},
  ];
  return (
    <AbsoluteFill>
      <Env tint={p.tint} drift={f * 4} />
      <PlaneCam cam={c.cam} prev={pr.cam} scroll={c.scroll} vblur={c.vblur} overlays={ovs} />
      {p.water && <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 55%, rgba(180,235,255,0.95), rgba(30,130,210,0.6) 60%, transparent)', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * prog(f, p.dive[0] + 2, p.dive[1] + 6)) * 0.85}} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 02 — venue: one continuous camera move through the rooms (seamless whip-pans) */
/* ------------------------------------------------------------------ */
const PAN_W = H * 1.5, P = (PAN_W - W) / 2;
const panX = (t: number) => P - 2 * P * (0.5 + 4 * Math.pow(t - 0.5, 3)); // fast-slow-fast: velocities match across cuts
const Story2: React.FC = () => {
  const f = useCurrentFrame() + V.s2[0];
  const A = V.s2;
  let k = 0;
  while (k < 5 && f >= A[k + 1]) k++;
  const len = A[k + 1] - A[k];
  const t = clamp((f - A[k]) / len), tp = clamp((f - 1 - A[k]) / len);
  const x = panX(t), v = Math.abs(x - (f - 1 < A[k] ? panX(1) : panX(tp)));
  const enter = prog(f, A[0], A[0] + 8, easeOut);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <HBlur amount={clamp(v * 0.12, 0, 40)}>
        <Img src={img(`posts/p2_0${k + 1}.jpeg`)} style={{position: 'absolute', maxWidth: 'none', top: 0, height: H, width: PAN_W, left: (W - PAN_W) / 2 + x,
          transform: `scale(${lerp(1.25, 1, enter)})`, filter: 'saturate(1.08) contrast(1.03)'}} />
      </HBlur>
      <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 50%, rgba(180,235,255,0.9), rgba(30,130,210,0.4) 60%, transparent)', mixBlendMode: 'screen', opacity: (1 - prog(f, A[0], A[0] + 10)) * 0.8}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 03 — business: prints landing on a stack, on the beat               */
/* ------------------------------------------------------------------ */
const STACK = [{r: -3, x: -18, y: 0}, {r: 2.6, x: 22, y: -14}, {r: -1.6, x: -8, y: 10}, {r: 3.4, x: 14, y: -6}, {r: -0.6, x: 0, y: 4}];
const Story3: React.FC = () => {
  const f = useCurrentFrame() + V.s3[0];
  const A = V.s3;
  const last = A[4];
  const gray = prog(f, A[5] - 4, A[5]);
  const lastHit = A.slice(0, 5).filter(a => f >= a + 5).pop() ?? A[0] + 5;
  const push = 1 + 0.05 * prog(f, last + 5, A[5], ease);
  const pw = 960, ph = 720;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 40%, #f7f4ef 0%, #e8e2d8 70%, #d9d1c4 100%)', filter: gray > 0 ? `grayscale(${gray})` : undefined}}>
      <AbsoluteFill style={{transform: `translate(${shake(f, lastHit, 10)}px, ${shake(f, lastHit, 7) * 0.6}px) scale(${push})`}}>
        {STACK.map((s, i) => {
          if (f < A[i]) return null;
          const t = prog(f, A[i], A[i] + 5, easeIn);
          const cover = A.slice(i + 1, 5).filter(a => f >= a + 5).length; // how many prints landed on top of this one
          return (
            <div key={i} style={{position: 'absolute', left: 540 - pw / 2 - 16 + s.x, top: 720 - ph / 2 - 16 + s.y, width: pw + 32, height: ph + 32, background: '#fbfaf7', padding: 16, boxSizing: 'border-box',
              opacity: lerp(0, 1, prog(f, A[i], A[i] + 2)), transform: `translateY(${(1 - t) * -260}px) scale(${lerp(1.55, 1, t)}) rotate(${lerp(s.r * 4, s.r, t)}deg)`,
              boxShadow: `0 ${lerp(90, 22, t)}px ${lerp(160, 50, t)}px rgba(40,30,20,${lerp(0.15, 0.4, t)})`, filter: cover ? `brightness(${1 - 0.06 * cover})` : undefined}}>
              <Img src={img(`posts/p3_0${i + 1}.jpeg`)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <Flash a={A.slice(1, 5).reduce((m, a) => Math.max(m, flashAt(f, a + 5, 3)), 0) * 0.25} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* DROP -> whole profile + logo -> CTA                                 */
/* ------------------------------------------------------------------ */
const b12 = tileC('b12', SCROLL_B);
const camD = (f: number) => {
  const d = V.drop;
  const t = ramp(f, d, d + 18);
  const sc = prog(f, V.logo + 2, V.cta - 4, ease);
  const out = prog(f, V.cta, V.cta + 14, easeIn);
  const s = logLerp(S_DIVE, 0.56, t);
  const cy = lerp(lerp(b12.y, H / 2, t), H / 2 - 150, prog(f, d + 10, V.logo + 10, ease)) - out * 1500 / s;
  return {cam: {cx: lerp(b12.x, W / 2, t), cy, s, rx: 14 * t + Math.sin(f / 30) * 1.5 + 20 * out, ry: -10 * t + Math.sin(f / 23) * 3, rz: 0} as Cam, scroll: lerp(SCROLL_B, 0, sc), vblur: Math.sin(Math.PI * sc) * 40};
};
const Finale: React.FC = () => {
  const f = useCurrentFrame() + V.drop;
  const c = camD(f), p = camD(f - 1);
  const logo = prog(f, V.logo, V.logo + 16, easeOut);
  const logoUp = prog(f, V.cta, V.cta + 14, ease);
  const q1 = prog(f, V.cta + 8, V.cta + 18, easeOut), q2 = prog(f, V.cta + 14, V.cta + 24, easeOut), pill = prog(f, V.cta + 22, V.cta + 32, easeOut);
  const bob = Math.sin((f - V.cta) / 4.5) * 10;
  const pulse = 1 + 0.035 * Math.max(0, Math.sin((f - V.cta - 32) / 5));
  return (
    <AbsoluteFill>
      <Env tint="#1d1610" glow="rgba(255,215,170,0.16)" drift={f * 3} />
      {f < V.cta + 16 && <PlaneCam cam={c.cam} prev={p.cam} scroll={c.scroll} vblur={c.vblur} overlays={[{key: 'b12', src: 'posts/p3_05.jpeg', op: 1 - prog(f, V.drop, V.drop + 10)}]} />}
      <div style={{position: 'absolute', left: 250, top: lerp(210, 330, logoUp), width: 580, height: 270, opacity: logo, transform: `translateY(${(1 - logo) * -40}px) scale(${lerp(1.15, 1, logo)})`,
        filter: `blur(${(1 - logo) * 10}px) brightness(0) invert(0.93) sepia(0.25) drop-shadow(0 10px 30px rgba(0,0,0,0.6))`}}>
        <Img src={img('logo_crop.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 760, left: 60, right: 60, textAlign: 'center', fontFamily: HE_FONT, fontWeight: 800, fontSize: 124, letterSpacing: -1.5, color: '#fff', opacity: q1, transform: `translateY(${(1 - q1) * 30}px)`, filter: `blur(${(1 - q1) * 8}px)`}}>הסיפור הבא?</div>
      <div dir="rtl" style={{position: 'absolute', top: 920, left: 60, right: 60, textAlign: 'center', fontFamily: HE_FONT, fontWeight: 300, fontSize: 72, color: '#f3ece2', opacity: q2, transform: `translateY(${(1 - q2) * 24}px)`}}>יכול להיות שלכם.</div>
      <div dir="rtl" style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: pill, transform: `scale(${lerp(0.85, 1, pill)})`}}>
        <div style={{fontFamily: HE_FONT, fontWeight: 700, fontSize: 62, color: '#141210', background: '#f3e6cf', padding: '20px 60px', borderRadius: 80, boxShadow: '0 16px 50px rgba(0,0,0,0.5)', transform: `scale(${pulse})`}}>כנסו לפרופיל</div>
        <div style={{fontFamily: UI_FONT, fontWeight: 600, fontSize: 40, color: '#e6d6bb', letterSpacing: 1}}>@nadav_ohana_</div>
        <svg width="110" height="110" viewBox="0 0 100 100" style={{transform: `translate(${-bob * 0.8}px, ${bob}px)`, marginTop: 4}}>
          <path d="M78 22 L28 72 M28 34 L28 72 L66 72" stroke="#f3e6cf" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <Flash a={flashAt(f, V.drop, 9)} />
    </AbsoluteFill>
  );
};

/* topic titles (Heebo), clear of the Reels button column on the right */
const Words: React.FC = () => {
  const f = useCurrentFrame();
  const w = V.words.find(w => f >= w.from && f < w.to) as (typeof V.words[number] & {dark?: boolean}) | undefined;
  if (!w) return null;
  const a = prog(f, w.from, w.from + 9, easeOut), b2 = prog(f, w.from + 7, w.from + 16, easeOut), out = prog(f, w.to - 6, w.to, easeIn);
  const line = prog(f, w.from + 2, w.from + 14, easeOut), vis = 1 - out;
  const ink = w.dark ? '#1b1712' : '#fff', acc = w.dark ? '#8a6a3c' : '#f3e6cf';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {!w.dark && <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 48%, rgba(0,0,0,0.6) 72%, rgba(0,0,0,0.72) 100%)', opacity: a * vis}} />}
      <div dir="rtl" style={{position: 'absolute', top: 1180, right: 165, left: 60, fontFamily: HE_FONT, color: ink, textAlign: 'right', opacity: vis, textShadow: w.dark ? 'none' : '0 6px 40px rgba(0,0,0,0.65)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: a}}>
          <span style={{fontFamily: UI_FONT, fontSize: 34, fontWeight: 600, letterSpacing: 4, color: acc}}>{w.n}</span>
          <span style={{height: 3, width: 140 * line, background: acc, borderRadius: 2}} />
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 6}}>
          <div style={{fontSize: w.title.length > 14 ? 84 : 100, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.12, transform: `translateY(${(1 - a) * 110}%)`, whiteSpace: 'nowrap'}}>{w.title}</div>
        </div>
        <div style={{fontSize: 52, fontWeight: w.dark ? 400 : 300, marginTop: 4, lineHeight: 1.25, opacity: b2, transform: `translateY(${(1 - b2) * 20}px)`, filter: `blur(${(1 - b2) * 6}px)`}}>{w.sub}</div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV3: React.FC<{loop?: boolean}> = ({loop = true}) => {
  useFonts();
  const f = useCurrentFrame();
  const {t12, t23} = V;
  const lp = loop ? prog(f, V.loop[0], V.loop[1] - 1, ease) : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={V.reveal[0]}><HookV3 /></Sequence>
      <Sequence from={V.reveal[0]} durationInFrames={V.s1[0] - V.reveal[0]}><Reveal /></Sequence>
      <Sequence from={V.s1[0]} durationInFrames={t12.back[0] - V.s1[0]}><Story1 /></Sequence>
      <Sequence from={t12.back[0]} durationInFrames={V.s2[0] - t12.back[0]}>
        <Hop start={t12.back[0]} back={t12.back} mid={t12.whip} dive={t12.dive} fromKey="a21" fromScroll={SCROLL_A} toKey="b21" toScroll={SCROLL_B} fromSrc="posts/p1_04.jpeg" fromCrop={[166, 139, 917, 1285]} toSrc="posts/p2_01.jpeg" whip tint="#0d1418" water />
      </Sequence>
      <Sequence from={V.s2[0]} durationInFrames={t23.back[0] - V.s2[0]}><Story2 /></Sequence>
      <Sequence from={t23.back[0]} durationInFrames={V.s3[0] - t23.back[0]}>
        <Hop start={t23.back[0]} back={t23.back} mid={t23.pan} dive={t23.dive} fromKey="b21" fromScroll={SCROLL_B} toKey="b12" toScroll={SCROLL_B} fromSrc="posts/p2_06.jpeg" toSrc="posts/p3_01.jpeg" tint="#141414" />
      </Sequence>
      <Sequence from={V.s3[0]} durationInFrames={V.silence[0] + 3 - V.s3[0]}><Story3 /></Sequence>
      <Sequence from={V.drop} durationInFrames={V.total - V.drop}><Finale /></Sequence>
      <Words />
      {lp > 0 && <AbsoluteFill style={{opacity: lp}}><Freeze frame={0}><HookV3 /></Freeze></AbsoluteFill>}
      <Grade vig={0.42} />
    </AbsoluteFill>
  );
};
