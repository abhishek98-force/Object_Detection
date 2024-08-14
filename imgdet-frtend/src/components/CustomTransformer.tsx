import { Line, Rect, Group } from 'react-konva';
import { PolygonInnerType } from '../types';
import Konva from 'konva';
type CustomTransformerType = {
  polygonInner: PolygonInnerType;
  updatePolygonInner: (arg0: Number[]) => void;
};
export default function CustomTransformer({
  polygonInner,
  updatePolygonInner,
}: CustomTransformerType) {
  function handleDragMove(event: Konva.KonvaEventObject<MouseEvent>) {
    let updatedCoords = [...polygonInner.coords];
    let index = Number(event.target.id().split('-')[1]);
    updatedCoords[index] = event.target.x();
    updatedCoords[index + 1] = event.target.y();
    updatePolygonInner(updatedCoords);
  }
  return (
    <Group>
      <Line points={polygonInner.coords} closed stroke="blue" />
      {polygonInner.coords.map((coord, index) => {
        if (index % 2 === 0) {
          return (
            <Rect
              id={`anchor-${index}`}
              key={index}
              x={polygonInner.coords[index]}
              y={polygonInner.coords[index + 1]}
              width={10}
              height={10}
              stroke="blue"
              fill="white"
              draggable
              onDragMove={(e) => handleDragMove(e)}
            />
          );
        }
      })}
    </Group>
  );
}
