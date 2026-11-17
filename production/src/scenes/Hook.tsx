import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {img, prog, easeOut, easeIn, ease, lerp, clamp, rand} from '../lib';
import {HE_FONT} from '../fonts';

export const HOOK_LEN = 96;
// photo area inside p1_04.jpeg (the file has a white mat around it)
const PX = {x: 166, y: 139, w: 917, h: 1285, W: 1229, H: 1536};
const FOCUS = {x: 680, y: 830}; // the ring, in source px

/** "הרגע שלפני": B&W close-up on the ring, slow breathing push-in, shutter, freeze */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const shutter = 66;
  const frozen = f >= shutter;
  const t = frozen ? shutter : f;
  // heartbeat: two soft pulses per ~second
  const beat = (x: number) => Math.exp(-Math.pow(((x % 36) - 4) / 3, 2)) * 0.012 + Math.exp(-Math.pow(((x % 36) - 12) / 4, 2)) * 0.007;
  const push = lerp(1.0, 1.22, prog(t, 0, shutter, ease)) + beat(t);
  const handX = Math.sin(t * 0.13) * 5 + Math.sin(t * 0.31) * 2;
  const handY = Math.cos(t * 0.11) * 5 + Math.cos(t * 0.27) * 2;
  const cover = 1920 / PX.h; // photo height fills the frame
  const baseW = PX.W * cover, baseH = PX.H * cover;
  const fx = (FOCUS.x) * cover, fy = (FOCUS.y) * cover;
  // keep the ring roughly centred, slightly low-left of centre so type has room
  const tx = 540 - fx * push + handX, ty = 900 - fy * push + handY;
  const intro = prog(f, 0, 10, easeOut);
  const flash = frozen ? Math.max(0, 1 - (f - shutter) / 7) : 0;
  const dropIn = frozen ? prog(f, shutter, shutter + 30, easeOut) : 0;
  const exit = prog(f, HOOK_LEN - 8, HOOK_LEN, easeIn);
  // text lines
  const line = (a: number, b: number) => ({o: prog(f, a, a + 12, easeOut) * (1 - prog(f, b, b + 6)), y: (1 - prog(f, a, a + 14, easeOut)) * 26, blur: (1 - prog(f, a, a + 12, easeOut)) * 10});
  const l1 = line(14, 62), l2 = line(30, 62);
  const grainShift = Math.floor(f * 1.7) % 7;
  return (
    <AbsoluteFill style={{background: '#050505', opacity: 1 - exit}}>
      <AbsoluteFill style={{opacity: intro, transform: `scale(${1 - dropIn * 0.04})`}}>
        <Img src={img('posts/p1_04.jpeg')} style={{position: 'absolute', left: 0, top: 0, width: baseW, height: baseH, maxWidth: 'none', transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${push})`, filter: `contrast(1.08) brightness(${0.78 + 0.0 * t})`}} />
        {/* the white mat of the source must never show: vignette + crop covers it */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.72) 100%)'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)'}} />
      </AbsoluteFill>
      <AbsoluteFill dir="rtl" style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1280, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: HE_FONT, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.7)'}}>
        <div style={{fontSize: 78, fontWeight: 800, opacity: l1.o, transform: `translateY(${l1.y}px)`, filter: `blur(${l1.blur}px)`, letterSpacing: -1}}>יש לך שנייה אחת</div>
        <div style={{fontSize: 78, fontWeight: 300, opacity: l2.o, transform: `translateY(${l2.y}px)`, filter: `blur(${l2.blur}px)`}}>לתפוס את הרגע הזה</div>
      </AbsoluteFill>
      {/* shutter: white flash + two quick black bars closing/opening */}
      {frozen && <AbsoluteFill style={{background: '#fff', opacity: flash * 0.9}} />}
      {frozen && f < shutter + 5 && <AbsoluteFill style={{background: '#000', opacity: 0.0}} />}
      <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.22, backgroundImage: `url(${img('grain.png')})`, backgroundSize: '540px', backgroundPosition: `${grainShift * 71}px ${grainShift * 43}px`}} />
    </AbsoluteFill>
  );
};
