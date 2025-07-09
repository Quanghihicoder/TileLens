import { useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useTiles } from "../hooks/useTiles";
import { type RefObject } from "react";
import { type Offset, type TileCoords } from "../types";

const environment = import.meta.env.VITE_ENV;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

function useCombinedTileTexture({
  userId,
  imageId,
  visibleTiles,
  levelWidth,
  levelHeight,
}: {
  userId: string;
  imageId: string;
  visibleTiles: TileCoords[];
  levelWidth: number;
  levelHeight: number;
}) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  // Tile URL generator function
  const tileUrl = ({ z, x, y }: TileCoords): string =>
    `${assetsUrl}/tiles/${userId}/${imageId}/${z}/${x}/${y}.png`;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = levelWidth;
    canvas.height = levelHeight;
    const ctx = canvas.getContext("2d");

    if (ctx == null) return;

    let loaded = 0;
    const total = visibleTiles.length;

    visibleTiles.forEach((tile) => {
      const img = new Image();
      img.crossOrigin =
        environment === "development" ? "use-credentials" : "anonymous";
      img.src = tileUrl(tile);

      img.onload = () => {
        if (tile.width != undefined && tile.height != undefined) {
          ctx.drawImage(img, tile.left, tile.top, tile.width, tile.height);
        } else {
          ctx.drawImage(img, tile.left, tile.top);
        }
        loaded++;
        if (loaded === total) {
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          setTexture(texture);
        }
      };
    });
  }, [visibleTiles, levelWidth, levelHeight]);

  return texture;
}

function TexturedTileBox({
  texture,
  boxWidth,
  boxHeight,
  boxDepth,
}: {
  texture: THREE.CanvasTexture;
  boxWidth: number;
  boxHeight: number;
  boxDepth: number;
}) {
  return (
    <mesh>
      <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
      <meshBasicMaterial map={texture} transparent={true} toneMapped={false} />
    </mesh>
  );
}

export const BoxDisplay = ({
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

  const texture = useCombinedTileTexture({
    userId,
    imageId,
    visibleTiles,
    levelWidth,
    levelHeight,
  });

  // Scale 2D dimensions into 3D world units
  const scale = 3 / Math.max(levelWidth, levelHeight);
  const boxW = levelWidth > levelHeight ? 3 : levelWidth * scale;
  const boxH = levelHeight > levelWidth ? 3 : levelHeight * scale;
  const boxD = 3;

  return (
    <div style={{ width: levelWidth, height: levelHeight }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          {texture && (
            <TexturedTileBox
              texture={texture}
              boxWidth={boxW}
              boxHeight={boxH}
              boxDepth={boxD}
            />
          )}
        </Suspense>
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
};
