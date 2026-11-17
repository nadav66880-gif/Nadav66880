#!/usr/bin/env bash
# render QA stills of ReelV2 at given frames into out/v2/ and build a contact sheet
cd "$(dirname "$0")/.."; mkdir -p out/v2
npx remotion render src/index.ts ReelV2 out/v2/f_%04d.jpg --sequence --frames="$1" --every-nth-frame="${2:-1}" --image-format=jpeg --scale=0.25 --log=error
