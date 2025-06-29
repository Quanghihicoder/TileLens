import React, { useMemo } from "react";
import axios from "axios";
import { type RootState } from "../../app/store";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useImageMetadata } from "../../hooks/useImageMetadata";
import { useImage } from "../../hooks/useImage";
import { useAppSelector } from "../../hooks/useRedux";
import { shoelaceArea, isNear, type Point } from "../../utilities/math";
import { GridDisplay } from "../../components/GridDisplay";
import { ZoomControls } from "../../components/ZoomControls";
import { ClippingControls } from "../../components/ClippingControls";
import { ClippingOverlay } from "../../components/ClippingOverlay";
import { useOffset, type Offset } from "../../hooks/useOffset";

const MIN_TILE_LEVEL = 0;

const apiUrl = import.meta.env.VITE_API_URL;

const ViewPage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();

  // Get user ID from Redux or fallback to localStorage
  const reduxUserId = useAppSelector((state: RootState) => state.user.id);
  const userId =
    reduxUserId ?? JSON.parse(localStorage.getItem("user") || "{}").id;

  // Image meta data
  const { maxZoomLevel, imageWidth, imageHeight } = useImageMetadata(
    userId,
    imageId!
  );

  // State: zoom level
  const [zoom, setZoom] = useState(MIN_TILE_LEVEL);
  const [transitionZoom, setTransitionZoom] = useState<number | null>(null);
  const prevZoomRef = useRef(zoom);

  // Container Ref
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const windowContainerRef = useRef<HTMLDivElement>(null);

  // Panning state
  const draggingRef = useRef(false);
  const dragStartRef = useRef<Offset | null>(null);
  const offsetStartRef = useRef<Offset>({ x: 0, y: 0 });

  // Clipping state
  const [isClipping, setIsClipping] = useState(false);
  const [clippingPath, setClippingPath] = useState<Point[]>([]);
  const [isSendingClipping, setIsSendingClipping] = useState(false);

  // Image data
  const {
    levelWidth,
    levelHeight,
    maxNumberOfTilesX,
    maxNumberOfTilesY,
    maxNumberOfTilesXBefore,
    maxNumberOfTilesYBefore,
  } = useImage(imageWidth, imageHeight, zoom, prevZoomRef);

  // Check if the image at zoom level is bigger than the view port
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

  const { offset, clampOffset, prevOffsetRef, setOffset } = useOffset(
    levelWidth,
    levelHeight,
    zoom,
    maxNumberOfTilesX,
    maxNumberOfTilesY,
    maxNumberOfTilesXBefore,
    maxNumberOfTilesYBefore,
    widthOverflow,
    heightOverflow,
    windowContainerRef,
    prevZoomRef
  );

  const calculateMousePosition = useCallback(
    (e: React.MouseEvent) => {
      const windowContainer = windowContainerRef.current;
      const tilesContainer = tilesContainerRef.current;
      if (!windowContainer) return;
      if (!tilesContainer) return;

      let x = 0;
      let y = 0;

      if (widthOverflow) {
        x =
          e.clientX -
          windowContainer.getBoundingClientRect().left +
          Math.abs(offset.x);
      } else {
        x = e.clientX - tilesContainer.getBoundingClientRect().left;
      }

      if (heightOverflow) {
        y =
          e.clientY -
          windowContainer.getBoundingClientRect().top +
          Math.abs(offset.y);
      } else {
        y = e.clientY - tilesContainer.getBoundingClientRect().top;
      }

      x = Math.floor(Math.min(Math.max(0, x), levelWidth));
      y = Math.floor(Math.min(Math.max(0, y), levelHeight));

      return { x, y };
    },
    [levelWidth, levelHeight, widthOverflow, heightOverflow, offset]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    if (isSendingClipping) return;

    draggingRef.current = true;

    if (isClipping) {
      const position = calculateMousePosition(e);
      if (position) {
        if (clippingPath.length == 0) {
          setClippingPath((prev) => [...prev, position]);
        } else {
          const last = clippingPath[clippingPath.length - 1];
          if (!isNear(last, position)) {
            draggingRef.current = false;
            alert(
              "The starting point of the next line should be near the end of the previous line."
            );
          }
        }
      }
    } else {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      offsetStartRef.current = { ...offset };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !dragStartRef.current) return;
    if (isClipping) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newOffsetX = offsetStartRef.current.x + dx;
    const newOffsetY = offsetStartRef.current.y + dy;

    const clamped = clampOffset(newOffsetX, newOffsetY);

    prevOffsetRef.current = clamped;
    setOffset(clamped);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isClipping) {
      const position = calculateMousePosition(e);
      if (position) {
        setClippingPath((prev) => [...prev, position]);
      }
      draggingRef.current = false;
    } else {
      draggingRef.current = false;
      dragStartRef.current = null;
    }
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    if (isClipping && draggingRef.current) {
      const position = calculateMousePosition(e);

      if (position) {
        setClippingPath((prev) => [...prev, position]);
      }
      draggingRef.current = false;
    } else {
      draggingRef.current = false;
      dragStartRef.current = null;
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (isClipping) {
        alert("Can't zoom while clipping.");
        return;
      }

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
    [zoom, maxZoomLevel, isClipping]
  );

  const clipImage = async () => {
    if (clippingPath.length < 3) {
      alert("Invalid clipping shape");
      return;
    }

    setIsSendingClipping(true);

    try {
      const response = await axios.post(
        `${apiUrl}/image/clip`,
        {
          imageId: imageId,
          width: levelWidth,
          height: levelHeight,
          paths: clippingPath,
        },
        {
          withCredentials: true,
        }
      );

      if (response) {
        alert("Clip request sent successfully. Image will be in my images.");
      }
    } catch (err) {
      console.error("Error clipping image:", err);
    } finally {
      setIsSendingClipping(false);
      setClippingPath([]);
      setIsClipping(!isClipping);
    }
  };

  // On Load
  useEffect(() => {
    if (!userId || !imageId) {
      navigate("/");
      return;
    }
  }, [userId, imageId, navigate]);

  // Setup wheel event listener and handle zoom changes
  useEffect(() => {
    const tilesContainer = windowContainerRef.current;
    if (!tilesContainer) return;

    tilesContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      tilesContainer.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <>
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-full w-full max-w-[85vw] max-h-[90vh] z-10 ">
            {isClipping && (
              <div className="absolute text-sm bg-blue-100 p-1 rounded-full z-10 ">
                A total of {shoelaceArea(clippingPath)} pixels selected.
              </div>
            )}

            <div
              ref={windowContainerRef}
              className={`h-full w-full overflow-hidden select-none no-scrollbar ${
                !widthOverflow && "flex justify-center"
              } ${!heightOverflow && "flex items-center"} `}
            >
              <div
                ref={tilesContainerRef}
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
                <ClippingOverlay clippingPath={clippingPath} />
                <GridDisplay
                  userId={userId}
                  imageId={imageId!}
                  levelWidth={levelWidth}
                  levelHeight={levelHeight}
                  zoom={zoom}
                  offset={offset}
                  containerRef={windowContainerRef}
                />
              </div>
            </div>
          </div>

          {/* Clipping Buttons */}
          <ClippingControls
            isClipping={isClipping}
            isSendingClipping={isSendingClipping}
            onClip={async () => {
              await clipImage();
            }}
            onToggleClipping={() => {
              setClippingPath([]);
              setIsClipping(!isClipping);
            }}
          />

          {/* Zoom Buttons */}
          <ZoomControls
            isClipping={isClipping}
            onZoomIn={() => {
              if (zoom < maxZoomLevel) {
                setTransitionZoom(zoom + 1);
                setTimeout(() => setZoom(zoom + 1), 100);
              }
            }}
            onZoomOut={() => {
              if (zoom > MIN_TILE_LEVEL) {
                setTransitionZoom(zoom - 1);
                setTimeout(() => setZoom(zoom - 1), 100);
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ViewPage;
