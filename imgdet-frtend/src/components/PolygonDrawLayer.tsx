import { Layer, Circle, Rect, Line } from 'react-konva';
import { useState, useRef } from 'react';
import { Delay } from '../services/confirmationDelayService';
import { PolygonType, PointType } from '../types';
import Konva from 'konva';
import React from 'react';

type PolygonDrawLayerType = {
  isDrawing: boolean;
  stageRef: Konva.Stage;
  stopDrawing: () => void;
  sendPolygonDataToParent: (arg0: any) => void;
  canvaScale: number;
};

const canvasWidth = 800;
const canvasHeight = 400;

export default function PolygonDrawLayer({
  isDrawing,
  stageRef,
  stopDrawing,
  sendPolygonDataToParent,
  canvaScale,
}: PolygonDrawLayerType) {
  const [circle, setCircle] = useState<boolean>(false);
  const polygonLayer = useRef<Konva.Layer>(null);
  const circleRef = useRef<Konva.Circle>(null);
  const circleDrawn = useRef<boolean>(false);
  const [lineCoords, setLineCoords] = useState<number[]>([]);
  const [circleCoord, setCircleCoord] = useState<Konva.Vector2d | null>(null);
  const [circleColor, setCircleColor] = useState<string>('red');
  async function drawCircle(e: Konva.KonvaEventObject<MouseEvent>) {
    if (stageRef) {
      const pos = stageRef.getRelativePointerPosition();
      if (e.target === circleRef.current && pos) {
        circleDrawn.current = false;
        let lines = [...lineCoords];
        lines.push(pos.x);
        lines.push(pos.y);
        setLineCoords(lines);
        setCircleColor('green');
        await Delay(2);
        console.log('End');
        stopDrawing();
        setCircle(false);
        handleExitFromPolygonLayer();
        return;
      }
      if (circleDrawn.current) {
        setLineCoords((lineCoords) => {
          if (pos) return [...lineCoords, pos.x, pos.y];
          else return lineCoords;
        });
        return;
      }
      setCircle(true);

      setLineCoords((prevElem) => {
        if (pos) {
          return [...prevElem, pos?.x, pos?.y];
        }
        return prevElem;
      });
      setCircleCoord(pos);
      circleDrawn.current = true;
    }
  }

  function handleExitFromPolygonLayer() {
    let lineObject = [];
    for (let i = 0; i < lineCoords.length; i += 2) {
      lineObject.push({ x: lineCoords[i], y: lineCoords[i + 1] });
    }
    let polygonProperty = {
      label: '',
      coords: lineObject,
    };
    console.log({ polygonDrawn: polygonProperty });
    sendPolygonDataToParent(polygonProperty);
  }

  // function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
  //   if (!circleDrawn) return;
  //   let newLines = [...lineCoords];
  //   const stage = e.target.getStage();
  //   if (stage !== null) {
  //     const pos = stage.getPointerPosition();
  //     if (pos !== null) {
  //       newLines[newLines.length - 1][2] = pos.x;
  //       newLines[newLines.length - 1][3] = pos.y;
  //     }
  //     setLineCoords(newLines);
  //   }
  // }

  function propogateEventToRect(event: Konva.KonvaEventObject<MouseEvent>) {
    drawCircle(event);
  }
  return (
    <Layer ref={polygonLayer}>
      <Rect
        width={canvasWidth}
        height={canvasHeight}
        fill="transparent"
        stroke="blue"
        onClick={drawCircle}
      />
      {circle && circleCoord && (
        <Circle
          ref={circleRef}
          x={circleCoord.x}
          y={circleCoord.y}
          onClick={propogateEventToRect}
          radius={10}
          fill={circleColor}
          stroke="red"
        />
      )}
      <Line points={lineCoords} stroke="black" />
    </Layer>
  );
}
