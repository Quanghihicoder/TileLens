import React, { useMemo } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { type RootState } from "../../app/store";

type TileCoords = {
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number | undefined;
  height: number | undefined;
};

type Offset = {
  x: number;
  y: number;
};

const TILE_SIZE = 256;
const MIN_TILE_LEVEL = 0;
const BUFFER = 2;

const apiUrl = import.meta.env.VITE_API_URL;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

const ViewPage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();

  // Get user ID from Redux or fallback to localStorage
  const reduxUserId = useSelector((state: RootState) => state.user.id);
  const userId =
    reduxUserId ?? JSON.parse(localStorage.getItem("user") || "{}").id;

  // State for image data
  const [maxZoomLevel, setMaxZoomLevel] = useState<number>(0);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  // State: zoom level
  const [zoom, setZoom] = useState(MIN_TILE_LEVEL);
  const [transitionZoom, setTransitionZoom] = useState<number | null>(null);
  const prevZoomRef = useRef(zoom);

  // Calculate visible tiles
  const [visibleTiles, setVisibleTiles] = useState<TileCoords[]>([]);
  const [isTilesOverflow, setIsTilesOverflow] = useState({
    x: false,
    y: false,
  });
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const windowContainerRef = useRef<HTMLDivElement>(null);

  // Panning state
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef<Offset | null>(null);
  const offsetStartRef = useRef<Offset>({ x: 0, y: 0 });
  const prevOffsetRef = useRef<Offset>({ x: 0, y: 0 });

  const getNumberOfLevelsForImage = useCallback(
    (width: number, height: number) => {
      const maxDimension = Math.max(width, height);
      return Math.ceil(1 + Math.log10(maxDimension));
    },
    []
  );

  const levelMaxDimension = useMemo(() => {
    return Math.ceil(
      Math.max(imageWidth, imageHeight) /
        2 ** (getNumberOfLevelsForImage(imageWidth, imageHeight) - 1 - zoom)
    );
  }, [imageWidth, imageHeight, zoom, getNumberOfLevelsForImage]);

  const levelMaxDimensionBefore = useMemo(() => {
    const prevZoom = prevZoomRef.current;
    if (prevZoom === zoom) return null;
    return Math.ceil(
      Math.max(imageWidth, imageHeight) /
        2 ** (getNumberOfLevelsForImage(imageWidth, imageHeight) - 1 - prevZoom)
    );
  }, [imageWidth, imageHeight, zoom, getNumberOfLevelsForImage]);

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

  const overlaySpaceX = useMemo(() => {
    return (maxNumberOfTilesX + 1) * TILE_SIZE - levelWidth;
  }, [maxNumberOfTilesX, levelWidth]);

  const overlaySpaceY = useMemo(() => {
    return (maxNumberOfTilesY + 1) * TILE_SIZE - levelHeight;
  }, [maxNumberOfTilesY, levelHeight]);

  const widthOverflow = useMemo(() => {
    const windowContainer = windowContainerRef.current;
    if (!windowContainer) return false;

    return levelWidth > windowContainer.clientWidth;
  }, [levelWidth]);

  const heightOverflow = useMemo(() => {
    const windowContainer = windowContainerRef.current;
    if (!windowContainer) return false;

    return levelHeight > windowContainer.clientHeight;
  }, [levelHeight]);

  // Tile URL generator function
  const tileUrl = useCallback(
    ({ z, x, y }: TileCoords): string =>
      `${assetsUrl}/tiles/${userId}/${imageId}/${z}/${x}/${y}.png`,
    [userId, imageId]
  );

  // Calculate the visible area in tile coordinates
  const calculateVisibleArea = useCallback(() => {
    const tilesContainer = tilesContainerRef.current;
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
    const tilesContainer = tilesContainerRef.current;
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
            if (x == maxNumberOfTilesX) {
              left = x * TILE_SIZE - overlaySpaceX;
            }
          }

          if (levelHeight > TILE_SIZE && levelWidth < TILE_SIZE) {
            if (y == maxNumberOfTilesY) {
              top = y * TILE_SIZE - overlaySpaceY;
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

  const clampOffset = useCallback(
    (x: number, y: number) => {
      const tilesContainer = tilesContainerRef.current;
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

  const calculateOffsetAfterZoom = useCallback((): Offset | null => {
    const tilesContainer = tilesContainerRef.current;
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
      (centerX - prevOffsetRef.current.x) / (maxNumberOfTilesXBefore + 1);
    const worldY =
      (centerY - prevOffsetRef.current.y) / (maxNumberOfTilesYBefore + 1);

    const newOffsetX = centerX - worldX * (maxNumberOfTilesX + 1);
    const newOffsetY = centerY - worldY * (maxNumberOfTilesY + 1);

    return { x: newOffsetX, y: newOffsetY };
  }, [zoom]);

  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newOffsetX = offsetStartRef.current.x + dx;
    const newOffsetY = offsetStartRef.current.y + dy;

    const clamped = clampOffset(newOffsetX, newOffsetY);

    prevOffsetRef.current = clamped;
    setOffset(clamped);

    // setVisibleTiles(calculateVisibleTiles());
  };

  const onMouseUp = () => {
    draggingRef.current = false;
    dragStartRef.current = null;

    // setVisibleTiles(calculateVisibleTiles());
  };

  const onMouseLeave = () => {
    draggingRef.current = false;
    dragStartRef.current = null;
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = Math.sign(e.deltaY);
      let newZoom = zoom;

      if (delta > 0 && zoom > MIN_TILE_LEVEL) {
        newZoom = zoom - 1;
      } else if (delta < 0 && zoom < maxZoomLevel) {
        newZoom = zoom + 1;
      }

      if (newZoom !== zoom) {
        setTransitionZoom(newZoom);
        setTimeout(() => setZoom(newZoom), 100);
      }
    },
    [zoom, maxZoomLevel]
  );

  // On Load
  useEffect(() => {
    if (!userId || !imageId) {
      navigate("/");
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/image/${userId}/${imageId}`,
          {
            withCredentials: true,
          }
        );

        if (response.data?.image) {
          const { image } = response.data;

          if (image.processing) {
            navigate("/");
            return;
          }
          setMaxZoomLevel(image.maxZoomLevel - 1);
          setImageWidth(image.width);
          setImageHeight(image.height);
        }
      } catch (err) {
        console.error("Error fetching image:", err);
      }
    };

    fetchImage();
  }, [userId, imageId, navigate]);

  // Update visible tiles when zoom
  useEffect(() => {
    setVisibleTiles(calculateVisibleTiles());
  }, [zoom, calculateVisibleTiles]);

  // Setup wheel event listener and handle zoom changes
  useEffect(() => {
    const tilesContainer = tilesContainerRef.current;
    if (!tilesContainer) return;

    tilesContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      tilesContainer.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (!widthOverflow || !heightOverflow) {
      setOffset({ x: 0, y: 0 });
    } else {
      const calculatedOffset = calculateOffsetAfterZoom();
      if (calculatedOffset) {
        const clamped = clampOffset(calculatedOffset.x, calculatedOffset.y);

        prevOffsetRef.current = clamped;
        setOffset(clamped);
      }
    }

    setIsTilesOverflow({ x: widthOverflow, y: heightOverflow });

    prevZoomRef.current = zoom;
  }, [zoom]);

  // GridDisplay component to show both transitioning and visible tiles
  const GridDisplay = ({
    data,
  }: {
    data: TileCoords[];
  }) => {
    return (
      <div style={{ width: levelWidth, height: levelHeight }}>
        {data.map((img) => (
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
            crossOrigin="use-credentials"
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="h-full w-full flex items-center justify-center">
          <div
            ref={windowContainerRef}
            className="h-full w-full max-w-[85vw] max-h-[90vh]"
          >
            <div
              ref={tilesContainerRef}
              className={`h-full w-full overflow-hidden select-none no-scrollbar ${
                !isTilesOverflow.x && "flex justify-center"
              } ${!isTilesOverflow.y && "flex items-center"} `}
            >
              <div
                className="transition-transform duration-100 ease-in-out"
                style={{
                  cursor: draggingRef.current ? "grabbing" : "grab",
                  transform: `translate(${offset.x}px, ${offset.y}px) ${
                    transitionZoom !== null
                      ? `scale(${Math.pow(2, zoom - transitionZoom)})`
                      : "scale(1)"
                  }`,
                }}
                onTransitionEnd={() => setTransitionZoom(null)}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
              >
                <GridDisplay
                  data={visibleTiles}
                />
              </div>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-2 p-2 rounded-2xl bg-blue-600">
            <button
              className="w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => {
                if (zoom < maxZoomLevel) {
                  setTransitionZoom(zoom + 1);
                  setTimeout(() => setZoom(zoom + 1), 100);
                }
              }}
            >
              +
            </button>
            <button
              className="w-9 h-9 rounded-full bg-white text-gray-800 shadow-md border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => {
                if (zoom > MIN_TILE_LEVEL) {
                  setTransitionZoom(zoom - 1);
                  setTimeout(() => setZoom(zoom - 1), 100);
                }
              }}
            >
              −
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPage;
