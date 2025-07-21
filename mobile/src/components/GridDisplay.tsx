import { Image, View } from 'react-native';
import { useTiles } from '../hooks/useTiles';
import { ImageDimensions, type Offset, type TileCoords } from '../types';
import { ASSETS_URL } from '@env';
import { RefObject, useEffect, useState } from 'react';

export const GridDisplay = ({
  userId,
  imageId,
  levelWidth,
  levelHeight,
  zoom,
  offset,
  containerDimensionsRef,
}: {
  userId: string;
  imageId: string;
  levelWidth: number;
  levelHeight: number;
  zoom: number;
  offset: Offset;
  containerDimensionsRef: RefObject<ImageDimensions>;
}) => {
  const { visibleTiles } = useTiles(
    levelWidth,
    levelHeight,
    zoom,
    offset,
    containerDimensionsRef,
  );

  const tileUrl = ({ z, x, y }: TileCoords): string =>
    `${ASSETS_URL}/tiles/${userId}/${imageId}/${z}/${x}/${y}.png`;

  // Track tile sizes if img.width/height are undefined
  const [tileSizes, setTileSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});

  useEffect(() => {
    visibleTiles.forEach(tile => {
      const key = `${tile.z}-${tile.x}-${tile.y}`;
      if (
        (tile.width === undefined || tile.height === undefined) &&
        !tileSizes[key]
      ) {
        Image.getSize(
          tileUrl(tile),
          (width, height) => {
            setTileSizes(prev => ({
              ...prev,
              [key]: { width, height },
            }));
          },
          error => {
            console.warn('Failed to load tile image size:', key, error);
          },
        );
      }
    });
  }, [visibleTiles]);

  return (
    <View
      style={{
        width: levelWidth,
        height: levelHeight,
        backgroundColor: '#e5e7eb',
      }}
    >
      {visibleTiles.map(img => {
        const key = `${img.z}-${img.x}-${img.y}`;
        const size = tileSizes[key] || { width: img.width, height: img.height };

        if (!size.width || !size.height) {
          return null;
        }

        return (
          <Image
            key={key}
            source={{ uri: tileUrl(img) }}
            style={{
              width: size.width,
              height: size.height,
              position: 'absolute',
              left: 0,
              top: 0,
              transform: [{ translateX: img.left }, { translateY: img.top }],
            }}
          />
        );
      })}
    </View>
  );
};
