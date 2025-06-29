import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const useImageMetadata = (userId: string, imageId: string) => {
  const [maxZoomLevel, setMaxZoomLevel] = useState<number>(0);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${apiUrl}/image/${userId}/${imageId}`, {
          withCredentials: true,
        });
        if (res.data?.image) {
          const { image } = res.data;

          if (image.processing) {
            navigate("/");
            return;
          }

          setMaxZoomLevel(image.maxZoomLevel - 1);
          setImageWidth(image.width);
          setImageHeight(image.height);
        }
      } catch (err) {
        console.error("Error fetching image details:", err);
      }
    };

    fetch();
  }, [userId, imageId]);

  return { maxZoomLevel, imageWidth, imageHeight };
};

