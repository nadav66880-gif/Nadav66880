"""Mix music + sfx (+ optional VO) -> audio/mix_master.wav, loudness-normalised to -16 LUFS / -1.5 dBTP.
VO: put recorded/TTS lines as audio/vo/line_01.wav ... line_06.wav (any rate, mono/stereo); each is placed at its
caption start (src/timeline.json) and the music is ducked ~7 dB underneath. Or a full-length audio/vo/full.wav."""
import json, subprocess, numpy as np
from pathlib import Path
from scipy.io import wavfile
from scipy.signal import resample_poly
SR = 48000
TL = json.loads(Path('src/timeline.json').read_text())
N = int(TL['total'] / TL['fps'] * SR)
def load(p):
    sr, x = wavfile.read(p); x = x.astype(np.float64)
    if x.dtype.kind == 'i' or np.abs(x).max() > 2: x /= 32768.0
    if x.ndim == 1: x = np.stack([x, x], 1)
    if sr != SR: x = resample_poly(x, SR, sr, axis=0)
    return x
fit = lambda x: np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]
music, sfx = fit(load('audio/music.wav')), fit(load('audio/sfx.wav'))
vo = np.zeros((N, 2)); vodir = Path('audio/vo')
if (vodir / 'full.wav').exists(): vo = fit(load(vodir / 'full.wav'))
for i, c in enumerate(TL['captions']):
    p = vodir / f'line_{i + 1:02d}.wav'
    if p.exists():
        x = load(p); s = int((c['from'] + 2) / TL['fps'] * SR); e = min(N, s + len(x)); vo[s:e] += x[:e - s]
has_vo = np.abs(vo).max() > 1e-4
if has_vo:
    lvl = np.convolve(np.abs(vo).mean(1), np.ones(4800) / 4800, 'same')
    duck = 1 - 0.55 * np.clip(lvl / (lvl.max() * 0.15), 0, 1)
    duck = np.convolve(duck, np.ones(9600) / 9600, 'same')
    music *= duck[:, None]
mix = music * 0.9 + sfx * 0.8 + vo * 1.0
fade = int(0.35 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
wavfile.write('audio/_premix.wav', SR, mix.astype(np.float32))
# two-pass EBU R128 loudnorm
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'audio/_premix.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/_premix.wav', '-af', af, '-c:a', 'pcm_s24le', 'audio/mix_master.wav'], check=True)
Path('audio/_premix.wav').unlink()
print('VO present:', has_vo)
