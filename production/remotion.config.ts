import {Config} from '@remotion/cli/config';
import fs from 'fs';
// cloud sandbox only: use the pre-installed headless Chromium if it exists (ignored on a Mac/PC)
const CLOUD_CHROME = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(CLOUD_CHROME)) Config.setBrowserExecutable(CLOUD_CHROME);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('swangle');
