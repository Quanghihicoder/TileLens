import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type RefObject,
} from "react";

import { ImageDimensions, type Offset } from "../types";

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
  windowContainerDimensionsRef: RefObject<ImageDimensions>,
  prevZoomRef: RefObject<number | null>
) => {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const prevOffsetRef = useRef<Offset>({ x: 0, y: 0 });

  const levelWidthRef = useRef(levelWidth);
  const levelHeightRef = useRef(levelHeight);

  useEffect(() => {
    levelWidthRef.current = levelWidth;
  }, [levelWidth]);

    useEffect(() => {
    levelHeightRef.current = levelHeight;
  }, [levelHeight]);


  const clampOffset = useCallback(
    (x: number, y: number) => {
    if (windowContainerDimensionsRef.current.width == 0 && windowContainerDimensionsRef.current.height == 0) return { x, y };

    console.log(prevOffsetRef.current)
      const containerWidth = windowContainerDimensionsRef.current.width ;
      const containerHeight = windowContainerDimensionsRef.current.height;

      // Max pan is zero (can't pan right/down beyond edge)
      // Min pan is container size minus grid size (negative value)
      const minX = Math.min(containerWidth - levelWidthRef.current, 0);
      const minY = Math.min(containerHeight - levelHeightRef.current, 0);
      const clampedX = Math.max(Math.min(x, 0), minX);
      const clampedY = Math.max(Math.min(y, 0), minY);

      return { x: clampedX, y: clampedY };
    },
    []
  );
    
  const calculateOffsetAfterZoom = useCallback((position: Offset): Offset | null => {
   if (windowContainerDimensionsRef.current.width == 0 && windowContainerDimensionsRef.current.height == 0) return null;

    const prevZoom = prevZoomRef.current;
    if (prevZoom === zoom) return null;

    // Get center of the container
    const centerX = windowContainerDimensionsRef.current.width / 2;
    const centerY = windowContainerDimensionsRef.current.height / 2;

    // Convert screen center to world coordinates before zoom
    if (maxNumberOfTilesXBefore == null) return null;
    if (maxNumberOfTilesYBefore == null) return null;

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
