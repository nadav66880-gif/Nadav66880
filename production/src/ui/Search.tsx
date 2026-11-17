import React from 'react';
import {Img} from 'remotion';
import {img, H, S, clamp} from '../lib';
import {HE_FONT} from '../fonts';
import {Logical, StatusBar} from './Phone';
import {IconSearch, IconBack} from './Icons';

export const QUERY = 'צלם בצפון';
const ROWS_KB = [['/', "'", 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'], ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'], ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']];
const KB_TOP = H / S - 330;
const keyPos = (ch: string) => {
  for (let r = 0; r < 3; r++) {
    const i = ROWS_KB[r].indexOf(ch);
    if (i >= 0) {const off = r === 2 ? 28 : 4; return {x: off + i * 50.6, y: KB_TOP + 12 + r * 62};}
  }
  return {x: 150, y: KB_TOP + 12 + 3 * 62, space: true};
};
export const ACCOUNT_ROW_Y = 232; // logical
export const Search: React.FC<{typed: number; pressedIdx: number; rowPress?: number; caret: boolean}> = ({typed, pressedIdx, rowPress = 0, caret}) => {
  const q = QUERY.slice(0, typed);
  const acc = clamp((typed - 3) / 2);
  const pressed = pressedIdx >= 0 ? QUERY[pressedIdx] : null;
  const pk = pressed ? keyPos(pressed) : null;
  return (
    <Logical>
      <StatusBar />
      <div style={{position: 'absolute', left: 14, top: 92, width: 400, height: 46, borderRadius: 13, background: '#efeff0', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, boxSizing: 'border-box'}}>
        <IconSearch s={22} c="#737373" />
        <div dir="rtl" style={{flex: 1, fontSize: 21, fontFamily: HE_FONT, textAlign: typed ? 'right' : 'left', color: typed ? '#000' : '#8e8e8e', display: 'flex', justifyContent: typed ? 'flex-start' : 'flex-end', alignItems: 'center'}}>
          {typed ? <span>{q}</span> : <span dir="ltr">Search</span>}
          <span style={{display: 'inline-block', width: 2.5, height: 26, background: '#4a5df9', opacity: caret ? 1 : 0, margin: '0 2px'}} />
        </div>
      </div>
      <div style={{position: 'absolute', right: 16, top: 104, fontSize: 19, fontWeight: 500}}>Cancel</div>
      {typed > 0 && (
        <div style={{position: 'absolute', left: 16, top: 160, width: 480, height: 56, display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 52, height: 52, borderRadius: 26, border: '1.5px solid #dbdbdb', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><IconSearch s={24} /></div>
          <div dir="rtl" style={{fontSize: 20, fontFamily: HE_FONT, fontWeight: 500}}>{q}</div>
        </div>
      )}
      <div style={{position: 'absolute', left: 0, top: ACCOUNT_ROW_Y - 8, width: 512, height: 72, opacity: acc, transform: `translateY(${(1 - acc) * 10}px)`, background: rowPress ? `rgba(0,0,0,${0.07 * rowPress})` : 'transparent'}}>
        <div style={{position: 'absolute', left: 16, top: 8, width: 56, height: 56, borderRadius: 28, background: 'conic-gradient(#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)', padding: 2.5, boxSizing: 'border-box'}}>
          <div style={{width: '100%', height: '100%', borderRadius: '50%', background: '#fff', padding: 2, boxSizing: 'border-box'}}><Img src={img('ui/avatar.png')} style={{width: '100%', height: '100%', borderRadius: '50%'}} /></div>
        </div>
        <div style={{position: 'absolute', left: 86, top: 13, fontSize: 19, fontWeight: 700}}>nadav_ohana_</div>
        <div style={{position: 'absolute', left: 86, top: 38, fontSize: 17, color: '#737373'}}>Nadav ohana photography 📸</div>
      </div>
      {/* keyboard */}
      <div style={{position: 'absolute', left: 0, top: KB_TOP, width: 512, height: 330, background: '#d3d5dc'}}>
        {ROWS_KB.map((row, r) => row.map((k, i) => {
          const off = r === 2 ? 28 : 4;
          const on = pressed === k;
          return <div key={k} style={{position: 'absolute', left: off + i * 50.6, top: 12 + r * 62, width: 45.5, height: 52, borderRadius: 8, background: on ? '#bfc2ca' : '#fff', boxShadow: '0 1.5px 0 #8a8c90', fontFamily: HE_FONT, fontSize: 25, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k}</div>;
        }))}
        <div style={{position: 'absolute', left: 486 - 52, top: 12 + 2 * 62, width: 70, height: 52, borderRadius: 8, background: '#acb0b9', boxShadow: '0 1.5px 0 #8a8c90', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="28" height="22" viewBox="0 0 28 22"><path d="M9 2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9L1 11z" fill="none" stroke="#000" strokeWidth="2" /><path d="m13 7 8 8m0-8-8 8" stroke="#000" strokeWidth="2" /></svg>
        </div>
        <div style={{position: 'absolute', left: 4, top: 198, width: 96, height: 52, borderRadius: 8, background: '#acb0b9', boxShadow: '0 1.5px 0 #8a8c90', fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>123</div>
        <div style={{position: 'absolute', left: 106, top: 198, width: 280, height: 52, borderRadius: 8, background: pressed === ' ' ? '#bfc2ca' : '#fff', boxShadow: '0 1.5px 0 #8a8c90', fontSize: 19, fontFamily: HE_FONT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>רווח</div>
        <div style={{position: 'absolute', left: 392, top: 198, width: 116, height: 52, borderRadius: 8, background: '#4a5df9', color: '#fff', boxShadow: '0 1.5px 0 #8a8c90', fontSize: 19, fontFamily: HE_FONT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>חיפוש</div>
        <div style={{position: 'absolute', left: 186, top: 314, width: 140, height: 5, borderRadius: 3, background: '#000'}} />
      </div>
      {pk && !('space' in pk) && (
        <div style={{position: 'absolute', left: pk.x - 9, top: KB_TOP + pk.y - KB_TOP - 64, width: 64, height: 112, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', fontFamily: HE_FONT, fontSize: 38, display: 'flex', justifyContent: 'center', paddingTop: 10, boxSizing: 'border-box', zIndex: 5}}>{pressed}</div>
      )}
    </Logical>
  );
};
