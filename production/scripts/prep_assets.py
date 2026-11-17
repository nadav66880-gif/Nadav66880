"""Prepare assets: copy original post photos (byte-identical) + crop real UI elements from the user's screen recording."""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

SRC = Path(sys.argv[1])          # .../Nadav_Claude_Code_FRESH_START
OUT = Path(sys.argv[2])          # production/public
REC = SRC / "04_INSTAGRAM_REFERENCE/ScreenRecording_11-15-2026 19-27-42_1.mp4"
man = json.loads((SRC / "07_INSTRUCTIONS/ASSET_MANIFEST.json").read_text())
byname = {(p["post"], p["filename"]): p for p in man["photos"]}

SELECT = {  # subset of curated_sequence, in edit order. Post-locked.
  "POST_01_PROPOSAL": ["SCRL_0012.jpeg", "SCRL_0023.jpeg", "SCRL_0009.jpeg", "SCRL_0008.jpeg", "SCRL_0007.jpeg"],
  "POST_02_BETZEL_HADEKEL": ["5N3A5439-HDR_Original.jpeg", "5N3A5465-HDR_Original.jpeg", "5N3A5073-HDR_Original.jpeg",
                             "5N3A4848-HDR_Original.jpeg", "5N3A4873-HDR_Original.jpeg", "5N3A4898-HDR_Original.jpeg"],
  "POST_03_PILATES": ["IMG_4762.jpeg", "IMG_4715.jpeg", "IMG_4828.jpeg", "IMG_4993.jpeg", "IMG_5142.jpeg"],
}
key = {"POST_01_PROPOSAL": "p1", "POST_02_BETZEL_HADEKEL": "p2", "POST_03_PILATES": "p3"}
assign = []
(OUT / "posts").mkdir(parents=True, exist_ok=True)
for post, files in SELECT.items():
    seen = set()
    for i, f in enumerate(files):
        meta = byname[(post, f)]
        src = SRC / meta["path"]
        h = hashlib.sha256(src.read_bytes()).hexdigest()
        assert h == meta["sha256"], src
        assert h not in seen, "duplicate inside carousel " + f
        seen.add(h)
        dst = OUT / "posts" / f"{key[post]}_{i+1:02d}.jpeg"
        shutil.copyfile(src, dst)
        assign.append({"post": post, "slot": dst.name, "source_file": meta["path"], "sha256": h,
                       "width": meta["width"], "height": meta["height"]})
(OUT / "posts/ASSIGNMENT.json").write_text(json.dumps(assign, indent=2, ensure_ascii=False))
shutil.copyfile(SRC / "05_BRANDING/Nadav_ohana_.PNG", OUT / "logo.png")

# --- real UI crops from the recording (512x1112) ---
ui = OUT / "ui"; ui.mkdir(exist_ok=True)
def frame(t):
    p = ui / f"_f{t}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(REC), "-frames:v", "1", str(p)], check=True)
    im = Image.open(p).convert("RGB"); p.unlink(); return im
S = 1080 / 512
def up(im, w, h):
    return im.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
top = frame(24.0)     # grid rows 1-3 at y=311/538/765 ; highlights row
low = frame(156.0)    # grid rows 7-9 at y=262/489/717
cols = [(0, 170), (172, 341), (343, 512)]
tw, th = round(170 * S), round(226 * S)
for name, im, ys in (("a", top, [311, 538, 765]), ("b", low, [262, 489, 717])):
    for r, y in enumerate(ys):
        for c, (x0, x1) in enumerate(cols):
            up(im.crop((x0, y, x1, y + 226)), tw, th).save(ui / f"tile_{name}{r+1}{c+1}.jpg", quality=94)
# avatar (recording frame 0)
f0 = frame(0.2)
cx, cy, r = 75, 237, 55
av = up(f0.crop((cx - r, cy - r, cx + r, cy + r)), 400, 400)
m = Image.new("L", (400, 400), 0); ImageDraw.Draw(m).ellipse((0, 0, 399, 399), fill=255)
av.putalpha(m); av.save(ui / "avatar.png")
# story highlights (circles) from frame 24s, centers y~170
for i, x in enumerate([163, 267, 371, 476]):
    rr = 37
    h = up(top.crop((x - rr, 170 - rr, x + rr, 170 + rr)), 240, 240)
    mm = Image.new("L", (240, 240), 0); ImageDraw.Draw(mm).ellipse((0, 0, 239, 239), fill=255)
    h.putalpha(mm); h.save(ui / f"hl_{i+1}.png")
print("assets ok", len(assign))
