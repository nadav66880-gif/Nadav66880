import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {Cut15, CUT15_LEN, AltOpeningA, ALT_A, AltOpeningB, ALT_B, Cover} from './Variants';
import {TL} from './lib';
import {Hook, HOOK_LEN} from './scenes/Hook';
const base = {fps: 30, width: 1080, height: 1920};
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.total} {...base} defaultProps={{captions: true}} />
    <Composition id="Clean" component={Main} durationInFrames={TL.total} {...base} defaultProps={{captions: false}} />
    <Composition id="Cut15" component={Cut15} durationInFrames={CUT15_LEN} {...base} />
    <Composition id="AltOpeningA" component={AltOpeningA} durationInFrames={ALT_A.len} {...base} />
    <Composition id="AltOpeningB" component={AltOpeningB} durationInFrames={ALT_B.len} {...base} />
    <Composition id="Hook" component={Hook} durationInFrames={HOOK_LEN} {...base} />
    <Composition id="Cover" component={Cover} durationInFrames={1} {...base} />
  </>
);
