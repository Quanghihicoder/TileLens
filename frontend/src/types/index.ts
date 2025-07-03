export type Offset = {
  x: number;
  y: number;
};

export type Point = { x: number; y: number };

export type TileCoords = {
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number | undefined;
  height: number | undefined;
};

export type PastedImage = {
  width: number;
  height: number;
  left: number;
  top: number;
  imageId: string;
  imageType: string;
};

export type ImageHandler = {
  directionIndex: number;
  cursor: string;
  left: number;
  top: number;
};
