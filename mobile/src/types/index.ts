import { RouteProp } from "@react-navigation/native";

export type TabParamList = {
  ImageList: undefined;
  ImageUpload: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: { screen: keyof TabParamList } | undefined;
  ImageView: { imageId: string };
};

export type ImageViewRouteProp = RouteProp<RootStackParamList, 'ImageView'>;

export type Offset = {
  x: number;
  y: number;
};

export type Point = { x: number; y: number };

export type TileCoords = {
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number | undefined;
  height: number | undefined;
};

export type PastedImage = {
  width: number;
  height: number;
  left: number;
  top: number;
  imageId: string;
  imageType: string;
};

export type ImageHandler = {
  directionIndex: number;
  cursor: string;
  left: number;
  top: number;
};

export type ImageData = {
  imageId: string;
  imageOriginalName: string;
  imageType: string;
  processing: boolean;
  isClipped: boolean;
  isBlended: boolean;
}

export type ImageDimensions = {
  width: number;
  height: number;
}