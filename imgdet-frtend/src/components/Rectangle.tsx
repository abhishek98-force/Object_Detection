import { useRef, useEffect, useState } from 'react';
import React from 'react';
import { Rect, Group, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { RectangleType } from '../types';

type RectangleComponentType = {
  rectangle: RectangleType;
  handleDragStart: () => void;
  isSelected: boolean;
  handleDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  handleTransformEnd: (
    event: Konva.KonvaEventObject<Event>,
    scaleX: number,
    scaleY: number
  ) => void;
  onClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
};

export default function Rectangle({
  rectangle,
  handleDragStart,
  isSelected,
  handleDragEnd,
  handleTransformEnd,
  onClick,
}: RectangleComponentType) {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (isSelected && trRef.current !== null && shapeRef.current !== null) {
      trRef.current.nodes([shapeRef.current]);
      if (trRef.current.getLayer()) {
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [isSelected, rectangle]);
  bringSelectedItemToTop();
  function bringSelectedItemToTop() {
    if (isSelected && shapeRef.current !== null) {
      shapeRef.current.moveToTop();
    }
  }

  return (
    <React.Fragment>
      <Group
        x={rectangle.x}
        y={rectangle.y}
        id={rectangle.id}
        ref={shapeRef}
        draggable
        onDragStart={() => {
          handleDragStart();
        }}
        onDragEnd={(e) => {
          handleDragEnd(e);
        }}
        onClick={onClick}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          if (node !== null) {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // we will reset it back
            node.scaleX(1);
            node.scaleY(1);

            handleTransformEnd(e, scaleX, scaleY);
          }
        }}
      >
        <Text
          text={rectangle.label}
          x={0}
          y={0}
          fontSize={15}
          fontWeight={300}
          fontFamily="Arial"
          fill="red"
        />
        <Rect
          x={0}
          y={0}
          width={rectangle.width}
          height={rectangle.height}
          stroke="red"
          strokeWidth={0.3}
        />
      </Group>
      {isSelected && (
        <Transformer ref={trRef} flipEnabled={false} rotateEnabled={false} />
      )}
    </React.Fragment>
  );
}
