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

const ImageList = () => {
  const reduxUserId = useSelector((state: RootState) => state.user.id);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string |null>(null);

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
          setImages(response.data.images);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [userId]);

  if (loading) return <div className="text-center py-4 text-lg">Loading images...</div>;
  if (error)
    return <div className="text-red-500 text-center py-4 text-lg">Error: {error}</div>;
  if (images.length === 0)
    return (
      <div className="text-gray-500 text-center py-4 text-lg">No images found.</div>
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
            className="flex justify-between items-center rounded-2xl border border-gray-200 shadow-md bg-white p-6 transition hover:shadow-lg"
          >
            <div>
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
            <div className="flex-shrink-0">
              {img.processing ? (
                <span className="inline-block text-sm font-medium text-gray-600 bg-gray-100 px-4 py-1 rounded-full">
                  Processing...
                </span>
              ) : (
                <button
                  className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 px-5 py-1.5 rounded-full shadow"
                  onClick={() => alert(`View image ${img.imageId}`)}
                >
                  View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageList;
