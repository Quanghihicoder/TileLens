import { useState, type ChangeEvent } from "react";
import axios from "axios";

interface ImageDimensions {
  width: number;
  height: number;
}

const PREVIEW_IMAGE_MOBILE_MAX_SIZE = 200;
const PREVIEW_IMAGE_DESKTOP_MAX_SIZE = 300;

const MOBILE_BREAK_POINT = 768; // md value in TailwindCSS

const ImageUpload = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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
      const img = new Image();
      const objectUrl = URL.createObjectURL(selected);

      img.onload = () => {
        console.log("Width:", img.width);
        console.log("Height:", img.height);

        setImageDimensions({
          width: img.width,
          height: img.height,
        });

        URL.revokeObjectURL(objectUrl); // free memory
      };

      img.src = objectUrl;

      setFile(selected);
      setImage(objectUrl);
    } else {
      alert("Only PNG and JPG/JPEG files are allowed.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Uploaded image URL:", response.data.url);
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold text-gray-700">Upload an image</p>
        <p className="text-sm text-gray-500">
          Only PNG or JPG formats are supported
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 p-4 border rounded-md shadow-md w-full max-w-md mx-auto bg-white">
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
          className="border p-2 rounded-md"
          disabled={loading}
        />
        <div
          className={`flex flex-col items-center justify-center`}
          style={{
            width: `${window.screen.width > MOBILE_BREAK_POINT
              ? PREVIEW_IMAGE_DESKTOP_MAX_SIZE
              : PREVIEW_IMAGE_MOBILE_MAX_SIZE}px`,
            height: `${window.screen.width > MOBILE_BREAK_POINT
              ? PREVIEW_IMAGE_DESKTOP_MAX_SIZE
              : PREVIEW_IMAGE_MOBILE_MAX_SIZE}px`,
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
          className={`px-4 py-2 rounded-md text-white w-full transition ${loading
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
