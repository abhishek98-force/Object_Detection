import { Layer, Circle, Rect, Line } from 'react-konva';
import { useState, useRef } from 'react';
import { Delay } from '../services/confirmationDelayService';
// import { PolygonType, PointType } from '../types';
import Konva from 'konva';
import { PartialPolygonType } from '../types';

type Dimension = {
  width: number;
  height: number;
};

type PolygonDrawLayerType = {
  isDrawing: boolean;
  stageRef: Konva.Stage;
  stopDrawing: () => void;
  sendPolygonDataToParent: (arg0: PartialPolygonType) => void;
  canvaScale: number;
  canvasDimension: Dimension;
};

export default function PolygonDrawLayer({
  stageRef,
  stopDrawing,
  sendPolygonDataToParent,
  canvasDimension,
}: PolygonDrawLayerType) {
  const [circle, setCircle] = useState<boolean>(false);
  const polygonLayer = useRef<Konva.Layer>(null);
  const circleRef = useRef<Konva.Circle>(null);
  const circleDrawn = useRef<boolean>(false);
  const [lineCoords, setLineCoords] = useState<number[]>([]);
  const [circleCoord, setCircleCoord] = useState<Konva.Vector2d | null>(null);
  const [circleColor, setCircleColor] = useState<string>('red');
  async function drawCircle(
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) {
    if (stageRef) {
      const pos = stageRef.getRelativePointerPosition();
      if (e.target === circleRef.current && pos) {
        circleDrawn.current = false;
        const lines = [...lineCoords];
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

  function handleTouchEnd(event: Konva.KonvaEventObject<TouchEvent>) {
    event.evt.preventDefault();
    drawCircle(event);
  }

  function handleExitFromPolygonLayer() {
    const lineObject = [];
    for (let i = 0; i < lineCoords.length; i += 2) {
      lineObject.push({ x: lineCoords[i], y: lineCoords[i + 1] });
    }
    const polygonProperty = {
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
        width={canvasDimension.width}
        height={canvasDimension.height}
        fill="rgba(255, 255, 255, 0.3)" // White with 30% opacity
        stroke="rgba(0, 0, 0, 1)" // Black with full opacity
        strokeWidth={2} // Stroke width of 2 pixels
        strokeDasharray="5,5" // Dashed border
        cursor="crosshair" // Crosshair cursor for drawing
        onClick={drawCircle}
        onTouchEnd={handleTouchEnd}
      />
      {circle && circleCoord && (
        <Circle
          ref={circleRef}
          x={circleCoord.x}
          y={circleCoord.y}
          onClick={propogateEventToRect}
          onTouchEnd={handleTouchEnd}
          radius={10}
          fill={circleColor}
          stroke="red"
        />
      )}
      <Line points={lineCoords} stroke="black" />
    </Layer>
  );
}
