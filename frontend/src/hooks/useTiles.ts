import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  type RefObject,
} from "react";
import { type Offset, type TileCoords } from "../types";

const TILE_SIZE = 256;
const BUFFER = 2;

export const useTiles = (
  levelWidth: number,
  levelHeight: number,
  zoom: number,
  offset: Offset,
  containerRef: RefObject<HTMLDivElement | null>
) => {
  const [visibleTiles, setVisibleTiles] = useState<TileCoords[]>([]);

  const maxNumberOfTilesX = useMemo(() => {
    return Math.ceil(levelWidth / TILE_SIZE) - 1;
  }, [levelWidth]);

  const maxNumberOfTilesY = useMemo(() => {
    return Math.ceil(levelHeight / TILE_SIZE) - 1;
  }, [levelHeight]);

  const overlaySpaceX = useMemo(() => {
    return (maxNumberOfTilesX + 1) * TILE_SIZE - levelWidth;
  }, [maxNumberOfTilesX, levelWidth]);

  const overlaySpaceY = useMemo(() => {
    return (maxNumberOfTilesY + 1) * TILE_SIZE - levelHeight;
  }, [maxNumberOfTilesY, levelHeight]);

  // Calculate the visible area in tile coordinates
  const calculateVisibleArea = useCallback(() => {
    const tilesContainer = containerRef.current;
    if (!tilesContainer) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const containerWidth = tilesContainer.clientWidth;
    const containerHeight = tilesContainer.clientHeight;

    // Calculate visible area in pixels
    const visibleLeft = -offset.x;
    const visibleTop = -offset.y;
    const visibleRight = visibleLeft + containerWidth;
    const visibleBottom = visibleTop + containerHeight;

    // Convert to tile coordinates with buffer
    const minX = Math.max(0, Math.floor(visibleLeft / TILE_SIZE) - BUFFER);
    const maxX = Math.min(
      maxNumberOfTilesX,
      Math.ceil(visibleRight / TILE_SIZE) + BUFFER
    );
    const minY = Math.max(0, Math.floor(visibleTop / TILE_SIZE) - BUFFER);
    const maxY = Math.min(
      maxNumberOfTilesY,
      Math.ceil(visibleBottom / TILE_SIZE) + BUFFER
    );

    return { minX, maxX, minY, maxY };
  }, [offset, maxNumberOfTilesX, maxNumberOfTilesY]);

  const calculateVisibleTiles = useCallback(() => {
    const tilesContainer = containerRef.current;
    if (!tilesContainer) return [];

    const { minX, maxX, minY, maxY } = calculateVisibleArea();

    const tiles: TileCoords[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        let width = undefined;
        let height = undefined;
        let top = 0;
        let left = 0;

        if (levelHeight < TILE_SIZE || levelWidth < TILE_SIZE) {
          width = undefined;
          height = undefined;
          if (levelHeight < TILE_SIZE && levelWidth > TILE_SIZE) {
            left = x * TILE_SIZE;
            if (x == maxNumberOfTilesX) {
              left -= overlaySpaceX;
            }
          }

          if (levelHeight > TILE_SIZE && levelWidth < TILE_SIZE) {
            top = y * TILE_SIZE;
            if (y == maxNumberOfTilesY) {
              top -= overlaySpaceY;
            }
          }
        } else {
          width = TILE_SIZE;
          height = TILE_SIZE;
          left = x * TILE_SIZE;
          top = y * TILE_SIZE;
          if (x == maxNumberOfTilesX) {
            left -= overlaySpaceX;
          }
          if (y == maxNumberOfTilesY) {
            top -= overlaySpaceY;
          }
        }

        tiles.push({
          z: zoom,
          x,
          y,
          left: left,
          top: top,
          width,
          height,
        });
      }
    }
    return tiles;
  }, [zoom, calculateVisibleArea]);

  // Update visible tiles when zoom
  useEffect(() => {
    setVisibleTiles(calculateVisibleTiles());
  }, [zoom, calculateVisibleTiles]);

  return {visibleTiles}
};
