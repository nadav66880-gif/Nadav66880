import json, sys
from pathlib import Path
TL = json.loads(Path('src/timeline.json').read_text())
def ts(f):
    ms = round(f / TL['fps'] * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
def srt(items, path):
    out = [f"{i}\n{ts(c['from'])} --> {ts(c['to'])}\n‫{c['text']}‬\n" for i, c in enumerate(items, 1)]
    Path(path).write_text('\n'.join(out), encoding='utf-8')
srt(TL['captions'], sys.argv[1])
