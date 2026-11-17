#!/usr/bin/env bash
# Mux video renders with the mixed audio and export all deliverables into ../deliverables
set -euo pipefail
cd "$(dirname "$0")/.."
D=../deliverables; mkdir -p "$D"
A=audio/mix_master.wav
X264="-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -preset slow -crf 11 -maxrate 20M -bufsize 30M -r 30 -fps_mode cfr -g 30 -bf 2"
AAC="-c:a aac -b:a 256k -ar 48000 -ac 2"
# 1. main deliverable (captions burned in)
ffmpeg -v error -y -i out/video_main.mp4 -i $A -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_FINAL_1080x1920.mp4"
# 1b. high-quality master (near-lossless CRF 10) + clean (no captions) master when rendered
ffmpeg -v error -y -i out/video_main.mp4 -i $A -map 0:v -map 1:a -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 10 -r 30 -fps_mode cfr $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_MASTER_HQ_1080x1920.mp4"
[ -f out/video_clean.mp4 ] && ffmpeg -v error -y -i out/video_clean.mp4 -i $A -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_CLEAN_no_captions_1080x1920.mp4"
# 2. cover + 3. captions
cp out/cover.jpg "$D/Nadav_Ohana_Reel_FINAL_Cover.jpg"
python3 scripts/make_srt.py "$D/Nadav_Ohana_Reel_FINAL_Captions.srt"
# 6. 15 s cut and alternative openings (audio assembled from the master mix)
if [ -f out/video_cut15.mp4 ]; then
  ffmpeg -v error -y -i $A -filter_complex "[0:a]atrim=0:$(python3 -c 'print(56/30)'),asetpts=N/SR/TB[a];[0:a]atrim=$(python3 -c 'print(596/30)'),asetpts=N/SR/TB[b];[a][b]acrossfade=d=0.08[o]" -map "[o]" -c:a pcm_s24le out/a_cut15.wav
  ffmpeg -v error -y -i out/video_cut15.mp4 -i out/a_cut15.wav -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_15s_1080x1920.mp4"
fi
if [ -f out/video_altA.mp4 ]; then
  ffmpeg -v error -y -i $A -filter_complex "[0:a]atrim=$(python3 -c 'print(906/30)'):$(python3 -c 'print(906/30+1.5)'),asetpts=N/SR/TB,afade=t=out:st=1.2:d=0.3[a];[0:a]atrim=$(python3 -c 'print(56/30)'),asetpts=N/SR/TB[b];[a][b]acrossfade=d=0.15[o]" -map "[o]" -c:a pcm_s24le out/a_altA.wav
  ffmpeg -v error -y -i out/video_altA.mp4 -i out/a_altA.wav -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Alt_Opening_A_BrandSting.mp4"
fi
if [ -f out/video_altB.mp4 ]; then
  ffmpeg -v error -y -i $A -af "atrim=$(python3 -c 'print(66/30)'),asetpts=N/SR/TB,afade=t=in:d=0.25" -c:a pcm_s24le out/a_altB.wav
  ffmpeg -v error -y -i out/video_altB.mp4 -i out/a_altB.wav -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Alt_Opening_B_ColdOpenGrid.mp4"
fi
cp audio/mix_master.wav "$D/Nadav_Ohana_Reel_Mix_-16LUFS.wav"
echo done
