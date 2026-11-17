import React from 'react';
import {Img} from 'remotion';
import {img, S, H} from '../lib';
import {HE_FONT} from '../fonts';
import {Logical, StatusBar, NavPill} from './Phone';
import {IconBack, IconBell, IconDots, IconGrid, IconReels, IconRepost, IconTagged, IconLink, IconAddPerson, IconThreads} from './Icons';

export const GRID_TOP = 775, ROW = 228;
const COLX = [0, 172, 343];
const ROWS: (string | null)[] = ['a1', 'a2', 'a3', null, null, null, 'b1', 'b2', 'b3'];
const FILLER = ['a3', 'a2', 'a1'];
export const tileLogical = (key: string) => {
  const sec = key[0], r = +key[1] - 1, c = +key[2] - 1;
  const row = sec === 'a' ? r : 6 + r;
  return {x: COLX[c], y: GRID_TOP + row * ROW, w: c === 2 ? 169 : 170, h: 226};
};
/** output-px rect of a grid tile for a given scroll */
export const tileScreen = (key: string, scroll: number) => {
  const t = tileLogical(key);
  return {x: t.x * S, y: (t.y - scroll) * S, w: t.w * S, h: t.h * S};
};

export const Profile: React.FC<{scroll: number; hide?: string[]; dim?: number; focus?: string; vblur?: number; pressed?: string; msgPressed?: number}> = ({scroll, hide = [], dim = 0, focus, vblur = 0, pressed, msgPressed = 0}) => {
  const hl = [['ui/hl_1.png', 'האתר שלי...'], ['ui/hl_2.png', 'My maya...'], ['ui/hl_3.png', 'פורים 202...'], ['ui/hl_4.png', 'Thailand...']];
  return (
    <Logical>
      <svg width="0" height="0" style={{position: 'absolute'}}><filter id="vb" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation={`0 ${vblur}`} /></filter></svg>
      <div style={{position: 'absolute', left: 0, top: -scroll, width: 512, filter: vblur > 0.3 ? 'url(#vb)' : undefined}}>
        {/* top bar */}
        <div style={{position: 'absolute', top: 88, left: 16, display: 'flex', alignItems: 'center', gap: 10}}><IconBack s={30} /><span style={{fontSize: 24, fontWeight: 800, letterSpacing: -0.4}}>nadav_ohana_</span></div>
        <div style={{position: 'absolute', top: 92, right: 18, display: 'flex', gap: 22}}><IconBell s={28} /><IconDots s={28} /></div>
        {/* avatar with real note bubble (cropped from the recording) */}
        <Img src={img('ui/avatar_note.png')} style={{position: 'absolute', left: 10, top: 150, width: 130, height: 150}} />
        <div style={{position: 'absolute', left: 158, top: 174, fontSize: 19.5, fontWeight: 700, letterSpacing: -0.2}}>Nadav ohana photography 📸</div>
        {[['54', 'posts', 158], ['2,615', 'followers', 252], ['815', 'following', 380]].map(([n, l, x]) => (
          <div key={l as string} style={{position: 'absolute', left: x as number, top: 212, lineHeight: '25px'}}><div style={{fontSize: 21, fontWeight: 700}}>{n}</div><div style={{fontSize: 19}}>{l}</div></div>
        ))}
        <div style={{position: 'absolute', left: 21, top: 305, fontSize: 19, color: '#737373'}}>Photographer</div>
        <div dir="rtl" style={{position: 'absolute', left: 21, top: 330, width: 470, fontSize: 19, lineHeight: '25px', fontFamily: HE_FONT, textAlign: 'right'}}>
          📸 צלם משפחות | ילדים | פסטיבלים | הופעות | מסיבות<br />🎉חווית צילום משחררת ואותנטית<br />📍צפון הארץ<span style={{color: '#737373'}}> ...more</span>
        </div>
        <div style={{position: 'absolute', left: 21, top: 438, display: 'flex', alignItems: 'center', gap: 6, color: '#2b3fb0', fontSize: 18.5, fontWeight: 600}}><IconLink s={20} />nadav-ohana-photography.netlify.app/?v...</div>
        <div style={{position: 'absolute', left: 21, top: 478, height: 32, border: '1.5px solid #dbdbdb', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', fontSize: 16, fontWeight: 700}}><IconThreads />nadav_ohana_</div>
        {/* visitor buttons */}
        <div style={{position: 'absolute', left: 20, top: 526, width: 194, height: 40, borderRadius: 10, background: '#4a5df9', color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Follow</div>
        <div style={{position: 'absolute', left: 220, top: 526, width: 194, height: 40, borderRadius: 10, background: msgPressed ? `rgba(200,200,206,${0.6 + 0.4 * msgPressed})` : '#efeff2', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.04 * msgPressed})`}}>Message</div>
        <div style={{position: 'absolute', left: 420, top: 526, width: 72, height: 40, borderRadius: 10, background: '#efeff2', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><IconAddPerson /></div>
        {/* highlights */}
        {hl.map(([src, label], i) => (
          <div key={i} style={{position: 'absolute', left: 59 + i * 104 - 42, top: 588, width: 84, textAlign: 'center'}}>
            <div style={{width: 84, height: 84, borderRadius: 42, border: '2px solid #dbdbdb', padding: 3, boxSizing: 'border-box'}}><Img src={img(src)} style={{width: 74, height: 74, borderRadius: 37}} /></div>
            <div dir="auto" style={{fontSize: 15.5, marginTop: 6, fontFamily: HE_FONT, whiteSpace: 'nowrap'}}>{label}</div>
          </div>
        ))}
        {/* tabs */}
        <div style={{position: 'absolute', left: 0, top: 714, width: 512, height: 58, display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}><IconGrid s={28} /><IconReels s={28} /><IconRepost s={28} /><IconTagged s={28} /></div>
        <div style={{position: 'absolute', left: 23, top: 769, width: 82, height: 2.5, background: '#000'}} />
        {/* grid */}
        {ROWS.map((r, ri) => [0, 1, 2].map(c => {
          const key = r ? `${r}${c + 1}` : `${FILLER[ri - 3]}${c + 1}`;
          const t = {x: COLX[c], y: GRID_TOP + ri * ROW, w: c === 2 ? 169 : 170, h: 226};
          const k = `${r ?? 'f'}${ri}${c}`;
          if (r && hide.includes(key)) return <div key={k} style={{position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, background: '#f2f2f2'}} />;
          const isFocus = focus === key;
          return <Img key={k} src={img(`ui/tile_${key}.jpg`)} style={{position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, objectFit: 'cover', filter: r ? (dim && !isFocus ? `brightness(${1 - 0.55 * dim}) saturate(${1 - 0.5 * dim})` : undefined) : 'blur(14px) brightness(0.9)', transform: pressed === key ? 'scale(0.965)' : undefined}} />;
        }))}
      </div>
      <StatusBar bg="#fff" />
      <NavPill />
    </Logical>
  );
};
