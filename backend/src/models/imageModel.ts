import { getMongoDb } from "../db/mongo";

const COLLECTION_NAME = "images";

export interface ImageDoc {
  userId: number;
  imageId: string;
  imageOriginalName: string;
  imageType: string | null;
  processing: boolean;
  maxZoomLevel: number | null;
  width: number | null,
  height: number | null,
  isClipped: boolean | null,
  uploadedAt: Date;
}

export async function createImage(
  userId: number,
  imageId: string,
  imageOriginalName: string,
  imageType: string,
  width: number,
  height: number
): Promise<void> {
  const db = getMongoDb();

  const newImage: ImageDoc = {
    userId,
    imageId,
    imageOriginalName,
    imageType,
    processing: true,
    maxZoomLevel: null,
    width,
    height,
    isClipped: false,
    uploadedAt: new Date(),
  };

  await db.collection<ImageDoc>(COLLECTION_NAME).insertOne(newImage);
}

export async function createClippedImage(
  userId: number,
  imageId: string,
  imageOriginalName: string,
): Promise<void> {
  const db = getMongoDb();

  const newImage: ImageDoc = {
    userId,
    imageId,
    imageOriginalName,
    imageType: null,
    processing: true,
    maxZoomLevel: null,
    width: null,
    height: null,
    isClipped: true,
    uploadedAt: new Date(),
  };

  await db.collection<ImageDoc>(COLLECTION_NAME).insertOne(newImage);
}

export async function getImagesByUserId(
  userId: number
): Promise<Partial<ImageDoc>[]> {
  const db = getMongoDb();
  return db
    .collection<ImageDoc>(COLLECTION_NAME)
    .find(
      { userId },
      {
        projection: {
          imageId: 1,
          imageOriginalName: 1,
          imageType: 1,
          processing: 1,
          isClipped: 1,
          _id: 0,
        },
      }
    )
    .toArray();
}

export async function getImageByImageId(
  userId: number,
  imageId: string
): Promise<Partial<ImageDoc> | null> {
  const db = getMongoDb();

  return db
    .collection<ImageDoc>(COLLECTION_NAME)
    .findOne(
      { userId ,imageId },
      {
        projection: {
          imageOriginalName: 1,
          imageType: 1,
          processing: 1,
          maxZoomLevel: 1,
          width: 1,
          height: 1,
          _id: 0,
        },
      }
    );
}
