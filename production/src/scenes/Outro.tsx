import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Stage, Card, Env, Grade} from '../Stage';
import {TL, img, pose, lerpPose, prog, clamp, ease, easeOut, easeIn, lerp} from '../lib';
import {UIPlane, planePose} from './common';
import {Profile} from '../ui/Profile';
import {Tap} from '../ui/Phone';
import {SERIF, UI_FONT, HE_FONT} from '../fonts';
import {S} from '../lib';

const POSTS = [{k: 'p1', n: 5, ar: 1229 / 1536}, {k: 'p2', n: 6, ar: 1.5}, {k: 'p3', n: 5, ar: 4 / 3}];
export const Outro: React.FC = () => {
  const t = useCurrentFrame();
  const g = t + TL.outro;
  const planeBack = 1 - prog(t, 34, 64, ease); // 1 = away, 0 = flat
  const leave = prog(t, 22, 44, easeIn);
  const endIn = prog(g, TL.endCard, TL.endCard + 16, ease);
  const msg = g >= TL.tapMessage ? clamp(1 - (g - TL.tapMessage - 4) / 8) : 0;
  const logo = prog(g, TL.endCard + 6, TL.endCard + 30, easeOut);
  const l1 = prog(g, TL.endCard + 18, TL.endCard + 34, easeOut);
  const l2 = prog(g, TL.endCard + 26, TL.endCard + 42, easeOut);
  const sweep = (g - TL.endCard - 30) / 26;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {endIn < 1 && (
        <AbsoluteFill>
          <Env tint="#131215" drift={t * 3} />
          <Stage camRY={lerp(5, -3, prog(t, 0, 60, ease))} camRX={-3}>
            {t < 66 && <UIPlane t={planeBack} scroll={0} />}
            {POSTS.flatMap((P, k) => Array.from({length: P.n}).map((_, j) => {
              const w = 340, h = w / P.ar, c = (P.n - 1) / 2;
              const home = pose({x: (k - 1) * 360 + (j - c) * 16, y: -60 + (j - c) * -12 + (k === 1 ? 60 : 0), z: -500 - j * 34 + (k === 1 ? 120 : 0), rz: (j - c) * 4.5, ry: (1 - k) * 14, w, h});
              const fin = prog(t, k * 4, 22 + k * 4, easeOut);
              let p = lerpPose({...home, z: home.z - 2600, y: home.y + 300, op: 0}, home, fin);
              p = lerpPose(p, {...p, z: p.z - 1800, y: p.y - 500, op: 0}, leave);
              return <Card key={`${k}${j}`} p={p} src={img(`posts/${P.k}_0${j + 1}.jpeg`)} radius={4} shadow={0.7} blur={j > 0 ? 1.2 : 0} />;
            }))}
          </Stage>
          {t >= 64 && <AbsoluteFill><Profile scroll={0} msgPressed={msg} /><Tap x={317 * S} y={546 * S} f={g - TL.tapMessage} /></AbsoluteFill>}
          <Grade vig={0.45 * (1 - prog(t, 50, 64))} />
        </AbsoluteFill>
      )}
      {endIn > 0 && (
        <AbsoluteFill style={{opacity: endIn}}>
          <Env tint="#17140f" glow="rgba(255,215,170,0.12)" drift={t * 2} />
          <div style={{position: 'absolute', left: 140, top: 520, width: 800, height: 372, opacity: logo, transform: `scale(${1.08 - 0.08 * logo})`, filter: `blur(${(1 - logo) * 10}px)`}}>
            <Img src={img('logo_crop.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            <div style={{position: 'absolute', inset: 0, WebkitMaskImage: `url(${img('logo_crop.png')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', background: `linear-gradient(110deg, transparent ${(sweep - 0.2) * 100}%, rgba(255,220,160,0.95) ${sweep * 100}%, transparent ${(sweep + 0.2) * 100}%)`} as React.CSSProperties} />
          </div>
          <div style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center', fontFamily: SERIF, fontSize: 66, fontWeight: 500, letterSpacing: 6, color: '#f3ece2', opacity: l1, transform: `translateY(${(1 - l1) * 20}px)`}}>Nadav Ohana Photography</div>
          <div style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: UI_FONT, fontSize: 40, fontWeight: 500, letterSpacing: 2, color: '#c9b99f', opacity: l1}}>@nadav_ohana_</div>
          <div dir="rtl" style={{position: 'absolute', top: 1170, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: l2, transform: `translateY(${(1 - l2) * 20}px)`}}>
            <div style={{fontFamily: HE_FONT, fontSize: 50, fontWeight: 500, color: '#fff', padding: '18px 48px', borderRadius: 60, border: '2px solid rgba(255,230,200,0.55)', background: 'rgba(255,255,255,0.06)'}}>לפרטים והזמנות — שלחו הודעה</div>
          </div>
          <Grade />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
