import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Pose, W, H, img, rand} from './lib';

export const PERSP = 2200;
/** perspective stage; plane z=0 maps 1:1 to the frame. cam* = subtle camera drift */
export const Stage: React.FC<{children: React.ReactNode; camRX?: number; camRY?: number; camZ?: number; camX?: number; camY?: number}> = ({children, camRX = 0, camRY = 0, camZ = 0, camX = 0, camY = 0}) => (
  <div style={{position: 'absolute', inset: 0, perspective: `${PERSP}px`, perspectiveOrigin: '50% 50%', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: W / 2, top: H / 2, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translate3d(${-camX}px,${-camY}px,${-camZ}px) rotateX(${camRX}deg) rotateY(${camRY}deg)`}}>
      {children}
    </div>
  </div>
);

let uid = 0;
export const Card: React.FC<{p: Pose; src?: string; children?: React.ReactNode; radius?: number; blur?: number; mbx?: number; mby?: number; sheen?: number; reflect?: boolean; shadow?: number; z?: number; fit?: 'cover' | 'contain'; objPos?: string; backface?: boolean; bg?: string}> = ({p, src, children, radius = 6, blur = 0, mbx = 0, mby = 0, sheen = -1, reflect = false, shadow = 0.55, fit = 'cover', objPos = '50% 50%', backface = false, bg = '#111'}) => {
  if (p.op <= 0.001) return null;
  const id = React.useMemo(() => `mb${uid++}`, []);
  const useMB = Math.abs(mbx) > 0.4 || Math.abs(mby) > 0.4;
  const filters: string[] = [];
  if (useMB) filters.push(`url(#${id})`);
  if (blur > 0.3) filters.push(`blur(${blur.toFixed(2)}px)`);
  return (
    <div style={{position: 'absolute', left: -p.w / 2, top: -p.h / 2, width: p.w, height: p.h, opacity: Math.min(1, p.op),
      transform: `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateY(${p.ry}deg) rotateX(${p.rx}deg) rotateZ(${p.rz}deg)`,
      backfaceVisibility: backface ? 'visible' : 'hidden', filter: filters.length ? filters.join(' ') : undefined,
      WebkitBoxReflect: reflect ? 'below 18px linear-gradient(transparent 62%, rgba(255,255,255,0.20))' : undefined,
      boxShadow: shadow ? `0 ${p.h * 0.05}px ${p.h * 0.12}px rgba(0,0,0,${shadow})` : undefined, borderRadius: radius, background: bg} as React.CSSProperties}>
      {useMB && <svg width="0" height="0" style={{position: 'absolute'}}><filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${Math.abs(mbx).toFixed(1)} ${Math.abs(mby).toFixed(1)}`} /></filter></svg>}
      <div style={{position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden'}}>
        {src && <Img src={src} style={{width: '100%', height: '100%', objectFit: fit, objectPosition: objPos, display: 'block'}} />}
        {children}
        {sheen > -0.5 && sheen < 1.5 && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${(sheen - 0.25) * 100}%, rgba(255,255,255,0.22) ${sheen * 100}%, transparent ${(sheen + 0.25) * 100}%)`, mixBlendMode: 'screen'}} />}
        <div style={{position: 'absolute', inset: 0, borderRadius: radius, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)'}} />
      </div>
    </div>
  );
};

/** dark premium environment with floor glow, dust, vignette */
export const Env: React.FC<{tint?: string; glow?: string; op?: number; drift?: number}> = ({tint = '#121013', glow = 'rgba(255,214,170,0.10)', op = 1, drift = 0}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: op, background: `radial-gradient(120% 75% at 50% 42%, ${tint} 0%, #060607 70%, #020203 100%)`}}>
      <div style={{position: 'absolute', left: -200, right: -200, top: 1150, height: 900, background: `radial-gradient(50% 40% at 50% 30%, ${glow}, transparent 70%)`}} />
      {Array.from({length: 46}).map((_, i) => {
        const x = (rand(i) * W + f * (0.4 + rand(i + 3)) * 0.6 + drift * (0.3 + rand(i + 9))) % W;
        const y = (rand(i + 1) * H - f * (0.6 + rand(i + 5) * 0.9) + H * 4) % H;
        const s = 2 + rand(i + 2) * 5;
        const a = 0.08 + 0.22 * rand(i + 7) * (0.6 + 0.4 * Math.sin(f / 13 + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: `rgba(255,236,210,${a})`, filter: `blur(${rand(i + 4) * 2.5}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

export const Grade: React.FC<{vig?: number}> = ({vig = 0.55}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(130% 90% at 50% 48%, transparent 55%, rgba(0,0,0,${vig}) 100%)`}} />
      <AbsoluteFill style={{backgroundImage: `url(${img('grain.png')})`, backgroundSize: '512px 512px', backgroundPosition: `${Math.floor(rand(f) * 512)}px ${Math.floor(rand(f + 99) * 512)}px`, opacity: 0.05, mixBlendMode: 'overlay'}} />
    </AbsoluteFill>
  );
};
