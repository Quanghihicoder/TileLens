import React, { useMemo } from "react";
import axios from "axios";
import { type RootState } from "../../app/store";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useImageMetadata } from "../../hooks/useImageMetadata";
import { useImage } from "../../hooks/useImage";
import { useAppSelector } from "../../hooks/useRedux";
import {
  shoelaceArea,
  isNear,
  calculateRelativeImageSize,
  generateCirclePoints,
  floorPoints,
  floorImages,
  resizeImage,
} from "../../utilities/math";
import { GridDisplay } from "../../components/GridDisplay";
import { ZoomControls } from "../../components/ZoomControls";
import { ClippingControls } from "../../components/ClippingControls";
import { ClippingOverlay } from "../../components/ClippingOverlay";
import { useOffset } from "../../hooks/useOffset";
import { BlendingControls } from "../../components/BlendingControls";
import {
  type Offset,
  type Point,
  type PastedImage,
  type ImageHandler,
} from "../../types";
import { BlendingOverlay } from "../../components/BlendingOverlay";

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
  const [isEditClipping, setIsEditClipping] = useState(false);
  const [editPointIndex, setEditPointIndex] = useState<number | null>(null);
  const [isGenerateCircle, setIsGenerateCircle] = useState(false);
  const draggingPointRef = useRef(false);
  const [isSendingClipping, setIsSendingClipping] = useState(false);

  // Blending state
  const [isHovered, setIsHovered] = useState(false);
  const [isSendingBlending, setIsSendingBlending] = useState(false);
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [editImageIndex, setEditImageIndex] = useState<number | null>(null);
  const [editDirectionIndex, setEditDirectionIndex] = useState<number | null>(
    null
  );
  const isResizeImageRef = useRef(false);

  // Image data
  const {
    levelWidth,
    levelHeight,
    levelWidthBefore,
    levelHeightBefore,
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

  const pastedImageBaseSize = useMemo(() => {
    const windowContainer = windowContainerRef.current;
    if (!windowContainer)
      return Math.floor(Math.min(levelWidth, levelHeight) / 2);

    return Math.floor(
      Math.min(
        Math.min(levelWidth, windowContainer.clientWidth),
        Math.min(levelHeight, windowContainer.clientHeight)
      ) / 2
    );
  }, [zoom, levelWidth, levelHeight]);

  const handles: ImageHandler[] = useMemo(() => {
    if (editImageIndex != null && pastedImages.length > 0) {
      const image = pastedImages[editImageIndex];
      return [
        {
          directionIndex: 0,
          cursor: "nwse-resize",
          left: image.left,
          top: image.top,
        }, // top-left
        {
          directionIndex: 1,
          cursor: "ns-resize",
          left: image.left + image.width / 2,
          top: image.top,
        }, // top-center
        {
          directionIndex: 2,
          cursor: "nesw-resize",
          left: image.left + image.width,
          top: image.top,
        }, // top-right
        {
          directionIndex: 3,
          cursor: "ew-resize",
          left: image.left,
          top: image.top + image.height / 2,
        }, // mid-left
        {
          directionIndex: 4,
          cursor: "move",
          left: image.left + image.width / 2,
          top: image.top + image.height / 2,
        }, // center
        {
          directionIndex: 5,
          cursor: "ew-resize",
          left: image.left + image.width,
          top: image.top + image.height / 2,
        }, // mid-right
        {
          directionIndex: 6,
          cursor: "nesw-resize",
          left: image.left,
          top: image.top + image.height,
        }, // bottom-left
        {
          directionIndex: 7,
          cursor: "ns-resize",
          left: image.left + image.width / 2,
          top: image.top + image.height,
        }, // bottom-center
        {
          directionIndex: 8,
          cursor: "nwse-resize",
          left: image.left + image.width,
          top: image.top + image.height,
        }, // bottom-right
      ];
    }
    return [];
  }, [editImageIndex, pastedImages]);

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

  const onLineBreak = (e: React.MouseEvent, index: number) => {
    const position = calculateMousePosition(e);
    if (position) {
      setClippingPath((prev) => {
        const newPath = [...prev];
        newPath.splice(index + 1, 0, position);
        return newPath;
      });

      if (editPointIndex != null) {
        if (editPointIndex > index) {
          const newEditIndex = editPointIndex + 1;
          setEditPointIndex(newEditIndex);
        }
      }
    }
  };

  const resetDragRef = () => {
    draggingPointRef.current = false;
    isResizeImageRef.current = false;
    draggingRef.current = false;
    dragStartRef.current = null;
  };

  const onMouseEnter = () => {
    setIsHovered(true);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isSendingClipping) return;

    const position = calculateMousePosition(e);
    if (position) {
      if (isGenerateCircle) {
        setClippingPath(
          generateCirclePoints(
            position,
            pastedImageBaseSize,
            pastedImageBaseSize,
            levelWidth,
            levelHeight,
            72
          )
        );
        return;
      }

      draggingRef.current = true;

      if (isClipping && !isEditClipping) {
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
      } else {
        if (
          editPointIndex != null &&
          isNear(clippingPath[editPointIndex], position)
        ) {
          draggingPointRef.current = true;
        }

        if (
          editImageIndex != null &&
          editDirectionIndex != null &&
          isNear(
            {
              x: handles[editDirectionIndex].left,
              y: handles[editDirectionIndex].top,
            },
            position
          )
        ) {
          isResizeImageRef.current = true;
        }
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        offsetStartRef.current = { ...offset };
      }
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const position = calculateMousePosition(e);
    if (position) {
      mousePositionRef.current = position;
    }

    if (!draggingRef.current || !dragStartRef.current) return;
    if (isClipping && !isEditClipping) return;
    if (draggingPointRef.current) return;
    if (editImageIndex != null && editDirectionIndex != null) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newOffsetX = offsetStartRef.current.x + dx;
    const newOffsetY = offsetStartRef.current.y + dy;
    const clamped = clampOffset(newOffsetX, newOffsetY);
    prevOffsetRef.current = clamped;
    setOffset(clamped);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isGenerateCircle) {
      setIsGenerateCircle(false);
      return;
    }

    const position = calculateMousePosition(e);
    if (position) {
      if (isClipping && !isEditClipping) {
        setClippingPath((prev) => [...prev, position]);
      }

      if (draggingPointRef.current && editPointIndex != null) {
        const updated = [...clippingPath];
        updated[editPointIndex] = position;
        setClippingPath(updated);
      }

      if (
        isResizeImageRef.current &&
        editImageIndex != null &&
        editDirectionIndex != null
      ) {
        const resized = resizeImage(
          pastedImages[editImageIndex],
          position,
          editDirectionIndex
        );
        const updated = [...pastedImages];
        updated[editImageIndex] = {
          width: resized.width,
          height: resized.height,
          left: resized.left,
          top: resized.top,
          imageId: updated[editImageIndex].imageId,
          imageType: updated[editImageIndex].imageType,
        };
        setPastedImages(updated);
      }
    }

    resetDragRef();
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    setIsHovered(false);
    const position = calculateMousePosition(e);

    if (position) {
      if (isClipping && draggingRef.current && !isEditClipping) {
        setClippingPath((prev) => [...prev, position]);
      }

      if (
        draggingPointRef.current &&
        editPointIndex != null &&
        draggingRef.current
      ) {
        if (position) {
          const updated = [...clippingPath];
          updated[editPointIndex] = position;
          setClippingPath(updated);
        }
      }

      if (
        isResizeImageRef.current &&
        editImageIndex != null &&
        editDirectionIndex != null
      ) {
        const resized = resizeImage(
          pastedImages[editImageIndex],
          position,
          editDirectionIndex
        );
        const updated = [...pastedImages];
        updated[editImageIndex] = {
          width: resized.width,
          height: resized.height,
          left: resized.left,
          top: resized.top,
          imageId: updated[editImageIndex].imageId,
          imageType: updated[editImageIndex].imageType,
        };
        setPastedImages(updated);
      }
    }

    resetDragRef();
  };

  const onDoubleClick = () => {
    if (editImageIndex != null) {
      setEditImageIndex(null);
      setEditDirectionIndex(null);
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // if (isClipping) {
      //   alert("Can't zoom while clipping.");
      //   return;
      // }

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

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (pastedImages.length == 20) {
      alert(
        "You can only paste maximum 20 images. Save the image and then continue paste from there."
      );
      return;
    }

    try {
      const pastedText = e.clipboardData.getData("text/plain");
      const nanoidRegex = /^[A-Za-z0-9_-]{21}$/;

      if (nanoidRegex.test(pastedText)) {
        await getImage(pastedText);
      } else {
        alert("Invalid image to paste");
      }
    } catch (error) {
      console.error("Error reading clipboard data:", error);
    }
  };

  const getImage = async (pastedImageId: string) => {
    try {
      const response = await axios.get(
        `${apiUrl}/image/${userId}/${pastedImageId}`,
        {
          withCredentials: true,
        }
      );

      if (response) {
        if (!response.data.image.processing) {
          const relativeSize = calculateRelativeImageSize(
            pastedImageBaseSize,
            Number(response.data.image.width),
            Number(response.data.image.height)
          );

          // Need to ceil because sharp can't process float
          const pastedImage: PastedImage = {
            width: relativeSize.width,
            height: relativeSize.height,
            left: mousePositionRef.current!.x - relativeSize.width / 2,
            top: mousePositionRef.current!.y - relativeSize.height / 2,
            imageId: pastedImageId,
            imageType: response.data.image.imageType,
          };

          setPastedImages((prevImages) => [...prevImages, pastedImage]);
        } else {
          alert("Invalid image to paste");
        }
      }
    } catch (err) {
      console.error("Error pasting image:", err);
      alert("Invalid image to paste");
    }
  };

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
          paths: floorPoints(clippingPath),
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

  const blendImage = async () => {
    if (pastedImages.length == 0) {
      alert("Invalid blend");
      return;
    }

    setIsSendingBlending(true);

    try {
      const response = await axios.post(
        `${apiUrl}/image/blend`,
        {
          imageId: imageId,
          width: levelWidth,
          height: levelHeight,
          pastedImages: floorImages(pastedImages),
        },
        {
          withCredentials: true,
        }
      );

      if (response) {
        alert("Blend request sent successfully. Image will be in my images.");
      }
    } catch (err) {
      console.error("Error blending image:", err);
    } finally {
      setIsSendingBlending(false);
      setPastedImages([]);
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

  useEffect(() => {
    let newClippingPath: Point[] = [];

    for (let i = 0; i < clippingPath.length; i++) {
      let point = clippingPath[i];

      if (levelWidthBefore) {
        point.x = (point.x / levelWidthBefore) * levelWidth;
      }

      if (levelHeightBefore) {
        point.y = (point.y / levelHeightBefore) * levelHeight;
      }

      newClippingPath.push(point);
    }

    setClippingPath(newClippingPath);

    let newPastedImages: PastedImage[] = [];

    for (let i = 0; i < pastedImages.length; i++) {
      let image = pastedImages[i];

      if (levelWidthBefore) {
        image.width = (image.width / levelWidthBefore) * levelWidth;
        image.left = (image.left / levelWidthBefore) * levelWidth;
      }

      if (levelHeightBefore) {
        image.height = (image.height / levelHeightBefore) * levelHeight;
        image.top = (image.top / levelHeightBefore) * levelHeight;
      }

      newPastedImages.push(image);
    }

    setPastedImages(newPastedImages);
  }, [zoom]);

  return (
    <>
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-full w-full max-w-[85vw] max-h-[90vh] z-10">
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
                  cursor: (() => {
                    if (!isClipping || isEditClipping) {
                      return draggingRef.current ? "grabbing" : "grab";
                    }
                    return "crosshair";
                  })(),
                  transform: `translate(${offset.x}px, ${offset.y}px) ${
                    transitionZoom !== null
                      ? `scale(${Math.pow(2, zoom - transitionZoom)})`
                      : "scale(1)"
                  }`,
                }}
                onTransitionEnd={() => setTransitionZoom(null)}
                onMouseEnter={onMouseEnter}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onPaste={isHovered && !isClipping ? handlePaste : undefined}
                onDoubleClick={onDoubleClick}
                tabIndex={0}
              >
                <BlendingOverlay
                  images={pastedImages}
                  handles={handles}
                  userId={userId}
                  editImageIndex={editImageIndex}
                  setEditImageIndex={setEditImageIndex}
                  editDirectionIndex={editDirectionIndex}
                  setEditDirectionIndex={setEditDirectionIndex}
                />
                <ClippingOverlay
                  clippingPath={clippingPath}
                  editPointIndex={editPointIndex}
                  isEditClipping={isEditClipping}
                  onLineBreak={onLineBreak}
                  setEditPointIndex={setEditPointIndex}
                />
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

          {/* Blending Buttons */}
          {pastedImages.length > 0 && (
            <BlendingControls
              isSendingBlending={isSendingBlending}
              onBlend={async () => {
                await blendImage();
                setEditImageIndex(null);
                setEditDirectionIndex(null);
              }}
              onToggleBlending={() => {
                setPastedImages([]);
                setEditImageIndex(null);
                setEditDirectionIndex(null);
              }}
            />
          )}

          {/* Clipping Buttons */}
          {pastedImages.length == 0 && (
            <ClippingControls
              isClipping={isClipping}
              isEditClipping={isEditClipping}
              isSendingClipping={isSendingClipping}
              isGenerateCircle={isGenerateCircle}
              onClip={async () => {
                await clipImage();
                setIsEditClipping(false);
                setEditPointIndex(null);
              }}
              onToggleClipping={() => {
                setClippingPath([]);
                setIsClipping(!isClipping);
                setIsEditClipping(false);
                setEditPointIndex(null);
              }}
              onToggleEdit={() => {
                setIsEditClipping(!isEditClipping);
                setEditPointIndex(null);
              }}
              onGenerateCircle={() => {
                setIsGenerateCircle(true);
              }}
            />
          )}

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
