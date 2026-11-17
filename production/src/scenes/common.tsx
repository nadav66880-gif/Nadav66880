import React from 'react';
import {Pose, pose, screenRect, W, H, lerpPose, clamp} from '../lib';
import {Card} from '../Stage';
import {Profile, tileScreen} from '../ui/Profile';

/** the phone UI as a plane in 3D: t=0 flat (fills frame), t=1 fallen away into darkness */
export const planePose = (t: number): Pose => lerpPose(screenRect(0, 0, W, H, 0), pose({x: 0, y: 760, z: -2900, rx: 74, w: W, h: H, op: 0}), t);
export const tilePose = (key: string, scroll: number, z = 2): Pose => {
  const r = tileScreen(key, scroll);
  return screenRect(r.x, r.y, r.w, r.h, z);
};
export const UIPlane: React.FC<{t: number; scroll: number; hide?: string[]}> = ({t, scroll, hide}) => {
  const p = planePose(t);
  p.op = clamp(1 - t * 1.15);
  return <Card p={p} radius={t > 0.02 ? 30 * t : 0} shadow={0.5 * t} bg="#fff"><Profile scroll={scroll} hide={hide} /></Card>;
};
/** smooth bump 0..1..0 */
export const bump = (t: number) => Math.sin(Math.PI * clamp(t));
