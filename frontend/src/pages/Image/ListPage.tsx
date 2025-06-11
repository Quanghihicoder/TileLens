import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../../app/store";
import axios from "axios";

interface Image {
  imageId: string;
  imageOriginalName: string;
  imageType: string;
  processing: boolean;
}

const apiUrl = import.meta.env.VITE_API_URL;
const assetsUrl = import.meta.env.VITE_ASSETS_URL;

const ImageList = () => {
  const reduxUserId = useSelector((state: RootState) => state.user.id);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId =
    reduxUserId ?? JSON.parse(localStorage.getItem("user") || "{}").id;

  useEffect(() => {
    if (!userId) {
      setError("User not found");
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/image/${userId}`, {
          withCredentials: true,
        });

        if (response?.data?.images) {
          setImages(response.data.images.reverse());
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    // const intervalId = setInterval(fetchImages, 10000); // fetch every 10 seconds

    // return () => clearInterval(intervalId);
  }, [userId]);

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`${apiUrl}/image/${userId}/${imageId}`, {
        withCredentials: true,
      });
      setImages((prev) => prev.filter((img) => img.imageId !== imageId));
    } catch (err: any) {
      alert("Failed to delete image: " + (err.message || "Unknown error"));
    }
  };

  const imgUrl = (userId: string, imageId: string, imageType: string): string =>
    `${assetsUrl}/images/${userId}/${imageId}.${imageType}`;

  if (loading)
    return <div className="text-center py-4 text-lg">Loading images...</div>;
  if (error)
    return (
      <div className="text-red-500 text-center py-4 text-lg">
        Error: {error}
      </div>
    );
  if (images.length === 0)
    return (
      <div className="text-gray-500 text-center py-4 text-lg">
        No images found.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Your Uploaded Images
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {images.map((img) => (
          <div
            key={img.imageId}
            className="flex flex-col sm:flex-row justify-between items-center rounded-2xl border border-gray-200 shadow-md bg-white p-6 transition hover:shadow-lg"
          >
             <img
                src={imgUrl(userId, img.imageId, img.imageType)}
                alt={`Preview of ${img.imageOriginalName}`}
                crossOrigin="use-credentials"
                className="w-full sm:w-40 max-h-64 object-contain rounded-md mb-4 sm:mb-0 sm:mr-6"
              />

            <div className="mb-4 sm:mb-0 sm:flex-1 w-full">
              <p className="text-gray-700">
                <span className="font-semibold">Image ID:</span> {img.imageId}
              </p>
              <p className="text-gray-700">
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
                <div className="flex justify-center w-full sm:w-auto space-x-3">
                  <button
                    onClick={() => handleDelete(img.imageId)}
                    className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full shadow w-full sm:w-auto"
                  >
                    Delete
                  </button>
                  <button
                    className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 px-5 py-1.5 rounded-full shadow w-full sm:w-auto"
                    onClick={() => alert(`View image ${img.imageId}`)}
                  >
                    View
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
