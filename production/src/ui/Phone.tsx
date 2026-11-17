import React from 'react';
import {Img} from 'remotion';
import {img, S, W, H} from '../lib';
import {UI_FONT} from '../fonts';
import {IconHome, IconReels, IconSend, IconSearch} from './Icons';

/** Logical canvas in recording pixels (512 wide). Scaled to 1080x1920. */
export const Logical: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#fff'}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 512, height: H / S, transform: `scale(${S})`, transformOrigin: '0 0', background: bg, overflow: 'hidden', fontFamily: UI_FONT, color: '#000'}}>
    {children}
  </div>
);

export const StatusBar: React.FC<{time?: string; bg?: string}> = ({time = '19:27', bg = 'transparent'}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 512, height: 78, background: bg, zIndex: 50}}>
    <div style={{position: 'absolute', left: 150, top: 18, width: 220, height: 46, borderRadius: 23, background: '#000'}} />
    <div style={{position: 'absolute', left: 38, top: 31, display: 'flex', alignItems: 'center', gap: 6}}>
      <div style={{background: '#000', color: '#fff', fontSize: 15, fontWeight: 800, borderRadius: 6, padding: '1px 5px', lineHeight: '18px'}}>91</div>
      <svg width="24" height="18" viewBox="0 0 24 18"><path d="M2 6a15 15 0 0 1 20 0M5.5 9.5a10 10 0 0 1 13 0M9 13a5 5 0 0 1 6 0" stroke="#000" strokeWidth="2.6" fill="none" strokeLinecap="round" /><circle cx="12" cy="16" r="1.6" fill="#000" /></svg>
      <svg width="22" height="18" viewBox="0 0 22 18">{[0, 1, 2, 3].map(i => <rect key={i} x={i * 5.5} y={14 - i * 4} width="4" height={4 + i * 4} rx="1" fill={i < 2 ? '#000' : '#9a9a9a'} />)}</svg>
    </div>
    <div style={{position: 'absolute', right: 36, top: 26, display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700, letterSpacing: -0.3}}>
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M21 3 3 10.5l8 2.5 2.5 8z" fill="#000" /></svg>{time}
    </div>
  </div>
);

export const NavPill: React.FC<{y?: number}> = ({y = H / S - 84}) => (
  <div style={{position: 'absolute', left: 64, top: y, width: 384, height: 62, borderRadius: 31, background: 'rgba(250,250,250,0.88)', boxShadow: '0 6px 24px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 12px', zIndex: 40}}>
    <IconHome s={28} /><IconReels s={28} /><IconSend s={28} /><IconSearch s={28} />
    <div style={{width: 64, height: 46, borderRadius: 23, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={img('ui/avatar.png')} style={{width: 30, height: 30, borderRadius: 15}} />
    </div>
  </div>
);

/** soft touch indicator (output px) */
export const Tap: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  if (f < 0 || f > 14) return null;
  const t = f / 14;
  const r = 34 + 40 * t;
  return <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: `rgba(255,255,255,${0.55 * (1 - t)})`, border: `3px solid rgba(255,255,255,${0.9 * (1 - t)})`, boxShadow: `0 0 30px rgba(0,0,0,${0.25 * (1 - t)})`, zIndex: 100}} />;
};
