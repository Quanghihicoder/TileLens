import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type RefObject,
} from "react";

export type Offset = {
  x: number;
  y: number;
};

export const useOffset = (
  levelWidth: number,
  levelHeight: number,
  zoom: number,
  maxNumberOfTilesX: number,
  maxNumberOfTilesY: number,
  maxNumberOfTilesXBefore: number | null,
  maxNumberOfTilesYBefore: number | null,
  widthOverflow: boolean,
  heightOverflow: boolean,
  containerRef: RefObject<HTMLDivElement | null>,
  prevZoomRef: RefObject<number | null>
) => {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const prevOffsetRef = useRef<Offset>({ x: 0, y: 0 });

  const clampOffset = useCallback(
    (x: number, y: number) => {
      const tilesContainer = containerRef.current;
      if (!tilesContainer) return { x, y };

      const containerWidth = tilesContainer.clientWidth;
      const containerHeight = tilesContainer.clientHeight;

      // Max pan is zero (can't pan right/down beyond edge)
      // Min pan is container size minus grid size (negative value)
      const minX = Math.min(containerWidth - levelWidth, 0);
      const minY = Math.min(containerHeight - levelHeight, 0);
      const clampedX = Math.max(Math.min(x, 0), minX);
      const clampedY = Math.max(Math.min(y, 0), minY);

      return { x: clampedX, y: clampedY };
    },
    [levelWidth, levelHeight]
  );

  const calculateOffsetAfterZoom = useCallback((position: Offset): Offset | null => {
    const tilesContainer = containerRef.current;
    if (!tilesContainer) return null;

    const prevZoom = prevZoomRef.current;
    if (prevZoom === zoom) return null;

    // Get center of the container
    const centerX = tilesContainer.clientWidth / 2;
    const centerY = tilesContainer.clientHeight / 2;

    // Convert screen center to world coordinates before zoom
    if (!maxNumberOfTilesXBefore) return null;
    if (!maxNumberOfTilesYBefore) return null;

    // New offset to keep the same world point centered
    const worldX =
      (centerX - position.x) / (maxNumberOfTilesXBefore + 1);
    const worldY =
      (centerY - position.y) / (maxNumberOfTilesYBefore + 1);

    const newOffsetX = centerX - worldX * (maxNumberOfTilesX + 1);
    const newOffsetY = centerY - worldY * (maxNumberOfTilesY + 1);

    return { x: newOffsetX, y: newOffsetY };
  }, [zoom]);

  // Change offset after zoom
  useEffect(() => {
    const calculatedOffset = calculateOffsetAfterZoom(prevOffsetRef.current);
    if (calculatedOffset) {
      let clamped = clampOffset(calculatedOffset.x, calculatedOffset.y);

      let newOffset = { x: 0, y: 0 };

      if (widthOverflow) {
        newOffset.x = clamped.x;
      }

      if (heightOverflow) {
        newOffset.y = clamped.y;
      }

      prevOffsetRef.current = newOffset;
      setOffset(newOffset);
    }

    prevZoomRef.current = zoom;
  }, [zoom]);

  return { offset, clampOffset, prevOffsetRef, setOffset }
};
