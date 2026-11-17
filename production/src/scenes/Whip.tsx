import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Profile, tileScreen} from '../ui/Profile';
import {Tap} from '../ui/Phone';
import {TL, lerp, prog, ease, bump} from '../lib';
import {SCROLL_A} from './Opening';
export const SCROLL_B = 2029;
/** global-frame driven 2D profile: whip-scroll A->B and tap on b21 */
export const Whip: React.FC = () => {
  const f = useCurrentFrame() + TL.whip[0];
  const t = prog(f, TL.whip[0], TL.whip[1] - 2, ease);
  const scroll = lerp(SCROLL_A, SCROLL_B, t);
  const b21 = tileScreen('b21', SCROLL_B);
  return (
    <AbsoluteFill>
      <Profile scroll={scroll} vblur={bump(t) * 70} pressed={f >= TL.tapB21 ? 'b21' : undefined} />
      <Tap x={b21.x + b21.w / 2} y={b21.y + b21.h / 2} f={f - TL.tapB21} />
    </AbsoluteFill>
  );
};
export const TapB12: React.FC = () => {
  const f = useCurrentFrame() + TL.p2 + 243;
  const r = tileScreen('b12', SCROLL_B);
  return (
    <AbsoluteFill>
      <Profile scroll={SCROLL_B} pressed={f >= TL.tapB12 ? 'b12' : undefined} />
      <Tap x={r.x + r.w / 2} y={r.y + r.h / 2} f={f - TL.tapB12} />
    </AbsoluteFill>
  );
};
