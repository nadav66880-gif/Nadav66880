import React from 'react';
import {AbsoluteFill, Img, Sequence, Freeze, useCurrentFrame} from 'remotion';
import V from './timeline_v2.json';
import {img, prog, ease, easeOut, easeIn, lerp, clamp, W, H} from '../lib';
import {Profile, tileScreen} from '../ui/Profile';
import {Env, Grade, Stage, Card} from '../Stage';
import {HE_FONT, UI_FONT} from '../fonts';
import {useFonts} from '../Main';
import {pose} from '../lib';

export const V2 = V;
export const SCROLL_A = 616, SCROLL_B = 2029;
export const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
export const shake = (f: number, at: number, amp: number) => (f < at ? 0 : amp * Math.exp(-(f - at) / 4) * Math.sin((f - at) * 2.3));
export const flashAt = (f: number, at: number, len = 7) => (f < at ? 0 : Math.max(0, 1 - (f - at) / len));
export const tileC = (key: string, scroll: number) => {
  const r = tileScreen(key, scroll);
  return {x: r.x + r.w / 2, y: r.y + r.h / 2, h: r.h, w: r.w};
};

/* ------------------------------------------------------------------ */
/* Profile as a physical screen the camera flies over                  */
/* ------------------------------------------------------------------ */
export type Cam = {cx: number; cy: number; s: number; rx?: number; ry?: number; rz?: number};
export type Ov = {key: string; src: string; op: number; pos?: string; crop?: number[]}; // crop = [x, y, w, h] of the photo area in source px
export const PlaneCam: React.FC<{cam: Cam; prev?: Cam; scroll: number; vblur?: number; overlays?: Ov[]; dim?: number}> = ({cam, prev, scroll, vblur = 0, overlays = [], dim = 0}) => {
  const {cx, cy, s, rx = 0, ry = 0, rz = 0} = cam;
  // zoom motion blur from camera velocity
  const v = prev ? Math.abs(Math.log(s) - Math.log(prev.s)) * 30 + Math.hypot(cx - prev.cx, cy - prev.cy) * s / 160 : 0;
  const mb = clamp(v, 0, 7);
  const radius = clamp((1 - s) * 140, 0, 54);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', overflow: 'hidden', borderRadius: radius / Math.max(s, 0.01),
        transform: `translate(${W / 2}px, ${H / 2}px) perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`,
        boxShadow: s < 0.98 ? '0 80px 200px rgba(0,0,0,0.75), 0 0 0 10px #0b0b0d, 0 0 0 12px #3a3a40' : undefined,
        filter: [mb > 0.4 ? `blur(${mb.toFixed(2)}px)` : '', dim > 0 ? `brightness(${1 - dim}) blur(${(dim * 6).toFixed(1)}px)` : ''].join(' ') || undefined}}>
        <Profile scroll={scroll} vblur={vblur} />
        {overlays.filter(o => o.op > 0.001).map(o => {
          const r = tileScreen(o.key, scroll);
          if (o.crop) {
            const [x, y, cw, ch] = o.crop, k = Math.max(r.w / cw, r.h / ch);
            return (<div key={o.key + o.src} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', opacity: o.op}}>
              <Img src={img(o.src)} style={{position: 'absolute', maxWidth: 'none', width: 'auto', height: 'auto', left: (r.w - cw * k) / 2 - x * k, top: (r.h - ch * k) / 2 - y * k, transform: `scale(${k})`, transformOrigin: '0 0'}} />
            </div>);
          }
          return <Img key={o.key + o.src} src={img(o.src)} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, objectFit: 'cover', objectPosition: o.pos ?? '50% 50%', opacity: o.op}} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

/* full-bleed photo */
export const Full: React.FC<{src: string; pos?: string; s?: number; x?: number; y?: number; rot?: number; blur?: number; filter?: string; op?: number}> = ({src, pos = '50% 50%', s = 1, x = 0, y = 0, rot = 0, blur = 0, filter = '', op = 1}) => (
  <Img src={img(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, opacity: op,
    transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${rot}deg)`, filter: `${blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : ''} ${filter}`.trim() || undefined}} />
);
export const LightLeak: React.FC<{f: number; at: number; dur?: number; color?: string; y?: number}> = ({f, at, dur = 20, color = 'rgba(255,150,60,0.85)', y = 40}) => {
  const t = (f - at) / dur;
  if (t < 0 || t > 1) return null;
  const a = Math.sin(Math.PI * t);
  return <AbsoluteFill style={{mixBlendMode: 'screen', opacity: a * 0.75, background: `radial-gradient(55% 40% at ${lerp(-10, 110, t)}% ${y}%, ${color}, transparent 70%)`}} />;
};
export const Flash: React.FC<{a: number; color?: string}> = ({a, color = '#fff'}) => (a > 0.001 ? <AbsoluteFill style={{background: color, opacity: a}} /> : null);

/* ------------------------------------------------------------------ */
/* 1. HOOK — ring close-up, heartbeat push, shutter, photo revealed    */
/* ------------------------------------------------------------------ */
const RING = {Wd: 1229, Ht: 1536, fx: 680, fy: 830, cx: 624, cy: 781, ph: 1285};
export const HookV2: React.FC = () => {
  const f = useCurrentFrame();
  const sh = V.shutter;
  const beat = (x: number) => Math.exp(-Math.pow(((x % 34) - 3) / 2.5, 2)) * 0.014 + Math.exp(-Math.pow(((x % 34) - 10) / 3.5, 2)) * 0.008;
  const tt = Math.min(f, sh);
  const cover = H / RING.ph;
  // push in until the shutter, then a speed-ramped pull back that reveals the whole print (with its white mat)
  const back = prog(f, sh + 1, sh + 11, ease);
  const push = lerp(lerp(1.0, 1.24, prog(tt, 0, sh, ease)) + beat(tt), 0.52, back);
  const m = back; // anchor moves from the ring to the centre of the print
  const ax = lerp(RING.fx, RING.cx, m), ay = lerp(RING.fy, RING.cy, m);
  const hx = (Math.sin(tt * 0.13) * 5 + Math.sin(tt * 0.31) * 2) * (1 - m), hy = (Math.cos(tt * 0.11) * 5 + Math.cos(tt * 0.27) * 2) * (1 - m);
  const sx = lerp(540, 540, m) + hx, sy = lerp(900, 960, m) + hy;
  const w = RING.Wd * cover * push, h = RING.Ht * cover * push;
  const left = sx - ax * cover * push, top = sy - ay * cover * push;
  // iris close just before the shutter
  const iris = f < sh ? prog(f, sh - 3, sh, easeIn) : 1 - prog(f, sh, sh + 3, easeOut);
  const l1 = 1 - prog(f, sh - 6, sh - 2), l2 = prog(f, 8, 16, easeOut) * (1 - prog(f, sh - 6, sh - 2));
  return (
    <AbsoluteFill style={{background: '#070707'}}>
      <Env tint="#151412" glow="rgba(255,255,255,0.05)" op={back} />
      <Img src={img('posts/p1_04.jpeg')} style={{position: 'absolute', left, top, width: w, height: h, maxWidth: 'none',
        boxShadow: back > 0 ? `0 ${40 * back}px ${120 * back}px rgba(0,0,0,${0.8 * back})` : undefined, filter: `contrast(1.08) brightness(${lerp(0.8, 0.97, back)})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)', opacity: 1 - back}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)', opacity: 1 - back}} />
      <AbsoluteFill dir="rtl" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 1240, fontFamily: HE_FONT, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.8)'}}>
        <div style={{fontSize: 84, fontWeight: 800, letterSpacing: -1, opacity: l1, transform: `scale(${lerp(1.0, 1.04, prog(f, 0, sh, ease))})`}}>יש לך שנייה אחת</div>
        <div style={{fontSize: 80, fontWeight: 300, opacity: l2, transform: `translateY(${(1 - l2) * 24}px)`, filter: `blur(${(1 - l2) * 8}px)`}}>לתפוס את הרגע הזה</div>
      </AbsoluteFill>
      {iris > 0 && <>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: H / 2 * iris, background: '#000'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: H / 2 * iris, background: '#000'}} />
      </>}
      <Flash a={flashAt(f, sh + 2, 8) * 0.95} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 2. REVEAL + PROFILE TOUR + DIVE into post 1                         */
/* ------------------------------------------------------------------ */
const a21 = tileC('a21', SCROLL_A);
const S_TILE = 4.3; // camera scale where a tile fills the frame
const camTour = (f: number): {cam: Cam; scroll: number; vblur: number} => {
  const [r0, r1] = V.reveal, [h0, h1] = V.header, [w0, w1] = V.whipA, [d0, d1] = V.diveA;
  const s0 = 1056 / a21.h; // print size at the end of the hook
  if (f < h0) {
    const t = prog(f, r0, r1 - 8, ease);
    return {cam: {cx: lerp(a21.x, W / 2, t), cy: lerp(a21.y, H / 2, t), s: logLerp(s0, 1, t)}, scroll: SCROLL_A, vblur: 0};
  }
  if (f < w0) {
    const t = prog(f, h0, h0 + 16, ease), z = prog(f, h0 + 4, h1, ease);
    const scroll = lerp(SCROLL_A, 0, t);
    return {cam: {cx: lerp(W / 2, 340, z), cy: lerp(H / 2, 430, z), s: logLerp(1, 1.6, z), rz: -1.5 * z}, scroll, vblur: Math.sin(Math.PI * t) * 60};
  }
  if (f < d0) {
    const t = prog(f, w0, w1, ease);
    return {cam: {cx: lerp(340, W / 2, t), cy: lerp(430, H / 2, t), s: logLerp(1.6, 0.8, t), rx: 12 * Math.sin(Math.PI * t), rz: lerp(-1.5, 0, t)}, scroll: lerp(0, SCROLL_A, t), vblur: Math.sin(Math.PI * t) * 80};
  }
  const t = prog(f, d0, d1, easeIn);
  return {cam: {cx: lerp(W / 2, a21.x, prog(f, d0, d0 + 10, ease)), cy: lerp(H / 2, a21.y, prog(f, d0, d0 + 10, ease)), s: logLerp(0.8, S_TILE * 1.15, t)}, scroll: SCROLL_A, vblur: 0};
};
const Tour: React.FC = () => {
  const f = useCurrentFrame() + V.reveal[0];
  const c = camTour(f), p = camTour(f - 1);
  const ovs: Ov[] = [
    {key: 'a21', src: 'posts/p1_04.jpeg', crop: [166, 139, 917, 1285], op: 1 - prog(f, V.reveal[0] + 4, V.reveal[0] + 20)},
    {key: 'a21', src: 'posts/p1_01.jpeg', op: prog(f, V.diveA[0] + 8, V.diveA[1] - 4)},
  ];
  const ringIn = 1 - prog(f, V.reveal[0], V.reveal[0] + 6);
  return (
    <AbsoluteFill>
      <Env tint="#16130f" glow="rgba(255,214,170,0.12)" drift={f * 2} />
      <PlaneCam cam={c.cam} prev={p.cam} scroll={c.scroll} vblur={c.vblur} overlays={ovs} />
      {/* soft pulse ring on the username during the header zoom */}
      <AbsoluteFill style={{opacity: ringIn * 0}} />
      <Flash a={flashAt(f, V.reveal[0], 6) * 0.5} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 3. STORY 1 — proposal (warm)                                        */
/* ------------------------------------------------------------------ */
const Story1: React.FC = () => {
  const f = useCurrentFrame() + V.s1[0];
  const [a, b, c, d, e] = V.s1;
  let el: React.ReactNode = null;
  if (f < b) {
    const t = prog(f, a, a + 9, easeOut);
    el = <Full src="posts/p1_01.jpeg" s={lerp(1.3, 1.06, t) - 0.04 * prog(f, a + 9, b, ease)} blur={lerp(10, 0, prog(f, a, a + 6))} />;
  } else if (f < c) {
    const t = prog(f, b, b + 10, easeOut);
    el = <><Full src="posts/p1_02.jpeg" s={lerp(1.12, 1.02, prog(f, b, c, easeOut))} rot={lerp(-2, 0, t)} blur={lerp(18, 0, t)} /><LightLeak f={f} at={b - 2} dur={22} /></>;
  } else if (f < d) {
    // print slam onto a warm surface
    const t = prog(f, c, c + 6, easeIn), hit = c + 6;
    const s = lerp(1.9, 1, t) * (1 + 0.035 * prog(f, hit, d, ease));
    const rot = lerp(9, -2.5, t);
    const pw = 860, ph = pw * 1.25;
    el = (
      <AbsoluteFill style={{transform: `translate(${shake(f, hit, 14)}px, ${shake(f, hit, 9) * 0.7}px)`}}>
        <Env tint="#2a1a10" glow="rgba(255,190,120,0.22)" drift={f * 3} />
        <div style={{position: 'absolute', left: 540 - pw / 2 - 20, top: 900 - ph / 2 - 20, width: pw + 40, height: ph + 40, background: '#f6f3ee', padding: 20, boxSizing: 'border-box',
          transform: `scale(${s}) rotate(${rot}deg)`, boxShadow: `0 ${lerp(120, 30, t)}px ${lerp(200, 70, t)}px rgba(0,0,0,${lerp(0.3, 0.75, t)})`}}>
          <Img src={img('posts/p1_03.jpeg')} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </div>
      </AbsoluteFill>
    );
  } else {
    const frz = 268;
    const s = lerp(1.0, 1.09, prog(Math.min(f, frz), d, frz, ease));
    const cap = prog(f, frz, frz + 4, easeOut);
    el = (<>
      <Full src="posts/p1_05.jpeg" pos="50% 62%" s={s * lerp(1, 0.9, cap)} x={lerp(40, 0, prog(f, d, d + 8, easeOut))} blur={lerp(8, 0, prog(f, d, d + 5))} />
      {cap > 0 && <AbsoluteFill style={{boxShadow: `inset 0 0 0 ${lerp(0, 46, cap)}px #f6f3ee`}} />}
      <LightLeak f={f} at={d} dur={26} color="rgba(255,120,40,0.9)" y={20} />
      <Flash a={flashAt(f, frz, 6) * 0.85} />
    </>);
  }
  return <AbsoluteFill style={{background: '#000'}}>{el}<Flash a={flashAt(f, b, 3) * 0.35} /><Flash a={flashAt(f, d, 3) * 0.35} /></AbsoluteFill>;
};

/* ------------------------------------------------------------------ */
/* generic "back into the grid -> move -> dive into the next post"     */
/* ------------------------------------------------------------------ */
const GridHop: React.FC<{start: number; back: number[]; mid: number[]; dive: number[]; fromKey: string; fromScroll: number; toKey: string; toScroll: number; fromSrc: string; toSrc: string; whip?: boolean; tint: string; water?: boolean}> = (p) => {
  const f = useCurrentFrame() + p.start;
  const A = tileC(p.fromKey, p.fromScroll);
  const at = (g: number) => {
    if (g < p.mid[0]) {
      const t = prog(g, p.back[0], p.back[1], easeOut);
      return {cam: {cx: A.x, cy: A.y, s: logLerp(S_TILE * 1.15, p.whip ? 1.0 : 1.3, t)}, scroll: p.fromScroll, vblur: 0};
    }
    if (g < p.dive[0]) {
      const t = prog(g, p.mid[0], p.mid[1], ease);
      const scroll = lerp(p.fromScroll, p.toScroll, t);
      const B = tileC(p.toKey, p.toScroll);
      return {cam: p.whip ? {cx: W / 2, cy: H / 2, s: 1 - 0.08 * Math.sin(Math.PI * t)} : {cx: lerp(A.x, B.x, t), cy: lerp(A.y, B.y, t), s: 1.3}, scroll, vblur: p.whip ? Math.sin(Math.PI * t) * 90 : 0};
    }
    const B = tileC(p.toKey, p.toScroll);
    const t = prog(g, p.dive[0], p.dive[1], easeIn);
    const c0 = p.whip ? {x: W / 2, y: H / 2, s: 1} : {x: B.x, y: B.y, s: 1.3};
    const k = prog(g, p.dive[0], p.dive[0] + 4, ease);
    return {cam: {cx: lerp(c0.x, B.x, k), cy: lerp(c0.y, B.y, k), s: logLerp(c0.s, S_TILE * 1.15, t)}, scroll: p.toScroll, vblur: 0};
  };
  const c = at(f), pr = at(f - 1);
  const ovs: Ov[] = [
    {key: p.fromKey, src: p.fromSrc, op: 1 - prog(f, p.back[0] + 1, p.back[1])},
    {key: p.toKey, src: p.toSrc, op: prog(f, p.dive[0] + 2, p.dive[1] - 1)},
  ];
  return (
    <AbsoluteFill>
      <Env tint={p.tint} drift={f * 4} />
      <PlaneCam cam={c.cam} prev={pr.cam} scroll={c.scroll} vblur={c.vblur} overlays={ovs} />
      {p.water && <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 55%, rgba(180,235,255,0.95), rgba(30,130,210,0.6) 60%, transparent)', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * prog(f, p.dive[0] + 2, p.dive[1] + 6)) * 0.8}} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 4. STORY 2 — "בצל הדקל" (turquoise): fly-through gallery            */
/* ------------------------------------------------------------------ */
const sOf = (f: number, A: number[]) => {
  for (let k = 0; k < A.length - 1; k++) {
    if (f < A[k + 1]) {
      const len = A[k + 1] - A[k], m = Math.min(9, Math.round(len * 0.55));
      return k + ease(clamp((f - (A[k + 1] - m)) / m));
    }
  }
  return A.length - 2;
};
const Story2: React.FC = () => {
  const f = useCurrentFrame() + V.s2[0];
  const A = V.s2.slice(0, 6).concat([V.s2[6] + 40]); // last card holds
  const s = sOf(f, A), sp = sOf(f - 1, A);
  const vel = Math.abs(s - sp);
  const enter = prog(f, V.s2[0], V.s2[0] + 9, easeOut);
  const k0 = Math.floor(s), fr = s - k0;
  const cards = Array.from({length: 6}).map((_, i) => {
    const rel = i - s;
    let z: number, op: number, blur = 0;
    if (rel >= 0) {z = 150 - rel * 1500; op = clamp(2.6 - rel); blur = clamp(rel * 6, 0, 10);}
    else {z = 150 - rel * 2100; op = 1 - clamp(-rel * 2.2); blur = clamp(-rel * 30, 0, 12);}
    if (i === 0) z += (1 - enter) * 1400;
    const side = i % 2 === 0 ? -1 : 1;
    const p = pose({x: side * clamp(rel, 0, 1.2) * 170, y: -190 - clamp(rel, 0, 2) * 30, z, ry: -side * clamp(rel, 0, 1) * 16, w: 1000, h: 667, op});
    return {i, p, blur};
  }).sort((a, b) => a.p.z - b.p.z);
  return (
    <AbsoluteFill style={{background: '#04121a'}}>
      {[k0, Math.min(5, k0 + 1)].map((k, j) => (
        <Full key={j} src={`posts/p2_0${k + 1}.jpeg`} s={1.25} blur={38} op={(j === 0 ? 1 - fr : fr) * 0.55} filter="saturate(1.3) brightness(0.55)" />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 45%, rgba(20,90,110,0.25), rgba(2,10,14,0.85) 100%)'}} />
      <Stage camRX={-2 + Math.cos(f / 40)} camRY={Math.sin(f / 31) * 2.5}>
        {cards.map(c => <Card key={c.i} p={c.p} src={img(`posts/p2_0${c.i + 1}.jpeg`)} blur={c.blur} mbx={vel * 40} reflect={c.p.z > -1600 && c.p.z < 400} radius={4} shadow={0.6} />)}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 50%, rgba(180,235,255,0.9), rgba(30,130,210,0.4) 60%, transparent)', mixBlendMode: 'screen', opacity: (1 - prog(f, V.s2[0], V.s2[0] + 10)) * 0.75}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 5. STORY 3 — pilates (white, sharp, fast)                           */
/* ------------------------------------------------------------------ */
const Story3: React.FC = () => {
  const f = useCurrentFrame() + V.s3[0];
  const A = V.s3;
  let k = 0;
  while (k < 4 && f >= A[k + 1]) k++;
  const t0 = A[k], dir = k % 2 === 0 ? 1 : -1;
  const pt = prog(f, t0, t0 + 5, easeOut);
  const last = k === 4;
  const sat = last ? 1 - prog(f, A[5] - 5, A[5]) : 1;
  const sc = lerp(k === 0 ? 1.6 : 1.16, 1, pt) * (1 + 0.04 * prog(f, t0 + 5, A[k + 1], ease));
  const rgb = f - t0 < 2 && k > 0 ? 'drop-shadow(10px 0 0 rgba(255,0,80,0.55)) drop-shadow(-10px 0 0 rgba(0,210,255,0.55))' : '';
  const src = `posts/p3_0${k + 1}.jpeg`;
  return (
    <AbsoluteFill style={{background: '#eee', filter: sat < 1 ? `grayscale(${1 - sat})` : undefined}}>
      <Full src={src} s={1.3} blur={30} filter="brightness(1.08)" />
      <AbsoluteFill style={{background: 'rgba(255,255,255,0.18)'}} />
      <div style={{position: 'absolute', left: 0, top: 770 - 405, width: 1080, height: 810, transform: `translateX(${dir * (1 - pt) * 90}px) scale(${sc})`, boxShadow: '0 50px 120px rgba(0,0,0,0.35)'}}>
        <Img src={img(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: rgb || undefined}} />
      </div>
      <Flash a={flashAt(f, t0, 3) * (k === 0 ? 0 : 0.5)} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 6. SILENCE -> DROP -> pull back to the whole profile -> CTA -> loop */
/* ------------------------------------------------------------------ */
const b12 = tileC('b12', SCROLL_B);
const camDrop = (f: number) => {
  const d = V.drop;
  const t = prog(f, d, d + 20, easeOut);
  const sc = prog(f, V.logo, V.cta, ease);
  const down = prog(f, V.cta, V.cta + 16, ease);
  const s = logLerp(S_TILE * 1.15, 0.5, t) * lerp(1, 0.9, down);
  const cy = lerp(lerp(b12.y, H / 2, t), H / 2 - 120, prog(f, d + 10, V.cta, ease)) - down * 120;
  return {cam: {cx: lerp(b12.x, W / 2, t), cy, s, rx: 14 * t * (1 - 0.4 * down) + Math.sin(f / 30) * 1.5, ry: -10 * t + Math.sin(f / 23) * 3, rz: 0}, scroll: lerp(SCROLL_B, 0, sc), vblur: Math.sin(Math.PI * sc) * 40};
};
const Finale: React.FC = () => {
  const f = useCurrentFrame() + V.drop;
  const c = camDrop(f), p = camDrop(f - 1);
  const logo = prog(f, V.logo, V.logo + 16, easeOut);
  const down = prog(f, V.cta, V.cta + 16, ease);
  const q1 = prog(f, V.cta + 4, V.cta + 14, easeOut), q2 = prog(f, V.cta + 10, V.cta + 20, easeOut), pill = prog(f, V.cta + 18, V.cta + 28, easeOut);
  const bob = Math.sin((f - V.cta) / 4.5) * 10;
  return (
    <AbsoluteFill>
      <Env tint="#17140f" glow="rgba(255,215,170,0.14)" drift={f * 3} />
      <PlaneCam cam={c.cam} prev={p.cam} scroll={c.scroll} vblur={c.vblur} dim={0.78 * down} overlays={[{key: 'b12', src: 'posts/p3_05.jpeg', op: 1 - prog(f, V.drop, V.drop + 10)}]} />
      <div style={{position: 'absolute', left: 260, top: 210, width: 560, height: 261, opacity: logo, transform: `translateY(${(1 - logo) * -40}px) scale(${lerp(1.15, 1, logo)})`, filter: `blur(${(1 - logo) * 10}px) brightness(0) invert(0.93) sepia(0.25) drop-shadow(0 10px 30px rgba(0,0,0,0.6))`}}>
        <Img src={img('logo_crop.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 760, left: 60, right: 60, textAlign: 'center', fontFamily: HE_FONT, fontWeight: 800, fontSize: 120, letterSpacing: -1.5, color: '#fff', opacity: q1, transform: `translateY(${(1 - q1) * 30}px)`, filter: `blur(${(1 - q1) * 8}px)`, textShadow: '0 6px 40px rgba(0,0,0,0.8)'}}>הסיפור הבא?</div>
      <div dir="rtl" style={{position: 'absolute', top: 920, left: 60, right: 60, textAlign: 'center', fontFamily: HE_FONT, fontWeight: 300, fontSize: 70, color: '#f3ece2', opacity: q2, transform: `translateY(${(1 - q2) * 24}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.8)'}}>יכול להיות שלכם.</div>
      <div dir="rtl" style={{position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: pill, transform: `scale(${lerp(0.85, 1, pill)})`}}>
        <div style={{fontFamily: HE_FONT, fontWeight: 700, fontSize: 60, color: '#141210', background: '#f3e6cf', padding: '20px 56px', borderRadius: 80, boxShadow: '0 16px 50px rgba(0,0,0,0.5)'}}>כנסו לפרופיל</div>
        <div style={{fontFamily: UI_FONT, fontWeight: 600, fontSize: 40, color: '#e6d6bb', letterSpacing: 1}}>@nadav_ohana_</div>
        <svg width="110" height="110" viewBox="0 0 100 100" style={{transform: `translate(${-bob * 0.8}px, ${bob}px)`, marginTop: 6}}>
          <path d="M78 22 L28 72 M28 34 L28 72 L66 72" stroke="#f3e6cf" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <Flash a={flashAt(f, V.drop, 9)} />
    </AbsoluteFill>
  );
};

/* topic titles per post (Heebo) */
const Words: React.FC = () => {
  const f = useCurrentFrame();
  const w = V.words.find(w => f >= w.from && f < w.to);
  if (!w) return null;
  const a = prog(f, w.from, w.from + 9, easeOut), b2 = prog(f, w.from + 7, w.from + 16, easeOut), out = prog(f, w.to - 6, w.to, easeIn);
  const line = prog(f, w.from + 2, w.from + 14, easeOut);
  const vis = 1 - out;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 74%, rgba(0,0,0,0.7) 100%)', opacity: a * vis}} />
      <div dir="rtl" style={{position: 'absolute', top: 1190, right: 90, left: 90, fontFamily: HE_FONT, color: '#fff', textAlign: 'right', opacity: vis, textShadow: '0 6px 40px rgba(0,0,0,0.65)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: a}}>
          <span style={{fontFamily: UI_FONT, fontSize: 34, fontWeight: 600, letterSpacing: 4, color: '#f3e6cf'}}>{w.n}</span>
          <span style={{height: 3, width: 140 * line, background: '#f3e6cf', borderRadius: 2}} />
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 6}}>
          <div style={{fontSize: w.title.length > 14 ? 92 : 104, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.12, transform: `translateY(${(1 - a) * 110}%)`}}>{w.title}</div>
        </div>
        <div style={{fontSize: 54, fontWeight: 300, marginTop: 4, lineHeight: 1.25, opacity: b2, transform: `translateY(${(1 - b2) * 20}px)`, filter: `blur(${(1 - b2) * 6}px)`}}>{w.sub}</div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelV2: React.FC<{loop?: boolean}> = ({loop = true}) => {
  useFonts();
  const f = useCurrentFrame();
  const t12 = V.t12, t23 = V.t23;
  const lp = loop ? prog(f, V.loop[0], V.loop[1] - 1, ease) : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={V.reveal[0]}><HookV2 /></Sequence>
      <Sequence from={V.reveal[0]} durationInFrames={V.s1[0] - V.reveal[0]}><Tour /></Sequence>
      <Sequence from={V.s1[0]} durationInFrames={t12.back[0] - V.s1[0]}><Story1 /></Sequence>
      <Sequence from={t12.back[0]} durationInFrames={V.s2[0] - t12.back[0]}>
        <GridHop start={t12.back[0]} back={t12.back} mid={t12.whip} dive={t12.dive} fromKey="a21" fromScroll={SCROLL_A} toKey="b21" toScroll={SCROLL_B} fromSrc="posts/p1_05.jpeg" toSrc="posts/p2_01.jpeg" whip tint="#0d1418" water />
      </Sequence>
      <Sequence from={V.s2[0]} durationInFrames={t23.back[0] - V.s2[0]}><Story2 /></Sequence>
      <Sequence from={t23.back[0]} durationInFrames={V.s3[0] - t23.back[0]}>
        <GridHop start={t23.back[0]} back={t23.back} mid={t23.pan} dive={t23.dive} fromKey="b21" fromScroll={SCROLL_B} toKey="b12" toScroll={SCROLL_B} fromSrc="posts/p2_06.jpeg" toSrc="posts/p3_01.jpeg" tint="#141414" />
      </Sequence>
      <Sequence from={V.s3[0]} durationInFrames={V.silence[0] + 3 - V.s3[0]}><Story3 /></Sequence>
      <Sequence from={V.drop} durationInFrames={V.total - V.drop}><Finale /></Sequence>
      <Words />
      {lp > 0 && <AbsoluteFill style={{opacity: lp}}><Freeze frame={0}><HookV2 /></Freeze></AbsoluteFill>}
      <Grade vig={0.45} />
    </AbsoluteFill>
  );
};
