# Nadav Ohana Photography — 3D Instagram Reel (editable Remotion project)

A 1080×1920 / 30 fps CFR reel built from scratch in **Remotion 4.0.544** with real CSS-3D perspective
(cards in a 3D world: helix, Z-corridor with push-through portals, cylinder carousel), depth-of-field,
velocity motion blur, floor reflections, film grain, original synthesized score and SFX.

## Structure
```
src/timeline.json      every cue frame: scenes, taps, carousel steps, captions (single source of truth for video, audio and SRT)
src/lib.ts             easing, stepper, 3D pose math
src/Stage.tsx          perspective stage, Card (DOF / motion blur / sheen / reflection), environment, grade
src/ui/*               Instagram UI rebuilt from the user's real screen recording (search, keyboard, profile, grid)
src/scenes/*           Opening, Post1 (helix), Whip, Post2 (corridor + water push-through), Post3 (beat cylinder), Outro
src/Variants.tsx       15 s cut, alternative openings A/B, cover
public/posts/          original photos, byte-identical copies (see ASSIGNMENT.json: slot -> source file + SHA-256)
public/ui/             tiles / avatar / highlights cropped from the real recording (scripts/prep_assets.py)
scripts/audio.py       original music + SFX synthesis (no samples)  -> audio/music.wav, audio/sfx.wav
scripts/mix.py         mix (+ optional VO with auto ducking), two-pass loudnorm -16 LUFS / -1.5 dBTP
scripts/finalize.sh    mux + encode all deliverables
scripts/qa.sh          ffprobe / full decode / blackdetect / freezedetect / loudness
```

## Rebuild
```bash
npm install
python3 -I scripts/prep_assets.py <path>/Nadav_Claude_Code_FRESH_START public   # only if assets are missing
npx remotion studio src/index.ts                      # live preview / edit
npx remotion render src/index.ts Main  out/video_main.mp4  --codec h264 --crf 12 --muted --gl swangle
npx remotion render src/index.ts Clean out/video_clean.mp4 --codec h264 --crf 12 --muted --gl swangle
npx remotion render src/index.ts Cut15 out/video_cut15.mp4 --codec h264 --crf 12 --muted --gl swangle
npx remotion render src/index.ts AltOpeningA out/video_altA.mp4 --codec h264 --crf 12 --muted --gl swangle
npx remotion render src/index.ts AltOpeningB out/video_altB.mp4 --codec h264 --crf 12 --muted --gl swangle
npx remotion still  src/index.ts Cover out/cover.jpg --jpeg-quality 95
python3 scripts/audio.py && python3 scripts/mix.py && bash scripts/finalize.sh
```
`remotion.config.ts` points at the pre-installed headless Chromium; remove that line on another machine.

## Voiceover
Drop `audio/vo/line_01.wav … line_06.wav` (timings in `../deliverables/VOICEOVER_NEEDED.txt`) and rerun
`python3 scripts/mix.py && bash scripts/finalize.sh`.
