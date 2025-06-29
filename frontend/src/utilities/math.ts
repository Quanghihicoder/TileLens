export type Point = { x: number; y: number };

// Calculate total of pixels from given points
export const shoelaceArea = (polygon: Point[]) => {
  const n = polygon.length;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = polygon[i];
    const { x: x2, y: y2 } = polygon[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }

  return Math.floor(Math.abs(sum) / 2);
};

export const calculateDistance = (p1: Point, p2: Point) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const angleWithYAxis = (p1: Point, p2: Point) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const radians = Math.atan2(dx, dy);
  const degrees = radians * (180 / Math.PI);
  return degrees;
};

export const calculateRelativeImageSize = (baseSize: number, originalWidth: number, originalHeight: number) => {
  const ratio = originalWidth / originalHeight
  return {width: ratio > 1 ? baseSize : Math.ceil(baseSize * ratio), height: ratio > 1 ? Math.ceil(baseSize / ratio) : baseSize } 
}

export const isNear = (p1: Point, p2: Point, threshold = 10): boolean => {
  return (
    Math.abs(p1.x - p2.x) <= threshold && Math.abs(p1.y - p2.y) <= threshold
  );
};

export const getNumberOfLevelsForImage = (width: number, height: number) => {
  const maxDimension = Math.max(width, height);
  return Math.ceil(1 + Math.log10(maxDimension));
};

export const getLevelMaxDimension = (
  width: number,
  height: number,
  zoomLevel: number
) => {
  return Math.ceil(
    Math.max(width, height) /
      2 ** (getNumberOfLevelsForImage(width, height) - 1 - zoomLevel)
  );
};
