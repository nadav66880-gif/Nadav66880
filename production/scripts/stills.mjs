// usage: node scripts/stills.mjs <comp> <scale> frame1 frame2 ...  -> out/stills/<frame>.jpg + contact sheet
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [comp, scale, ...frames] = process.argv.slice(2);
const browserExecutable = fs.readFileSync('remotion.config.ts', 'utf8').match(/setBrowserExecutable\('(.+?)'\)/)[1];
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: comp, browserExecutable});
fs.mkdirSync('out/stills', {recursive: true});
for (const f of frames) {
  await renderStill({serveUrl, composition, frame: +f, output: `out/stills/${f}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, scale: +scale, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  console.log('still', f);
}
