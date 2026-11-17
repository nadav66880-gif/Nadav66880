"""Original score + sound design, synthesized from scratch (no samples, no third-party audio).
Writes audio/music.wav and audio/sfx.wav (48 kHz stereo float). Cue frames come from src/timeline.json."""
import json, numpy as np
from pathlib import Path
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
TL = json.loads(Path('src/timeline.json').read_text())
FPS = TL['fps']; DUR = TL['total'] / FPS + 1.2
N = int(DUR * SR)
rng = np.random.default_rng(11)
fr = lambda f: f / FPS                    # frame -> seconds
def buf(): return np.zeros((N, 2))
def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(dst, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
    j = min(N, i + len(sig))
    if i < N and j > max(i, 0): dst[max(i, 0):j] += sig[max(0, -i):j - i] * gain
def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e
def note(m): return 440 * 2 ** ((m - 69) / 12)
def reverb_ir(sec=2.6, decay=3.2, bright=6000):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = np.stack([lp(rng.standard_normal(n), bright) * np.exp(-t * decay) for _ in range(2)], 1)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(0))
def reverb(x, wet=0.3, **k):
    ir = reverb_ir(**k)
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)
    return x * (1 - wet) + y * wet
def saw(f, n, detune=0.0):
    t = np.arange(n) / SR; ph = (f * (1 + detune)) * t + rng.random()
    return 2 * (ph % 1) - 1

BPM = 100; BEAT = 60 / BPM; GRID0 = 12 / FPS          # beat grid aligned with P3 arrivals
beats = lambda a, b: [GRID0 + k * BEAT for k in range(200) if a <= GRID0 + k * BEAT < b]
T_P1, T_P2, T_P3, T_OUT, T_END = fr(TL['p1'] + 6), fr(TL['p2']), fr(TL['p3']), fr(TL['outro']), fr(TL['endCard'] + 6)

# ---------------- MUSIC ----------------
music = buf()
# chord progression Am - F - C - G (2 bars each), voiced low/mid
CH = [[57, 60, 64, 45], [53, 57, 60, 41], [55, 60, 64, 48], [55, 59, 62, 43]]
bar = 4 * BEAT
pad = buf()
t0 = GRID0 - bar
k = 0
while t0 < DUR:
    ch = CH[(k // 2) % 4] if k % 2 == 0 else None
    if ch:
        n = int((2 * bar + 1.5) * SR)
        s = np.zeros(n)
        for m in ch:
            for dt in (-0.004, 0.0, 0.005):
                s += saw(note(m), n, dt) * (0.5 if m < 50 else 0.33)
        s = lp(s, 1100) * env(n, 0.9, 2 * bar + 1.5, 1.2)
        place(pad, s, t0, 0.05, pan=rng.uniform(-0.2, 0.2))
    t0 += bar; k += 1
# pad automation: absent in search, swell in at the first portal, brighter in P3, lingers in outro
tt = np.arange(N) / SR
pa = np.interp(tt, [0, T_P1 - 1.0, T_P1 + 0.3, T_P2, T_P3, T_OUT, T_END, DUR], [0.0, 0.0, 0.85, 0.9, 1.0, 0.9, 1.1, 0.6])
music += pad * pa[:, None]
# plucked arpeggio (Karplus-Strong), 8ths, from start; thins out in P3
def pluck(f, sec=1.4):
    n = int(sec * SR); L = int(SR / f); b = rng.uniform(-1, 1, L); out = np.zeros(n)
    for i in range(n):
        out[i] = b[i % L]; b[i % L] = 0.5 * (b[i % L] + b[(i + 1) % L]) * 0.996
    return lp(out, 5000)
cache = {}
arp_t = [GRID0 - 2 * BEAT + i * BEAT / 2 for i in range(140)]
for i, t in enumerate(arp_t):
    if t < 0.15 or t > T_END + 1.5: continue
    ch = CH[(int((t - (GRID0 - bar)) // (2 * bar))) % 4]
    m = ch[[0, 1, 2, 1, 0, 2, 1, 2][i % 8]] + 12
    if m not in cache: cache[m] = pluck(note(m))
    g = 0.11 if t < T_P1 else 0.08 if t < T_P3 else 0.05
    if T_OUT - 0.2 < t < T_END: g = 0.04
    place(music, cache[m], t, g, pan=0.35 * np.sin(i * 0.9))
# drums
def kick():
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.12 * lp(rng.standard_normal(n), 3000) * np.exp(-t * 80)
def clap():
    n = int(0.35 * SR); x = bp(rng.standard_normal(n), 900, 5000) * np.exp(-np.arange(n) / SR * 18)
    return x
def hat(o=False):
    n = int((0.22 if o else 0.06) * SR); return hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR * (14 if o else 70))
K, C = kick(), clap()
for t in beats(T_P1, T_P2):
    if round((t - GRID0) / BEAT) % 4 == 0: place(music, K, t, 0.32)
for t in beats(T_P2, T_P3):
    place(music, K, t, 0.30 if round((t - GRID0) / BEAT) % 2 == 0 else 0.18)
    place(music, hat(), t + BEAT / 2, 0.05, 0.3)
for t in beats(T_P3, T_OUT - 0.05):
    bi = round((t - GRID0) / BEAT)
    place(music, K, t, 0.42)
    if bi % 2 == 1: place(music, C, t, 0.14, -0.1)
    for q in (0.25, 0.5, 0.75): place(music, hat(q == 0.5), t + q * BEAT, 0.045 if q != 0.5 else 0.05, 0.4 * (q - 0.5))
# bass: 8th pulses from P2, root of chord, filtered saw
for i in range(400):
    t = GRID0 + i * BEAT / 2
    if t < T_P2 or t >= T_OUT: continue
    ch = CH[(int((t - (GRID0 - bar)) // (2 * bar))) % 4]
    n = int(BEAT / 2 * SR * 0.9); s = lp(saw(note(ch[3] - 12 + 12), n), 400 if t < T_P3 else 700) * env(n, 0.005, BEAT / 2, 5)
    place(music, s, t, 0.16 if t < T_P3 else 0.2)
# low drone under the search
n = int((T_P1 + 0.2) * SR); d = lp(saw(note(45), n) + saw(note(52), n, 0.003), 300)
d *= np.minimum(1, np.arange(n) / SR / 1.2) * np.clip((T_P1 - np.arange(n) / SR) / 0.25, 0, 1)
place(music, d, 0, 0.05)
music = reverb(music, wet=0.28, sec=2.8, decay=2.6)

# ---------------- SFX ----------------
sfx = buf()
def tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (hp(rng.standard_normal(n), 2500) * 0.6 + np.sin(2 * np.pi * 1800 * t)) * np.exp(-t * 260)
def tap():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (1300 - 600 * t / 0.08) * t) * np.exp(-t * 90) + 0.3 * hp(rng.standard_normal(n), 3000) * np.exp(-t * 300))
def whoosh(sec=0.6, lo=300, hi=4000, peak=0.6, rise=False):
    n = int(sec * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    e = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2 if not rise else (t / sec) ** 2.2
    # moving band via crossfade of two filtered versions
    a, b = bp(x, lo, lo * 3), bp(x, hi / 3, hi)
    m = np.clip(t / sec, 0, 1)
    return (a * (1 - m) + b * m) * e
def swish(sec=0.45): return whoosh(sec, 500, 9000)
def impact(sec=2.8, f0=52):
    n = int(sec * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(f0 + 40 * np.exp(-t * 9)) / SR) * np.exp(-t * 1.6)
    thump = lp(rng.standard_normal(n), 900) * np.exp(-t * 14)
    return sub * 0.9 + thump * 0.5
def riser(sec=1.2):
    n = int(sec * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (t / sec) ** 2) / SR) * 0.25
    return (whoosh(sec, 400, 8000, rise=True) + tone * (t / sec) ** 2)
def shutter():
    s = np.zeros(int(0.16 * SR))
    for off, g in ((0, 1.0), (0.055, 0.7)):
        n = int(0.03 * SR); t = np.arange(n) / SR
        c = bp(rng.standard_normal(n), 1500, 9000) * np.exp(-t * 180) * g
        i = int(off * SR); s[i:i + n] += c
    return s
def water():
    n = int(0.9 * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 700) * np.sin(np.pi * t / 0.9) ** 2 + 0.5 * np.sin(2 * np.pi * 38 * t) * np.exp(-t * 3)
def shimmer(sec=1.6):
    n = int(sec * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in (88, 93, 95, 100):
        s += np.sin(2 * np.pi * note(m) * t + rng.random() * 6) * np.exp(-t * 2.4) * (1 - np.exp(-t * 30))
    return s * 0.25
# keyboard + taps
for k in range(9): place(sfx, tick(), fr(10 + 4 * k), 0.22, pan=rng.uniform(-0.3, 0.3))
for f in (50, TL['tapA21'], TL['tapB21'], TL['tapB12'], TL['tapMessage']): place(sfx, tap(), fr(f), 0.35)
place(sfx, swish(0.35), fr(TL['profileIn']), 0.18, 0.5)
place(sfx, whoosh(0.7, 200, 2500), fr(72), 0.08)
# portal 1
place(sfx, riser(1.0), fr(TL['p1']) - 0.85, 0.22)
place(sfx, impact(), fr(TL['p1'] + 4), 0.62)
place(sfx, whoosh(1.1, 150, 3500), fr(TL['p1']), 0.3)
st = TL['p1Steps']
for i in range(st['n'] - 1):
    m0 = TL['p1'] + st['start'] + st['hold'] + i * (st['hold'] + st['move'])
    place(sfx, swish(0.5), fr(m0) - 0.05, 0.26, pan=0.5)
    place(sfx, shutter(), fr(m0 + st['move']), 0.13)
place(sfx, whoosh(1.0, 120, 2000), fr(TL['p1'] + 186), 0.22)
place(sfx, whoosh(0.9, 300, 6000, rise=True), fr(TL['p1'] + 210), 0.2)
place(sfx, impact(1.2, 70), fr(TL['p1'] + 240), 0.25)
# whip pan
place(sfx, whoosh(0.5, 400, 9000), fr(TL['whip'][0]), 0.36, -0.3)
# portal 2 + push-throughs into the water
place(sfx, impact(), fr(TL['p2'] + 4), 0.55)
place(sfx, whoosh(1.0, 150, 3500), fr(TL['p2']), 0.28)
st = TL['p2Steps']
for i in range(st['n'] - 1):
    m0 = TL['p2'] + st['start'] + st['hold'] + i * (st['hold'] + st['move'])
    if i < 2:
        place(sfx, water(), fr(m0) - 0.1, 0.4); place(sfx, impact(1.6, 40), fr(m0 + 12), 0.35)
    else:
        place(sfx, swish(0.55), fr(m0), 0.26, pan=0.6 * (-1) ** i)
place(sfx, whoosh(0.9, 300, 6000, rise=True), fr(TL['p2'] + 215), 0.2)
place(sfx, impact(1.2, 70), fr(TL['p2'] + 243), 0.25)
# portal 3: beat-synced carousel
place(sfx, impact(), fr(TL['p3'] + 4), 0.55)
place(sfx, whoosh(0.9, 150, 3500), fr(TL['p3']), 0.26)
st = TL['p3Steps']
for i in range(st['n'] - 1):
    m0 = TL['p3'] + st['start'] + st['hold'] + i * (st['hold'] + st['move'])
    place(sfx, swish(0.45), fr(m0), 0.3, pan=0.5)
place(sfx, riser(0.8), fr(TL['p3'] + 194), 0.25)
place(sfx, whoosh(0.8, 200, 9000), fr(TL['p3'] + 196), 0.34)
# outro
place(sfx, impact(2.2, 46), fr(TL['outro']), 0.45)
for k in range(3): place(sfx, swish(0.4), fr(TL['outro'] + k * 4), 0.15, pan=(k - 1) * 0.6)
place(sfx, whoosh(0.8, 200, 4000), fr(TL['outro'] + 34), 0.2)
place(sfx, shutter(), fr(TL['endCard'] + 4), 0.3)
place(sfx, impact(3.2, 44), fr(TL['endCard'] + 8), 0.6)
place(sfx, shimmer(), fr(TL['endCard'] + 30), 0.25)
sfx = reverb(sfx, wet=0.18, sec=1.6, decay=4)

out = Path('audio'); out.mkdir(exist_ok=True)
for name, x in (('music', music), ('sfx', sfx)):
    wavfile.write(out / f'{name}.wav', SR, x.astype(np.float32))
    print(name, 'peak', np.abs(x).max().round(3))
