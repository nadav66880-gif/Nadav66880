import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Stage, Card, Env, Grade} from '../Stage';
import {TL, img, pose, Pose, lerpPose, prog, stepper, clamp, ease, easeOut, lerp, bump} from '../lib';
import {UIPlane, tilePose} from './common';
import {SCROLL_B} from './Whip';

const N = 6, CW = 1000, CH = 667;
const SIDE = [0, 0, 0, 1, -1, 1];
const PUSH: Record<number, [number, number]> = {0: [0.42, 0.78], 1: [0.40, 0.60]}; // water anchor (fraction of image)
const corridor = (i: number, s: number): Pose => {
  const rel = i - s, sd = SIDE[i];
  if (rel >= 0) {
    const r2 = Math.min(rel, 2);
    return pose({x: sd * r2 * 430, z: -rel * 1400, ry: -sd * Math.min(rel, 1.4) * 24, y: -60 - rel * 40, w: CW, h: CH, op: clamp(3.2 - rel)});
  }
  const k = -rel;
  if (PUSH[i]) {
    const [ax, ay] = PUSH[i], e = clamp(k * 1.25);
    return pose({x: -(ax - 0.5) * CW * e * 1.0, y: -60 - (ay - 0.5) * CH * e, z: k * 1950, w: CW, h: CH, op: 1 - clamp((k - 0.72) / 0.22)});
  }
  const dn = SIDE[i + 1] ?? 1;
  return pose({x: -dn * k * 1350, z: k * 450, y: -60, ry: dn * k * 38, w: CW, h: CH, op: 1 - clamp((k - 0.45) / 0.5)});
};
export const Post2: React.FC = () => {
  const t = useCurrentFrame();
  const st = TL.p2Steps;
  const sAt = (x: number) => stepper(x, st.start, st.hold, st.move, st.n);
  const s = sAt(t), vel = s - sAt(t - 1);
  const enter = prog(t, 0, 30, ease);
  const planeT = prog(t, 2, 32, ease) * (1 - prog(t, 215, 243, ease));
  const collapse = prog(t, 215, 243, ease);
  const tile = tilePose('b21', SCROLL_B);
  let flash = 0;
  const cards = Array.from({length: N}).map((_, i) => {
    let p = corridor(i, s);
    if (i === 0 && t < 30) {p = lerpPose(tile, corridor(0, 0), enter); p.z += 350 * bump(enter); p.rx += 8 * bump(enter);}
    if (i > 0) {const fin = prog(t, 18 + i * 3, 42 + i * 3, easeOut); p = lerpPose({...p, z: p.z - 1200, op: 0}, p, fin);}
    if (PUSH[i] && s > i) flash = Math.max(flash, bump(((s - i) - 0.55) / 0.45));
    if (collapse > 0) {
      const tp = {...tile, z: 2 + (N - i) * 0.6, op: i === 0 ? 1 : 0};
      p = lerpPose(p, tp, collapse);
      if (i === 0) p.op = Math.max(p.op, collapse);
    }
    const rel = i - s;
    const blur = collapse > 0 || t < 30 ? 0 : rel > 0 ? clamp(rel * 5, 0, 9) : 0;
    const arrive = st.start + i * (st.hold + st.move);
    return {i, p, blur, sheen: (t - arrive + 2) / 20 - 0.2};
  });
  const order = [...cards].sort((a, b) => a.p.z - b.p.z);
  const mb = clamp(Math.abs(vel) * 90, 0, 30);
  const tileFade = i0 => (t < 30 ? 1 - prog(t, 4, 20) : collapse);
  return (
    <AbsoluteFill>
      <Env tint="#0d131a" glow="rgba(140,200,255,0.12)" drift={s * 80} />
      <Stage camRX={-2 + Math.cos(t / 45) * 1.2} camRY={Math.sin(t / 37) * 2}>
        {planeT < 1 && <UIPlane t={planeT} scroll={SCROLL_B} hide={['b21']} />}
        {order.map(c => (
          <Card key={c.i} p={c.p} src={img(`posts/p2_0${c.i + 1}.jpeg`)} blur={c.blur} mbx={mb * (1 - collapse)} mby={PUSH[c.i] && s > c.i ? mb * 0.6 : 0} sheen={c.sheen} reflect={collapse < 0.05 && t > 30 && c.p.z < 400} radius={lerp(6, 0, collapse)} shadow={0.6 * (1 - collapse)}>
            {c.i === 0 && tileFade(0) > 0.01 && <Img src={img('ui/tile_b21.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: tileFade(0)}} />}
          </Card>
        ))}
      </Stage>
      <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 50%, rgba(170,225,255,0.9), rgba(40,120,200,0.5) 60%, transparent)', opacity: flash * 0.55, mixBlendMode: 'screen'}} />
      <Grade />
    </AbsoluteFill>
  );
};
