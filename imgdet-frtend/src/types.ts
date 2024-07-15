export type RectangleType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isDraggable: boolean;
};

export type PointType = {
  x: number;
  y: number;
} | null;

export type PolygonType = {
  id: string;
  coords: PointType[];
  label: string;
  probability: number;
};

export type PolygonInnerType = {
  id: string;
  label: string;
  isDraggable: boolean;
  coords: number[];
};
