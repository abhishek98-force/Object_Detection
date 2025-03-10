import { Group, Text, Line } from 'react-konva';
import CustomTransformer from './CustomTransformer';
import { PolygonInnerType, PointType } from '../types';
import React from 'react';
import Konva from 'konva';
import { useRef, useState } from 'react';

type NonRectanglePolygonsType = {
  polygonInner: PolygonInnerType;
  isSelected: boolean;
  handleDragStart: (event: Konva.KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (
    event: Konva.KonvaEventObject<DragEvent>,
    origin: PointType
  ) => void;
  onClick: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  updatePolygonInner: (arg0: number[]) => void;
};
export default function NonRectanglePolygons({
  polygonInner,
  isSelected,
  handleDragStart,
  handleDragEnd,
  onClick,
  updatePolygonInner,
}: NonRectanglePolygonsType) {
  const shapeRef = useRef<Konva.Group>(null);
  const polygonRef = useRef<Konva.Line>(null);
  const [origin] = useState<PointType>(null);
  let centerX = 0,
    centerY = 0;
  bringSelectedItemToTop();
  calculateCenter();
  function bringSelectedItemToTop() {
    if (isSelected && shapeRef.current !== null) {
      shapeRef.current.moveToTop();
    }
  }

  function calculateCenter() {
    if (polygonInner.coords != null) {
      const points = polygonInner.coords;
      let xSum = 0,
        ySum = 0;

      for (let i = 0; i < points.length; i += 2) {
        xSum += points[i];
        ySum += points[i + 1];
      }

      centerX = xSum / (points.length / 2);
      centerY = ySum / (points.length / 2);
    }
  }
  // useEffect(() => {
  //   if (isSelected && trRef.current !== null && shapeRef.current !== null) {
  //     trRef.current.nodes([shapeRef.current]);
  //     if (trRef.current.getLayer()) {
  //       trRef.current.getLayer().batchDraw();
  //     }
  //   }
  // }, [isSelected, polygonInner]);

  // function calculateXandY() {
  //   if (polygonRef.current) {
  //     let updatedOrigin = {
  //       x: polygonRef.current.x(),
  //       y: polygonRef.current.y(),
  //     };
  //     setOrigin(updatedOrigin);
  //   }
  // }

  function onClickInter(e: Konva.KonvaEventObject<MouseEvent>) {
    console.log('click confie rmerd');
    onClick(e);
  }
  function handleTouchEnd(e: Konva.KonvaEventObject<TouchEvent>) {
    e.evt.preventDefault();
    onClick(e);
  }
  // calculateXandY();
  return (
    <React.Fragment>
      <Group
        id={polygonInner.id}
        ref={shapeRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={(e) => handleDragEnd(e, origin)}
        onClick={onClickInter}
        onTouchEnd={handleTouchEnd}
      >
        <Text
          text={polygonInner.label}
          x={centerX}
          y={centerY}
          fontSize={15}
          fontWeight={300}
          fontFamily="Arial"
          fill="red"
        />

        <Line
          points={polygonInner.coords}
          closed={true}
          ref={polygonRef}
          stroke="red"
          strokeWidth={0.5}
          // x={origin.x}
          // y={origin.y}
        />
        {isSelected && (
          <CustomTransformer
            polygonInner={polygonInner}
            updatePolygonInner={updatePolygonInner}
          />
        )}
      </Group>
    </React.Fragment>
  );
}
