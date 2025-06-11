import { getMongoDb } from "../db/mongo";

const COLLECTION_NAME = "images";

export interface ImageDoc {
  userId: number;
  imageId: string;
  imageOriginalName: string;
  imageType: string;
  processing: boolean;
  maxZoomLevel: number | null;
  uploadedAt: Date;
}

export async function createImage(
  userId: number,
  imageId: string,
  imageOriginalName: string,
  imageType: string,
): Promise<void> {
  const db = getMongoDb();

  const newImage: ImageDoc = {
    userId,
    imageId,
    imageOriginalName,
    imageType,
    processing: true,
    maxZoomLevel: null,
    uploadedAt: new Date(),
  };

  await db.collection<ImageDoc>(COLLECTION_NAME).insertOne(newImage);
}

export async function getImagesByUserId(userId: number): Promise<Partial<ImageDoc>[]> {
  const db = getMongoDb();
  return db.collection<ImageDoc>(COLLECTION_NAME)
    .find({ userId }, { projection: { imageId: 1, imageOriginalName: 1, imageType: 1, processing: 1, _id: 0 } })
    .toArray();
}

export async function getImageByImageId(
  imageId: string
): Promise<ImageDoc | null> {
  const db = getMongoDb();
  return db.collection<ImageDoc>(COLLECTION_NAME).findOne({ imageId });
}
