import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage, Card, Env, Grade} from '../Stage';
import {TL, img, pose, Pose, lerpPose, prog, stepper, clamp, ease, easeOut, lerp} from '../lib';
import {UIPlane, tilePose, bump} from './common';
import {SCROLL_A} from './Opening';

const N = 5, STEP = 38, R = 1150, RISE = 190, CW = 780, CH = 975;
const helix = (i: number, s: number): Pose => {
  const d = i - s, a = (d * STEP * Math.PI) / 180;
  return pose({x: R * Math.sin(a), z: R * Math.cos(a) - R, y: -d * RISE - 30, ry: d * STEP, w: CW, h: CH, op: Math.abs(d * STEP) > 100 ? 0 : 1});
};
export const Post1: React.FC<{at?: number}> = ({at}) => {
  const cf = useCurrentFrame();
  const t = at ?? cf;
  const st = TL.p1Steps;
  const sAt = (x: number) => stepper(x, st.start, st.hold, st.move, st.n) + prog(x, 186, 214, ease) * 0.35;
  const s = sAt(t), vel = s - sAt(t - 1);
  const enter = prog(t, 0, 40, ease);
  const planeT = Math.max(prog(t, 2, 40, ease) * (1 - prog(t, 212, 240, ease)), 0);
  const pull = prog(t, 186, 214, ease) * (1 - prog(t, 212, 238, ease));
  const collapse = prog(t, 210, 240, ease);
  const tile = tilePose('a21', SCROLL_A);
  const camZ = pull * 1500;
  const cards = Array.from({length: N}).map((_, i) => {
    let p = helix(i, s);
    if (i === 0) {
      const e = lerpPose(tile, helix(0, 0), enter);
      e.z += 420 * bump(enter); e.ry += -10 * bump(enter); e.rx += 6 * bump(enter);
      if (t < 40) p = e;
    } else {
      const fin = prog(t, 30 + i * 4, 56 + i * 4, easeOut);
      const from = {...helix(i, s), z: helix(i, s).z - 900, y: helix(i, s).y + 300, op: 0};
      p = lerpPose(from, p, fin);
    }
    if (collapse > 0) {
      const tp = {...tile, z: 2 + (N - i) * 0.6, op: i === 0 ? 1 : 1 - collapse};
      p = lerpPose({...p, op: Math.max(p.op, i === 0 ? 1 : 0.0001)}, tp, collapse);
      if (i === 0) p.op = 1;
    }
    const d = i - s;
    const focus = clamp(Math.abs(d));
    const blur = collapse > 0 || t < 40 ? 0 : clamp(Math.abs(d) * 4.5, 0, 8) * (1 - pull * 0.8);
    const arrive = st.start + st.hold - st.hold + (i - 1) * (st.hold + st.move) + st.hold + st.move;
    const sheen = i === 0 ? (t - 40) / 22 - 0.2 : (t - arrive) / 22 - 0.2;
    return {i, p, blur, focus, sheen};
  });
  const order = [...cards].sort((a, b) => a.p.z - b.p.z);
  const mb = clamp(Math.abs(vel) * 140, 0, 38);
  return (
    <AbsoluteFill>
      <Env tint="#16110f" glow="rgba(255,205,160,0.13)" drift={s * 60} />
      <Stage camZ={camZ} camRX={-2 + Math.cos(t / 47) * 1.5} camRY={Math.sin(t / 39) * 2.2}>
        {planeT < 1 && t < 245 && <UIPlane t={planeT} scroll={SCROLL_A} hide={['a21']} />}
        {order.map(c => (
          <Card key={c.i} p={c.p} src={img(`posts/p1_0${c.i + 1}.jpeg`)} blur={c.blur} mbx={mb * (1 - collapse)} sheen={c.sheen} reflect={collapse < 0.05 && t > 40} radius={lerp(6, 0, collapse)} shadow={0.6 * (1 - collapse)} />
        ))}
      </Stage>
      <Grade />
    </AbsoluteFill>
  );
};
