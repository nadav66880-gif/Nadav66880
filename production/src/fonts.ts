import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
const f = (family: string, file: string) => loadFont({family, url: staticFile('fonts/' + file), weight: '100 900'});
export const fontsReady = Promise.all([
  f('Inter', 'Inter.ttf'), f('Heebo', 'Heebo.ttf'), f('Cormorant', 'CormorantGaramond.ttf'), f('FrankRuhl', 'FrankRuhlLibre.ttf'),
]);
export const UI_FONT = 'Inter, Heebo, "Noto Color Emoji", sans-serif';
export const HE_FONT = 'Heebo, Inter, "Noto Color Emoji", sans-serif';
export const SERIF = 'Cormorant, FrankRuhl, serif';
export const HE_SERIF = 'FrankRuhl, Cormorant, serif';
