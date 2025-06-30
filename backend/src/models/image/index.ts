import { createImageMongo, createClippedImageMongo, createBlendedImageMongo, getImagesByUserIdMongo, getImageByImageIdMongo } from "./mongoModel";
import { createImageDynamo, createClippedImageDynamo, createBlendedImageDynamo, getImagesByUserIdDynamo, getImageByImageIdDynamo } from "./dynamoModel";
import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const createImage = isProd ? createImageDynamo : createImageMongo;
export const createClippedImage = isProd ? createClippedImageDynamo : createClippedImageMongo;
export const createBlendedImage = isProd ? createBlendedImageDynamo : createBlendedImageMongo;
export const getImagesByUserId = isProd ? getImagesByUserIdDynamo : getImagesByUserIdMongo;
export const getImageByImageId = isProd ? getImageByImageIdDynamo : getImageByImageIdMongo;
