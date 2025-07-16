import { useState, useRef, type ChangeEvent } from "react";
import axios from "axios";
import { useNotification } from "../../providers/Notification";

interface ImageDimensions {
  width: number;
  height: number;
}

const PREVIEW_IMAGE_MOBILE_MAX_SIZE = 200;
const PREVIEW_IMAGE_DESKTOP_MAX_SIZE = 300;

const MOBILE_BREAK_POINT = 768; // md value in TailwindCSS

const MAX_FILE_SIZE_MB = 50;

const apiUrl = import.meta.env.VITE_API_URL;

const ImageUpload = () => {
  const showNotification = useNotification();

  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // To resize preview image to avoid urly cropping
  const resizeImage = (imageDimensions: ImageDimensions) => {
    const ratio = imageDimensions.width / imageDimensions.height;
    const maxSize =
      window.screen.width > MOBILE_BREAK_POINT
        ? PREVIEW_IMAGE_DESKTOP_MAX_SIZE
        : PREVIEW_IMAGE_MOBILE_MAX_SIZE;

    const newWidth = ratio > 1 ? maxSize : Math.ceil(maxSize * ratio);
    const newHeight = ratio > 1 ? Math.ceil(maxSize / ratio) : maxSize;

    return { width: newWidth, height: newHeight };
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (
      selected &&
      (selected.type === "image/png" || selected.type === "image/jpeg")
    ) {
      const isTooLarge = selected.size > MAX_FILE_SIZE_MB * 1024 * 1024;

      if (isTooLarge) {
        showNotification(
          "File is too large. Maximum allowed size is 50MB.",
          "error"
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(selected);

      img.onload = () => {
        setImage(objectUrl); // set only after load
        setImageDimensions({
          width: img.width,
          height: img.height,
        });

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      };

      img.src = objectUrl;
      setFile(selected);
    } else {
      showNotification("Only PNG and JPG/JPEG files are allowed.", "error");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.post(`${apiUrl}/image/upload`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showNotification("Image uploaded successfully!", "success");

      setImage(null);
      setImageDimensions(null);
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading:", error);
      showNotification("Failed to upload image.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 pb-12 h-full w-full flex flex-col items-center">
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold text-gray-700">Upload an image</p>
        <p className="text-sm text-gray-500">
          Only PNG or JPG formats are supported
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 p-4 rounded-md border shadow-lg w-full max-w-md mx-auto bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
          className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0 file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white hover:file:bg-blue-700
                       cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        />
        <div
          className={`flex flex-col items-center justify-center`}
          style={{
            width: `${
              window.screen.width > MOBILE_BREAK_POINT
                ? PREVIEW_IMAGE_DESKTOP_MAX_SIZE
                : PREVIEW_IMAGE_MOBILE_MAX_SIZE
            }px`,
            height: `${
              window.screen.width > MOBILE_BREAK_POINT
                ? PREVIEW_IMAGE_DESKTOP_MAX_SIZE
                : PREVIEW_IMAGE_MOBILE_MAX_SIZE
            }px`,
          }}
        >
          {image && imageDimensions ? (
            <img
              src={image}
              alt="Preview"
              style={{
                width: `${resizeImage(imageDimensions).width}px`,
                height: `${resizeImage(imageDimensions).height}px`,
              }}
              className="rounded-md border"
            />
          ) : (
            <>
              <p>Select a image</p>
              <p>to preview</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`px-4 py-2 rounded-md text-white w-full transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
