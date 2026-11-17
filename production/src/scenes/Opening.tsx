import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Search, QUERY, ACCOUNT_ROW_Y} from '../ui/Search';
import {Profile, tileScreen} from '../ui/Profile';
import {Tap} from '../ui/Phone';
import {TL, S, W, prog, easeOut, lerp, ease} from '../lib';

export const SCROLL_A = 616;
export const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const typeStart = 10, per = 4;
  const typed = Math.max(0, Math.min(QUERY.length, Math.floor((f - typeStart) / per) + 1));
  const pIdx = f >= typeStart && f < typeStart + QUERY.length * per && (f - typeStart) % per < 3 ? Math.floor((f - typeStart) / per) : -1;
  const tapRow = 50;
  const push = prog(f, TL.profileIn, TL.profileIn + 12, easeOut);
  const scroll = lerp(0, SCROLL_A, prog(f, 70, 106, ease));
  const intro = prog(f, 0, 14, easeOut);
  const a21 = tileScreen('a21', SCROLL_A);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translateX(${-push * W * 0.3}px) scale(${1.05 - 0.05 * intro})`, opacity: intro, filter: push > 0 ? `brightness(${1 - 0.3 * push})` : undefined}}>
        <Search typed={typed} pressedIdx={pIdx} caret={Math.floor(f / 9) % 2 === 0 || pIdx >= 0} rowPress={f >= tapRow && f < tapRow + 8 ? 1 : 0} />
        <Tap x={230 * S} y={(ACCOUNT_ROW_Y + 28) * S} f={f - tapRow} />
      </AbsoluteFill>
      {f >= TL.profileIn && (
        <AbsoluteFill style={{transform: `translateX(${(1 - push) * W}px)`, boxShadow: '-20px 0 60px rgba(0,0,0,0.25)'}}>
          <Profile scroll={scroll} pressed={f >= TL.tapA21 ? 'a21' : undefined} />
          <Tap x={a21.x + a21.w / 2} y={a21.y + a21.h / 2} f={f - TL.tapA21} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
