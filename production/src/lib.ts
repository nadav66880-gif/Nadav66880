import {Easing, staticFile} from 'remotion';
import T from './timeline.json';
export const TL = T;
export const W = 1080, H = 1920, FPS = 30;
export const S = W / 512; // recording px -> output px
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeBack = Easing.bezier(0.34, 1.45, 0.64, 1);
export const prog = (f: number, a: number, b: number, e: (x: number) => number = ease) => e(clamp((f - a) / (b - a)));
export const img = (p: string) => staticFile(p);

/** float index that holds on each card then moves to the next */
export function stepper(f: number, start: number, hold: number, move: number, n: number, e = ease) {
  const t = f - start;
  if (t <= 0) return 0;
  const period = hold + move;
  const k = Math.floor(t / period);
  if (k >= n - 1) return n - 1;
  const r = t - k * period;
  return r < hold ? k : k + e((r - hold) / move);
}

export type Pose = {x: number; y: number; z: number; rx: number; ry: number; rz: number; w: number; h: number; op: number};
export const P0: Pose = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, w: 100, h: 100, op: 1};
export const pose = (p: Partial<Pose>): Pose => ({...P0, ...p});
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), op: lerp(a.op, b.op, t),
});
/** world pose of a rectangle given in output screen px (plane z=0 maps 1:1 to the screen) */
export const screenRect = (x: number, y: number, w: number, h: number, z = 0): Pose =>
  pose({x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, w, h, z});

// deterministic random
export const bump = (t: number) => Math.sin(Math.PI * clamp(t));
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
