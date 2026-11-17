#!/usr/bin/env bash
# Real QA checks on a deliverable. usage: scripts/qa.sh file.mp4 > report.txt
f="$1"
echo "== ffprobe"; ffprobe -v error -show_entries format=duration,bit_rate,size:stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames,sample_rate,channels,bit_rate -of default=nw=1 "$f"
echo "== faststart (moov before mdat?)"; python3 - "$f" <<'PY'
import sys,struct
d=open(sys.argv[1],'rb').read(4_000_000); i=0; order=[]
while i+8<=len(d):
    sz,t=struct.unpack('>I4s',d[i:i+8]); order.append(t.decode()); 
    if sz<8: break
    i+=sz
print(order[:5], 'faststart OK' if 'moov' in order and (order.index('moov') < order.index('mdat') if 'mdat' in order else True) else 'NOT faststart')
PY
echo "== full decode errors"; ffmpeg -v error -i "$f" -f null - 2>&1 | head -5; echo "(end of decode errors)"
echo "== frame count / timestamps"; ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f"
echo "== blackdetect (d>=0.10s, pix_th 0.10)"; ffmpeg -v info -i "$f" -vf blackdetect=d=0.1:pix_th=0.10 -an -f null - 2>&1 | grep -o "black_start.*" || echo "no black segments"
echo "== freezedetect (n=0.001, d>=0.5s)"; ffmpeg -v info -i "$f" -vf freezedetect=n=0.001:d=0.5 -an -f null - 2>&1 | grep -oE "freeze_(start|duration|end).*" || echo "no freezes"
echo "== loudness (EBU R128)"; ffmpeg -nostats -i "$f" -vn -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep -E "I:|LRA:|Peak:"
echo "== audio clipping (samples at |x|>=0.999)"; ffmpeg -v error -i "$f" -vn -af astats=metadata=0:reset=0 -f null - 2>&1 | true; ffmpeg -nostats -i "$f" -vn -af astats -f null - 2>&1 | grep -E "Peak level dB|Number of clipped|Max level" | tail -3
