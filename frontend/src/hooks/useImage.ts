import { useMemo, type RefObject } from "react";
import { getLevelMaxDimension } from "../utilities/math";

const TILE_SIZE = 256;

export const useImage = (
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  prevZoomRef: RefObject<number>
) => {
  const levelMaxDimension = useMemo(() => {
    return getLevelMaxDimension(imageWidth, imageHeight, zoom);
  }, [imageWidth, imageHeight, zoom]);

  const levelMaxDimensionBefore = useMemo(() => {
    const prevZoom = prevZoomRef.current;
    if (prevZoom === zoom) return null;
    return getLevelMaxDimension(imageWidth, imageHeight, prevZoom);
  }, [imageWidth, imageHeight, zoom]);

  const ratio = useMemo(() => {
    return imageWidth / imageHeight;
  }, [imageWidth, imageHeight]);

  const levelWidth = useMemo(() => {
    return ratio > 1 ? levelMaxDimension : Math.ceil(levelMaxDimension * ratio);
  }, [ratio, levelMaxDimension]);

  const levelHeight = useMemo(() => {
    return ratio > 1 ? Math.ceil(levelMaxDimension / ratio) : levelMaxDimension;
  }, [ratio, levelMaxDimension]);

  const levelWidthBefore = useMemo(() => {
    if (!levelMaxDimensionBefore) return null;
    return ratio > 1
      ? levelMaxDimensionBefore
      : Math.ceil(levelMaxDimensionBefore * ratio);
  }, [ratio, levelMaxDimensionBefore]);

  const levelHeightBefore = useMemo(() => {
    if (!levelMaxDimensionBefore) return null;
    return ratio > 1
      ? Math.ceil(levelMaxDimensionBefore / ratio)
      : levelMaxDimensionBefore;
  }, [ratio, levelMaxDimensionBefore]);

  const maxNumberOfTilesX = useMemo(() => {
    return Math.ceil(levelWidth / TILE_SIZE) - 1;
  }, [levelWidth]);

  const maxNumberOfTilesY = useMemo(() => {
    return Math.ceil(levelHeight / TILE_SIZE) - 1;
  }, [levelHeight]);

  const maxNumberOfTilesXBefore = useMemo(() => {
    if (!levelWidthBefore) return null;

    return Math.ceil(levelWidthBefore / TILE_SIZE) - 1;
  }, [levelWidthBefore]);

  const maxNumberOfTilesYBefore = useMemo(() => {
    if (!levelHeightBefore) return null;

    return Math.ceil(levelHeightBefore / TILE_SIZE) - 1;
  }, [levelHeightBefore]);

  return {levelWidth, levelHeight, maxNumberOfTilesX, maxNumberOfTilesY, maxNumberOfTilesXBefore, maxNumberOfTilesYBefore}
};
