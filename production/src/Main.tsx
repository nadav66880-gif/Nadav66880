import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, delayRender, continueRender} from 'remotion';
import {fontsReady} from './fonts';
import {TL} from './lib';
import {Opening} from './scenes/Opening';
import {Post1} from './scenes/Post1';
import {Post2} from './scenes/Post2';
import {Post3} from './scenes/Post3';
import {Outro} from './scenes/Outro';
import {Whip, TapB12} from './scenes/Whip';
import {Captions} from './Captions';

export const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {fontsReady.then(() => continueRender(h));}, [h]);
};
export const Main: React.FC<{captions?: boolean}> = ({captions = true}) => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={TL.p1}><Opening /></Sequence>
      <Sequence from={TL.p1} durationInFrames={TL.whip[0] - TL.p1}><Post1 /></Sequence>
      <Sequence from={TL.whip[0]} durationInFrames={TL.p2 - TL.whip[0]}><Whip /></Sequence>
      <Sequence from={TL.p2} durationInFrames={243}><Post2 /></Sequence>
      <Sequence from={TL.p2 + 243} durationInFrames={TL.p3 - TL.p2 - 243}><TapB12 /></Sequence>
      <Sequence from={TL.p3} durationInFrames={TL.outro - TL.p3}><Post3 /></Sequence>
      <Sequence from={TL.outro} durationInFrames={TL.total - TL.outro}><Outro /></Sequence>
      {captions && <Captions />}
    </AbsoluteFill>
  );
};
