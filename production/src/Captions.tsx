import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TL, prog, easeOut} from './lib';
import {HE_FONT} from './fonts';
export type Cap = {text: string; from: number; to: number; y: number};
export const Captions: React.FC<{items?: Cap[]}> = ({items = TL.captions as Cap[]}) => {
  const f = useCurrentFrame();
  const c = items.find(c => f >= c.from && f < c.to);
  if (!c) return null;
  const a = prog(f, c.from, c.from + 6, easeOut) * (1 - prog(f, c.to - 5, c.to));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div dir="rtl" style={{position: 'absolute', left: 90, right: 90, top: (c as any).y - 55, height: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>
        <div style={{fontFamily: HE_FONT, fontWeight: 600, fontSize: 60, color: '#fff', letterSpacing: 0.2, padding: '14px 36px', borderRadius: 60, background: 'rgba(10,10,12,0.42)', textShadow: '0 2px 14px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', boxShadow: '0 10px 40px rgba(0,0,0,0.25)'}}>{c.text}</div>
      </div>
    </AbsoluteFill>
  );
};
