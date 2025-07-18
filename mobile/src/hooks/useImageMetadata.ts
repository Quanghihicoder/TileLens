import { useEffect, useState } from "react";
import { API_URL } from '@env';
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

export const useImageMetadata = (userId: string, imageId: string) => {
  const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [maxZoomLevel, setMaxZoomLevel] = useState<number>(0);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/image/${userId}/${imageId}`, {
          withCredentials: true,
        });
        if (res.data?.image) {
          const { image } = res.data;

          if (image.processing) {
            navigation.goBack()
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

