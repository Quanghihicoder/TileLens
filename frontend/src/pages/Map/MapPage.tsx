import { Viewer, Entity, type CesiumComponentRef } from "resium";
import { Cartesian3, Viewer as CesiumViewer } from "cesium";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../hooks/useRedux";
import { type RootState } from "../../app/store";
import { type ImageData } from "../../types";
import { useNotification } from "../../providers/Notification";
import { useNavigate } from "react-router-dom";

const environment = import.meta.env.VITE_ENV;
const apiUrl = import.meta.env.VITE_API_URL;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

const Map = () => {
  const showNotification = useNotification();
  const navigate = useNavigate();

  const reduxUserId = useAppSelector((state: RootState) => state.user.id);
  const userId =
    reduxUserId ?? JSON.parse(localStorage.getItem("user") || "{}").id;

  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);

  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Cartesian3[]>([]);
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement[]>([]);

  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const createPaddedImageWithUrl = (
    url: string,
    size: number = 40,
    padding: number = 4,
    triangleHeight: number = 8,
    triangleWidth: number = 12,
    backgroundColor: string = "#FFFFFF"
  ): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const totalWidth = size + 2 * padding;
      const totalHeight = size + padding * 2 + triangleHeight;

      const canvas = document.createElement("canvas");
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not available");

      // Load the image
      const img = new Image();
      img.crossOrigin =
        environment === "development" ? "use-credentials" : "anonymous";

      img.onload = () => {
        // Fill background (padding)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight - triangleHeight);

        // Draw image centered with padding
        ctx.drawImage(img, padding, padding, size, size);

        // Draw triangle at bottom center
        const centerX = totalWidth / 2;
        const triangleTopY = totalHeight - triangleHeight;
        const triangleBottomY = totalHeight;

        ctx.beginPath();
        ctx.moveTo(centerX - triangleWidth / 2, triangleTopY);
        ctx.lineTo(centerX + triangleWidth / 2, triangleTopY);
        ctx.lineTo(centerX, triangleBottomY);
        ctx.closePath();

        ctx.fillStyle = backgroundColor;
        ctx.fill();

        resolve(canvas);
      };

      img.onerror = reject;
      img.src = url;
    });
  };

  const imgUrl = (userId: string, imageId: string, imageType: string): string =>
    `${assetsUrl}/images/${userId}/${imageId}.${imageType}`;

  const handleEntityClick = (imageIndex: number) => {
    setSelectedImage(imageIndex);
  };

  useEffect(() => {
    if (!userId) {
      showNotification("User not found");
      return;
    }

    const fetchAndCompareImages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/image/${userId}`, {
          withCredentials: true,
        });

        const newImages = [...(response?.data?.images || [])].sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        if (newImages && JSON.stringify(newImages) !== JSON.stringify(images)) {
          setImages(newImages);
        }
      } catch {
        showNotification("Failed to fetch images");
      }
    };

    fetchAndCompareImages();
  }, [userId]);

  useEffect(() => {
    setPositions(
      new Array(images.length)
        .fill(0)
        .map(() =>
          Cartesian3.fromDegrees(
            Math.random() * 360 - 180,
            Math.random() * 180 - 90,
            100
          )
        )
    );

    (async () => {
      const canvasArray = await Promise.all(
        images.map((img) =>
          createPaddedImageWithUrl(
            imgUrl(userId, img.imageId, img.imageType),
            50,
            4,
            10,
            10,
            "#FFFFFF"
          )
        )
      );

      setImageCanvas(canvasArray);
    })();
  }, [images]);

  return (
    <div className="w-screen flex justify-center items-center bg-black">
      {selectedImage != null && (
        <div className="h-1/3 w-1/3 z-50 bg-amber-300 absolute rounded flex justify-center items-center">
          <div
            className="absolute top-2 right-6 p-2 bg-white rounded"
            onClick={() => {
              setSelectedImage(null);
            }}
          >
            <p>X</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-6 gap-5">
            <img
              src={imgUrl(
                userId,
                images[selectedImage].imageId,
                images[selectedImage].imageType
              )}
              alt={`Preview of ${images[selectedImage].imageOriginalName}`}
              crossOrigin={
                environment === "development" ? "use-credentials" : "anonymous"
              }
              className="w-full sm:w-40 max-h-64 object-contain rounded-md mb-4 sm:mb-0 sm:mr-6"
            />

            <div className="mb-4 sm:mb-0 sm:flex-1 w-full">
              <p className="text-gray-700">
                <span className="font-semibold">Image ID:</span>{" "}
                {images[selectedImage].imageId}
              </p>
              <p className="text-gray-700 w-60">
                <span className="font-semibold">Original Name:</span>{" "}
                {images[selectedImage].imageOriginalName}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Type:</span>{" "}
                {images[selectedImage].imageType}
              </p>
            </div>
            <div className="w-full sm:w-auto flex justify-center sm:justify-start space-x-0 sm:space-x-3">
              {images[selectedImage].processing ? (
                <span className="inline-block text-sm font-medium text-gray-600 bg-gray-100 px-4 py-1 rounded-full text-center w-full sm:w-auto">
                  Processing...
                </span>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 border-1 border-blue-600 px-5 py-1.5 rounded-full shadow w-full sm:w-auto"
                    onClick={() =>
                      navigate(`/image/view/${images[selectedImage].imageId}`)
                    }
                  >
                    View
                  </button>

                  <button
                    className="text-sm font-medium text-black px-5 py-1.5 border-1 rounded-full shadow w-full sm:w-auto  active:scale-95 transition-transform bg-white"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        images[selectedImage].imageId
                      );
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Viewer
        ref={viewerRef}
        className="h-full"
        fullscreenButton={false}
        homeButton={false}
        timeline={false}
        sceneMode={2}
        sceneModePicker={false}
        baseLayerPicker={false}
        selectionIndicator={false}
        infoBox={false}
        shouldAnimate={true}
      >
        {imageCanvas.map((canvas, i) => {
          return (
            <Entity
              id={`${i}`}
              name={`${i}`}
              key={i}
              position={positions[i]}
              billboard={{
                show: true,
                image: canvas,
                width: 58,
                height: 68,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              }}
              onClick={() => {
                handleEntityClick(i);
              }}
            />
          );
        })}
      </Viewer>
    </div>
  );
};

export default Map;
