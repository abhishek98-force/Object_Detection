import { PolygonType, RectangleType, PolygonInnerType } from '../types';
import { useState, useRef, useEffect } from 'react';

import Konva from 'konva';

import Rectangle from './Rectangle';
import NonRectanglePolygons from './NonRectanglePolygons';

type PolygonComponentType = {
  polygon: PolygonType;
  updatePolygonParent: (polygon: PolygonType) => void;
  isSelected: boolean;
  onClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
};

export default function Polygon({
  polygon,
  updatePolygonParent,
  isSelected,
  onClick,
}: PolygonComponentType) {
  const [rectangle, setRectangle] = useState<RectangleType>();
  const [polygonInner, setPolygonInner] = useState<PolygonInnerType>();
  const [prevPolygon, setPrevPolygon] = useState<PolygonType>();

  if (polygon !== prevPolygon) {
    deriveRectangle();
    derivePolygons();
    setPrevPolygon(polygon);
  }

  function deriveRectangle(): void {
    if (
      polygon.coords.length !== 4 ||
      !polygon.coords[0] ||
      !polygon.coords[1] ||
      !polygon.coords[3]
    ) {
      console.warn(
        'Polygon coordinates are not valid for deriving a rectangle'
      );
      return;
    }

    const newRectangle: RectangleType = {
      id: polygon.id,
      x: polygon.coords[0].x,
      y: polygon.coords[0].y,
      width: Math.abs(polygon.coords[0].x - polygon.coords[1].x),
      height: Math.abs(polygon.coords[0].y - polygon.coords[3].y),
      label: polygon.label,
      isDraggable: false,
    };

    setRectangle(newRectangle);
  }

  function derivePolygons() {
    if (polygon.coords.length < 3 || polygon.coords.length === 4) return;
    let newCoords: number[] = polygon.coords
      .map((e) => {
        return [e?.x, e?.y];
      })
      .flat()
      .filter((value): value is number => value !== undefined);
    const newPolygon: PolygonInnerType = {
      id: polygon.id,
      coords: newCoords,
      label: polygon.label,
      isDraggable: false,
    };
    setPolygonInner(newPolygon);
  }

  function handleDragStart() {
    if (rectangle !== undefined) {
      setRectangle(() => {
        return {
          ...rectangle,
          isDraggable: true,
        };
      });
      return;
    }
    if (polygonInner !== undefined) {
      setPolygonInner(() => {
        return {
          ...polygonInner,
          isDraggable: true,
        };
      });
      return;
    }
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    if (rectangle !== undefined) {
      setRectangle(() => {
        let newRectangle = {
          ...rectangle,
          x: e.target.x(),
          y: e.target.y(),
          isDraggable: false,
        };
        updatePolygon(newRectangle);
        return newRectangle;
      });
      return;
    }

    if (polygonInner !== undefined) {
      console.log({ polygonEvent: e });
      return;
    }
  }

  function handleTransformEnd(
    e: Konva.KonvaEventObject<Event>,
    scaleX: number,
    scaleY: number
  ) {
    if (rectangle !== undefined) {
      setRectangle(() => {
        let newRectangle = {
          ...rectangle,
          x: e.target.x(),
          y: e.target.y(),
          width: rectangle.width * scaleX,
          height: rectangle.height * scaleY,
        };
        updatePolygon(newRectangle);
        return newRectangle;
      });
    }
  }

  function updatePolygon(rect: RectangleType) {
    if (rectangle !== undefined) {
      let newPolygon = {
        ...polygon,
        coords: [
          {
            ...polygon.coords[0],
            x: rect.x,
            y: rect.y,
          },
          {
            ...polygon.coords[1],
            x: rect.x + rect.width,
            y: rect.y,
          },
          {
            ...polygon.coords[2],
            x: rect.x + rect.width,
            y: rect.y + rect.height,
          },
          {
            ...polygon.coords[3],
            x: rect.x,
            y: rect.y + rect.height,
          },
        ],
        label: rect.label,
      };
      updatePolygonParent(newPolygon);
    }
  }

  function updatePolygonInner(arg0: number[]) {
    setPolygonInner((prevPolygon) => {
      if (prevPolygon) {
        return {
          ...prevPolygon,
          coords: arg0,
        };
      } else return prevPolygon;
    });
  }
  return (
    <>
      {rectangle !== undefined && (
        <Rectangle
          rectangle={rectangle}
          handleDragStart={handleDragStart}
          isSelected={isSelected}
          handleDragEnd={handleDragEnd}
          handleTransformEnd={handleTransformEnd}
          onClick={onClick}
        />
      )}
      {polygonInner !== undefined && (
        <NonRectanglePolygons
          polygonInner={polygonInner}
          isSelected={isSelected}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          onClick={onClick}
          updatePolygonInner={updatePolygonInner}
        />
      )}
    </>
  );
}
