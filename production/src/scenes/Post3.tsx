import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage, Card, Env, Grade} from '../Stage';
import {TL, img, pose, Pose, lerpPose, prog, stepper, clamp, ease, easeOut, easeIn, lerp, bump} from '../lib';
import {UIPlane, tilePose} from './common';
import {SCROLL_B} from './Whip';

const N = 5, STEP = 40, R = 1350, CW = 900, CH = 675;
const cyl = (i: number, s: number): Pose => {
  const d = i - s, a = (d * STEP * Math.PI) / 180;
  return pose({x: R * Math.sin(a), z: R * Math.cos(a) - R, y: -40, ry: d * STEP, w: CW, h: CH, op: Math.abs(d * STEP) > 105 ? 0 : 1});
};
export const Post3: React.FC = () => {
  const t = useCurrentFrame();
  const st = TL.p3Steps;
  const sAt = (x: number) => stepper(x, st.start, st.hold, st.move, st.n, easeOut) + prog(x, 194, 218, easeIn) * 1.6;
  const s = sAt(t), vel = s - sAt(t - 1);
  const enter = prog(t, 0, 28, ease);
  const planeT = prog(t, 2, 30, ease);
  const out = prog(t, 196, 218, easeIn);
  const tile = tilePose('b12', SCROLL_B);
  const cards = Array.from({length: N}).map((_, i) => {
    let p = cyl(i, s);
    if (i === 0 && t < 28) {p = lerpPose(tile, cyl(0, 0), enter); p.z += 380 * bump(enter); p.ry += 12 * bump(enter);}
    if (i > 0) {const fin = prog(t, 16 + i * 4, 40 + i * 4, easeOut); p = lerpPose({...p, y: p.y + 700, z: p.z - 600, op: 0}, p, fin);}
    p.op *= 1 - out;
    const d = Math.abs(i - s);
    const arrive = st.start + st.hold + (i - 1) * (st.hold + st.move) + st.move;
    return {i, p, blur: t < 28 ? 0 : clamp(d * 5, 0, 9), sheen: (t - arrive) / 18 - 0.2};
  });
  const order = [...cards].sort((a, b) => a.p.z - b.p.z);
  const mb = clamp(Math.abs(vel) * 150, 0, 45);
  // beat pulse on each arrival
  const hit = [76, 112, 148, 184].reduce((m, a) => Math.max(m, t >= a ? Math.exp(-(t - a) / 5) : 0), 0);
  return (
    <AbsoluteFill>
      <Env tint="#141314" glow="rgba(255,225,215,0.11)" drift={s * 90} />
      <Stage camZ={out * 1400 - hit * 40} camRX={-7 + Math.sin(t / 30) * 1.5} camRY={Math.sin(t / 41) * 3} camY={-60}>
        {planeT < 1 && <UIPlane t={planeT} scroll={SCROLL_B} hide={['b12']} />}
        {order.map(c => (
          <Card key={c.i} p={c.p} src={img(`posts/p3_0${c.i + 1}.jpeg`)} blur={c.blur} mbx={mb} sheen={c.sheen} reflect={t > 28} shadow={0.6} />
        ))}
      </Stage>
      <Grade />
    </AbsoluteFill>
  );
};
