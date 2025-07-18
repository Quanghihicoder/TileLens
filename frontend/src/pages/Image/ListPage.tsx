import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks/useRedux";
import { type RootState } from "../../app/store";
import { type ImageData } from "../../types";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const environment = import.meta.env.VITE_ENV;
const apiUrl = import.meta.env.VITE_API_URL;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

const ImageList = () => {
  const reduxUserId = useAppSelector((state: RootState) => state.user.id);
  const [images, setImages] = useState<ImageData[]>([]);
  const [filter, setFilter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const userId =
    reduxUserId ?? JSON.parse(localStorage.getItem("user") || "{}").id;

  useEffect(() => {
    if (!userId) {
      setError("User not found");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchAndCompareImages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/image/${userId}`, {
          withCredentials: true,
        });

        const newImages = [...(response?.data?.images || [])].sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        if (
          isMounted &&
          newImages &&
          JSON.stringify(newImages) !== JSON.stringify(images)
        ) {
          setImages(newImages);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to fetch images");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAndCompareImages();
    const intervalId = setInterval(fetchAndCompareImages, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  const imgUrl = (userId: string, imageId: string, imageType: string): string =>
    `${assetsUrl}/images/${userId}/${imageId}.${imageType}`;

  if (loading)
    return (
      <div className="w-full text-center py-4 text-lg">Loading images...</div>
    );
  if (error)
    return (
      <div className="w-full text-red-500 text-center py-4 text-lg">
        Error: {error}
      </div>
    );
  if (images.length === 0)
    return (
      <div className="w-full text-gray-500 text-center py-4 text-lg">
        No images found.
      </div>
    );

  return (
    <div className="min-w-3xl max-w-4xl mx-auto p-6 ">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Your
        <button
          className={`${
            filter == 0 ? "text-blue-600 underline" : "text-gray-400"
          } mx-2`}
          onClick={() => {
            setFilter(0);
          }}
        >
          All
        </button>
        /
        <button
          className={`${
            filter == 1 ? "text-blue-600 underline" : "text-gray-400"
          } mx-2`}
          onClick={() => {
            setFilter(1);
          }}
        >
          Uploaded
        </button>
        /
        <button
          className={`${
            filter == 2 ? "text-blue-600 underline" : "text-gray-400"
          } mx-2`}
          onClick={() => {
            setFilter(2);
          }}
        >
          Clipped
        </button>
        /
        <button
          className={`${
            filter == 3 ? "text-blue-600 underline" : "text-gray-400"
          } mx-2`}
          onClick={() => {
            setFilter(3);
          }}
        >
          Blended
        </button>
        Images
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {images
          .filter((img) => {
            if (filter === 0) return true;
            if (filter === 1)
              return img.isClipped === false && img.isBlended === false;
            if (filter === 2) return img.isClipped === true;
            if (filter === 3) return img.isBlended === true;
            return true;
          })
          .map((img) => (
            <div
              key={img.imageId}
              className="flex flex-col sm:flex-row justify-between items-center rounded-2xl border border-gray-200 shadow-md bg-white p-6 transition hover:shadow-lg"
            >
              <img
                src={imgUrl(userId, img.imageId, img.imageType)}
                alt={`Preview of ${img.imageOriginalName}`}
                crossOrigin={
                  environment === "development"
                    ? "use-credentials"
                    : "anonymous"
                }
                className="w-full sm:w-40 max-h-64 object-contain rounded-md mb-4 sm:mb-0 sm:mr-6"
              />

              <div className="mb-4 sm:mb-0 sm:flex-1 w-full">
                <p className="text-gray-700">
                  <span className="font-semibold">Image ID:</span> {img.imageId}
                </p>
                <p className="text-gray-700 w-60">
                  <span className="font-semibold">Original Name:</span>{" "}
                  {img.imageOriginalName}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Type:</span> {img.imageType}
                </p>
              </div>
              <div className="w-full sm:w-auto flex justify-center sm:justify-start space-x-0 sm:space-x-3">
                {img.processing ? (
                  <span className="inline-block text-sm font-medium text-gray-600 bg-gray-100 px-4 py-1 rounded-full text-center w-full sm:w-auto">
                    Processing...
                  </span>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto">
                    <button
                      className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 border-1 border-blue-600 px-5 py-1.5 rounded-full shadow w-full sm:w-auto"
                      onClick={() => navigate(`/image/view/${img.imageId}`)}
                    >
                      View
                    </button>

                    <button
                      className="text-sm font-medium text-black px-5 py-1.5 border-1 rounded-full shadow w-full sm:w-auto  active:scale-95 transition-transform"
                      onClick={async () => {
                        await navigator.clipboard.writeText(img.imageId);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ImageList;
