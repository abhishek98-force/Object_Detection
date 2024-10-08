import { Group, Text, Line } from 'react-konva';
import CustomTransformer from './CustomTransformer';
import { PolygonInnerType, PointType } from '../types';
import React from 'react';
import Konva from 'konva';
import { useRef, useEffect, useState } from 'react';

type NonRectanglePolygonsType = {
  polygonInner: PolygonInnerType;
  isSelected: boolean;
  handleDragStart: (event: Konva.KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (
    event: Konva.KonvaEventObject<DragEvent>,
    origin: PointType
  ) => void;
  onClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  updatePolygonInner: (arg0: Number[]) => void;
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
  const [origin, setOrigin] = useState<PointType>(null);
  bringSelectedItemToTop();
  function bringSelectedItemToTop() {
    if (isSelected && shapeRef.current !== null) {
      shapeRef.current.moveToTop();
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

  function calculateXandY() {
    if (polygonRef.current) {
      let updatedOrigin = {
        x: polygonRef.current.x(),
        y: polygonRef.current.y(),
      };
      setOrigin(updatedOrigin);
    }
  }

  function onClickInter(e: Konva.KonvaEventObject<MouseEvent>) {
    console.log('click confie rmerd');
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
      >
        <Text
          text={polygonInner.label}
          x={0}
          y={0}
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
