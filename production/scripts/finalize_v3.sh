#!/usr/bin/env bash
# Render V3 at full quality and export deliverables into ../deliverables/v3
set -euo pipefail
cd "$(dirname "$0")/.."
D=../deliverables/v3; mkdir -p "$D" out
npx remotion render src/index.ts ReelV3 out/v3_full.mp4 --codec h264 --crf 12 --muted --log=error
npx remotion still src/index.ts ReelV3 out/v3_cover.jpg --frame=20 --jpeg-quality 95 --log=error
python3 scripts/sfx_v3.py
X264="-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -preset slow -crf 14 -maxrate 18M -bufsize 30M -r 30 -fps_mode cfr -g 30 -bf 2"
AAC="-c:a aac -b:a 256k -ar 48000 -ac 2"
ffmpeg -v error -y -i out/v3_full.mp4 -i audio/v3_sfx_master.wav -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_V3_SFX_1080x1920.mp4"
ffmpeg -v error -y -i out/v3_full.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo -map 0:v -map 1:a $X264 $AAC -shortest -movflags +faststart "$D/Nadav_Ohana_Reel_V3_SILENT_1080x1920.mp4"
cp out/v3_cover.jpg "$D/Nadav_Ohana_Reel_V3_Cover.jpg"
cp audio/v3_sfx_master.wav "$D/Nadav_Ohana_Reel_V3_SFX_only.wav"
echo done
