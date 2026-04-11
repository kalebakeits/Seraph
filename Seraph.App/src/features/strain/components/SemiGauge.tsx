import React from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useAppState } from '@react-native-community/hooks';
import { ARC_ZONES, ratioToSkiaDeg } from '../utils/trainingLoadUtils';

const SIZE = 100;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 38;
const STROKE = 8;

function makeArc(startRatio: number, endRatio: number) {
  const path = Skia.Path.Make();
  const startDeg = ratioToSkiaDeg(startRatio);
  const sweepDeg = ratioToSkiaDeg(endRatio) - startDeg;
  path.addArc({ x: CX - R, y: CY - R, width: R * 2, height: R * 2 }, startDeg, sweepDeg);
  return path;
}

function makeNeedle(ratio: number) {
  const deg = ratioToSkiaDeg(ratio);
  const rad = (deg * Math.PI) / 180;
  const path = Skia.Path.Make();
  path.moveTo(CX + 6 * Math.cos(rad), CY + 6 * Math.sin(rad));
  path.lineTo(CX + (R - 4) * Math.cos(rad), CY + (R - 4) * Math.sin(rad));
  return path;
}

interface Props {
  ratio: number;
}

export const SemiGauge: React.FC<Props> = ({ ratio }) => {
  useAppState();

  return (
    <Canvas style={{ width: SIZE, height: SIZE / 2 + 8 }}>
      {ARC_ZONES.map(([s, e, color]) => (
        <Path
          key={color}
          path={makeArc(s, e)}
          color={color}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="butt"
        />
      ))}
      <Path
        path={makeNeedle(ratio)}
        color="white"
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
      />
    </Canvas>
  );
};
