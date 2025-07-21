import { type Point, type PastedImage } from "../types";

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

export const calculateRelativeImageSize = (
  baseSize: number,
  originalWidth: number,
  originalHeight: number
) => {
  const ratio = originalWidth / originalHeight;
  return {
    width: ratio > 1 ? baseSize : Math.ceil(baseSize * ratio),
    height: ratio > 1 ? Math.ceil(baseSize / ratio) : baseSize,
  };
};

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

export const generateCirclePoints = (
  center: Point,
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  pointCount: number = 36
): Point[] => {
  const radius = Math.min(width, height) / 2;
  const points: Point[] = [];

  for (let i = 0; i < pointCount; i++) {
    const angle = (2 * Math.PI * i) / pointCount;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);

    if (x >= 0 && y >= 0 && x <= maxWidth && y <= maxHeight) {
      points.push({ x, y });
    }
  }

  return points;
};

export const floorPoints = (points: Point[]): Point[] => {
  const flooredPoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const x = Math.floor(points[i].x);
    const y = Math.floor(points[i].y);
    flooredPoints.push({ x, y });
  }

  return flooredPoints;
};

export const floorImages = (images: PastedImage[]): PastedImage[] => {
  const flooredImages: PastedImage[] = [];

  for (let i = 0; i < images.length; i++) {
    flooredImages.push({
      width: Math.floor(images[i].width),
      height: Math.floor(images[i].height),
      left: Math.floor(images[i].left),
      top: Math.floor(images[i].top),
      imageId: images[i].imageId,
      imageType: images[i].imageType,
    });
  }

  return flooredImages;
};

export const topLeftResize = (
  top: number,
  left: number,
  width: number,
  height: number,
  newTop: number,
  newLeft: number
) => {
  const newWidth = left - newLeft + width;
  const newHeight = top - newTop + height;

  return {
    left: newLeft,
    top: newTop,
    width: Math.max(newWidth, 100),
    height: Math.max(newHeight, 100),
  };
};

export const topCenterResize = (
  top: number,
  left: number,
  width: number,
  height: number,
  newTop: number,
  _newLeft: number
) => {
  const newHeight = top - newTop + height;

  return {
    left,
    top: newTop,
    width,
    height: Math.max(newHeight, 100),
  };
};

export const topRightResize = (
  top: number,
  left: number,
  _width: number,
  height: number,
  newTop: number,
  newLeft: number
) => {
  const newWidth = newLeft - left;
  const newHeight = top - newTop + height;
  return {
    left,
    top: newTop,
    width: Math.max(newWidth, 100),
    height: Math.max(newHeight, 100),
  };
};

export const middleLeftResize = (
  top: number,
  left: number,
  width: number,
  height: number,
  _newTop: number,
  newLeft: number
) => {
  const newWidth = left - newLeft + width;
  return {
    left: newLeft,
    top,
    width: Math.max(newWidth, 100),
    height,
  };
};

export const centerMove = (
  _top: number,
  _left: number,
  width: number,
  height: number,
  newTop: number,
  newLeft: number
) => {
  return {
    left: newLeft - width / 2,
    top: newTop - height / 2,
    width,
    height,
  };
};

export const middleRightResize = (
  top: number,
  left: number,
  _width: number,
  height: number,
  _newTop: number,
  newLeft: number
) => {
  const newWidth = newLeft - left;
  return {
    left,
    top,
    width: Math.max(newWidth, 100),
    height,
  };
};

export const bottomLeftResize = (
  top: number,
  left: number,
  width: number,
  _height: number,
  newTop: number,
  newLeft: number
) => {
  const newWidth = left - newLeft + width;
  const newHeight = newTop - top;
  return {
    left: newLeft,
    top,
    width: Math.max(newWidth, 100),
    height: Math.max(newHeight, 100),
  };
};

export const bottomCenterResize = (
  top: number,
  left: number,
  width: number,
  _height: number,
  newTop: number,
  _newLeft: number
) => {
  const newHeight = newTop - top;
  return {
    left,
    top,
    width,
    height: Math.max(newHeight, 100),
  };
};

export const bottomRightResize = (
  top: number,
  left: number,
  _width: number,
  _height: number,
  newTop: number,
  newLeft: number
) => {
  const newWidth = newLeft - left;
  const newHeight = newTop - top;
  return {
    left,
    top,
    width: Math.max(newWidth, 100),
    height: Math.max(newHeight, 100),
  };
};

const resizeFns = [
  topLeftResize,
  topCenterResize,
  topRightResize,
  middleLeftResize,
  centerMove,
  middleRightResize,
  bottomLeftResize,
  bottomCenterResize,
  bottomRightResize,
];

export const resizeImage = (
  image: PastedImage,
  position: Point,
  directionIndex: number
) => {
  const resizeFn = resizeFns[directionIndex];

  return resizeFn(
    image.top,
    image.left,
    image.width,
    image.height,
    position.y,
    position.x
  );
};
