import React from "react";
import { type ImageHandler, type PastedImage } from "../types";

const assetsUrl = import.meta.env.VITE_ASSETS_URL;
const HANDLE_SIZE = 10;

interface BlendingOverlayProps {
  images: PastedImage[];
  handles: ImageHandler[];
  userId: number;
  editImageIndex: number | null;
  setEditImageIndex: (index: number) => void;
  editDirectionIndex: number | null;
  setEditDirectionIndex: (index: number) => void;
}

export const BlendingOverlay: React.FC<BlendingOverlayProps> = ({
  images,
  handles,
  userId,
  editImageIndex,
  setEditImageIndex,
  editDirectionIndex,
  setEditDirectionIndex,
}) => {
  const imageUrl = (pastedImageId: string, pastedImageType: string): string =>
    `${assetsUrl}/images/${userId}/${pastedImageId}.${pastedImageType}`;

  return (
    <>
      {images.map((image, i) => {
        return (
          <div key={i}>
            {editImageIndex == i &&
              handles.map((handle, index) => (
                <div
                  key={index}
                  className={`absolute z-18 rounded-full cursor-${handle.cursor}`}
                  style={{
                    left: `${handle.left - HANDLE_SIZE / 2}px`,
                    top: `${handle.top - HANDLE_SIZE / 2}px`,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    background: `${
                      editDirectionIndex == index ? "yellow" : "red"
                    }`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditDirectionIndex(index);
                  }}
                />
              ))}

            <img
              key={i}
              src={imageUrl(image.imageId, image.imageType)}
              className={`absolute ${editImageIndex == i ? "z-16" : "z-15"}`}
              style={{
                left: `${image.left}px`,
                top: `${image.top}px`,
                width: `${image.width}px`,
                height: `${image.height}px`,
              }}
              draggable={false}
              onClick={() => {
                setEditImageIndex(i);
              }}
            />
          </div>
        );
      })}
    </>
  );
};
