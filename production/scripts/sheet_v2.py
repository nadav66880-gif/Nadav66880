"""contact sheet: python3 scripts/sheet_v2.py out/v2 start end step out.jpg"""
import sys
from PIL import Image, ImageDraw
d, a, b, st, o = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
fr = list(range(a, b, st)); cols = 8; w, h = 270, 480
sh = Image.new('RGB', (cols * w, ((len(fr) + cols - 1) // cols) * (h + 18)), 'white'); dr = ImageDraw.Draw(sh)
for i, f in enumerate(fr):
    im = Image.open(f'{d}/element-{f:03d}.jpeg').resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 18)
    sh.paste(im, (x, y)); dr.text((x + 4, y + h + 2), str(f), fill='black')
sh.save(o, quality=85)
