"""V3 sound design only (no music — the trending sound is added in the Instagram app).
Synthesised from scratch, cues from src/v3/timeline_v3.json. Writes audio/v3_sfx_master.wav (-16 LUFS, -1.5 dBTP)."""
import json, subprocess, numpy as np
from pathlib import Path
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
V = json.loads(Path('src/v3/timeline_v3.json').read_text())
FPS = V['fps']; N = int(V['total'] / FPS * SR)
rng = np.random.default_rng(7)
fr = lambda f: f / FPS
def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
out = np.zeros((N, 2))
def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    s = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2)
    j = min(N, i + len(s))
    if i < N and j > max(i, 0): out[max(i, 0):j] += s[max(0, -i):j - i] * gain
T = lambda sec: np.arange(int(sec * SR)) / SR

def heartbeat():
    t = T(0.25); return np.sin(2 * np.pi * np.cumsum(55 + 30 * np.exp(-t * 30)) / SR) * np.exp(-t * 16)
def shutter():
    s = np.zeros(int(0.2 * SR))
    for off, g in ((0, 1.0), (0.06, 0.75)):
        t = T(0.035); c = bp(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 170) * g
        c += np.sin(2 * np.pi * 900 * t) * np.exp(-t * 300) * 0.3 * g
        i = int(off * SR); s[i:i + len(t)] += c
    return s
def whoosh(sec=0.5, lo=300, hi=6000, rise=False):
    t = T(sec); x = rng.standard_normal(len(t))
    e = (t / sec) ** 2.2 if rise else np.sin(np.pi * t / sec) ** 2
    m = t / sec
    return (bp(x, lo, lo * 3) * (1 - m) + bp(x, hi / 3, hi) * m) * e
def impact(sec=2.2, f0=48):
    t = T(sec)
    return np.sin(2 * np.pi * np.cumsum(f0 + 50 * np.exp(-t * 9)) / SR) * np.exp(-t * 1.8) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 14) * 0.5
def hit():
    t = T(0.3); return np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t * 40)) / SR) * np.exp(-t * 12) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 60) * 0.25
def thud():
    t = T(0.5); return lp(rng.standard_normal(len(t)), 400) * np.exp(-t * 18) + np.sin(2 * np.pi * 60 * t) * np.exp(-t * 10) * 0.6
def water():
    t = T(0.9); return lp(rng.standard_normal(len(t)), 700) * np.sin(np.pi * t / 0.9) ** 2 + 0.5 * np.sin(2 * np.pi * 38 * t) * np.exp(-t * 3)
def riser(sec):
    t = T(sec); return whoosh(sec, 400, 9000, rise=True) + np.sin(2 * np.pi * np.cumsum(200 + 1600 * (t / sec) ** 2) / SR) * 0.2 * (t / sec) ** 2
def shimmer(sec=1.8):
    t = T(sec); s = sum(np.sin(2 * np.pi * 440 * 2 ** ((m - 69) / 12) * t + rng.random() * 6) for m in (88, 93, 95, 100))
    return s * np.exp(-t * 2.2) * (1 - np.exp(-t * 30)) * 0.25
def tick():
    t = T(0.03); return (hp(rng.standard_normal(len(t)), 2500) * 0.6 + np.sin(2 * np.pi * 1800 * t)) * np.exp(-t * 260)

# hook: heartbeat matching the visual pulse (period 34 frames, beats at +3 and +10)
for k in range(2):
    place(heartbeat(), fr(2 + 24 * k), 0.6); place(heartbeat(), fr(8 + 24 * k), 0.38)
place(riser(0.9), fr(V['shutter']) - 0.9, 0.12)
place(shutter(), fr(V['shutter'] + 1), 0.7)
place(whoosh(0.5, 200, 3000), fr(V['shutter'] + 2), 0.25)
# reveal + tour
place(whoosh(0.8, 150, 2500), fr(V['reveal'][0]), 0.3)
place(whoosh(0.5, 300, 6000), fr(V['reveal'][1] - 6), 0.22, 0.3)
place(riser(0.75), fr(V['diveA'][1]) - 0.75, 0.3)
place(impact(), fr(V['s1'][0]), 0.6)
# story 1
s1 = V['s1']
place(whoosh(0.4, 500, 9000), fr(s1[1]) - 0.08, 0.25, 0.4)
place(thud(), fr(s1[2] + 6), 0.7)
place(whoosh(0.4, 500, 9000), fr(s1[3]) - 0.08, 0.25, -0.4)
place(shutter(), fr(V['s1Freeze']), 0.55)
# hop to post 2 (whip + water)
t12 = V['t12']
place(whoosh(0.3, 200, 4000), fr(t12['back'][0]), 0.3)
place(whoosh(0.4, 500, 10000), fr(t12['whip'][0]), 0.4, -0.3)
place(water(), fr(t12['dive'][0]), 0.5)
place(impact(1.6, 40), fr(V['s2'][0]), 0.45)
for k, f in enumerate(V['s2'][1:6]):
    place(whoosh(0.35, 400, 8000), fr(f) - 0.2, 0.22 + 0.03 * k, 0.5 * (-1) ** k)
# hop to post 3
t23 = V['t23']
place(whoosh(0.3, 200, 4000), fr(t23['back'][0]), 0.3)
place(whoosh(0.25, 600, 9000), fr(t23['pan'][0]), 0.25, 0.4)
place(riser(0.3), fr(t23['dive'][0]), 0.25)
place(impact(1.4, 55), fr(V['s3'][0]), 0.5)
for f in V['s3'][1:5]: place(hit(), fr(f), 0.6)
# silence: everything stops, a single click, then the drop
place(riser(1.0), fr(V['s3'][4]) - 0.3, 0.3)
place(tick(), fr(V['silence'][0] + 5), 0.3)
place(impact(2.8, 42), fr(V['drop']), 0.9)
place(whoosh(1.0, 120, 3000), fr(V['drop']), 0.4)
place(shimmer(), fr(V['logo']), 0.5)
place(whoosh(0.5, 300, 6000), fr(V['cta']), 0.2)
place(hit(), fr(V['cta'] + 18), 0.35)
# hard silence window (cut any tails)
a, b = int(fr(V['silence'][0] + 2) * SR), int(fr(V['drop']) * SR)
tail = out[a:b].copy(); tail[:, :] = 0; tail[int(fr(3) * SR):int(fr(3) * SR) + int(0.03 * SR)] = out[a + int(fr(3) * SR):a + int(fr(3) * SR) + int(0.03 * SR)]
out[a:b] = tail
fade = int(0.2 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
Path('audio').mkdir(exist_ok=True)
wavfile.write('audio/_v3pre.wav', SR, out.astype(np.float32))
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'audio/_v3pre.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/_v3pre.wav', '-af', af, '-c:a', 'pcm_s24le', 'audio/v3_sfx_master.wav'], check=True)
Path('audio/_v3pre.wav').unlink()
print('ok', m['input_i'])
