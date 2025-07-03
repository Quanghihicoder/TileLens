import { useTiles } from "../hooks/useTiles";
import { type RefObject } from "react";
import { type Offset, type TileCoords } from "../types";

const environment = import.meta.env.VITE_ENV;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

// GridDisplay component to show both transitioning and visible tiles
export const GridDisplay = ({
  userId,
  imageId,
  levelWidth,
  levelHeight,
  zoom,
  offset,
  containerRef,
}: {
  userId: string;
  imageId: string;
  levelWidth: number;
  levelHeight: number;
  zoom: number;
  offset: Offset;
  containerRef: RefObject<HTMLDivElement | null>;
}) => {
  const { visibleTiles } = useTiles(
    levelWidth,
    levelHeight,
    zoom,
    offset,
    containerRef
  );

  // Tile URL generator function
  const tileUrl = ({ z, x, y }: TileCoords): string =>
    `${assetsUrl}/tiles/${userId}/${imageId}/${z}/${x}/${y}.png`;

  return (
    <div
      style={{ width: `${levelWidth}px`, height: `${levelHeight}px` }}
      className="bg-gray-200"
    >
      {visibleTiles.map((img) => (
        <img
          key={`${img.z}-${img.x}-${img.y}`}
          src={tileUrl(img)}
          alt={`Tile ${img.z}-${img.x}-${img.y}`}
          width={img.width}
          height={img.height}
          draggable={false}
          className="absolute transition-opacity duration-200"
          style={{
            transform: `translate3d(${img.left}px, ${img.top}px, 0)`,
            left: 0,
            top: 0,
            position: "absolute",
            opacity: 1,
          }}
          crossOrigin={
            environment === "development" ? "use-credentials" : undefined
          }
        />
      ))}
    </div>
  );
};
