import { getMongoDb } from "../../db/mongo";
import dotenv from "dotenv";
dotenv.config();

const tableName = process.env.TABLE_NAME || "images";

export interface ImageDoc {
  userId: number;
  imageId: string;
  imageOriginalName: string;
  imageType: string | null;
  processing: boolean;
  maxZoomLevel: number | null;
  width: number | null;
  height: number | null;
  isClipped: boolean | null;
  uploadedAt: Date;
}

export async function createImageMongo(
  userId: number,
  imageId: string,
  imageOriginalName: string,
  imageType: string
): Promise<void> {
  const db = getMongoDb();
  const doc: ImageDoc = {
    userId,
    imageId,
    imageOriginalName,
    imageType,
    processing: true,
    maxZoomLevel: null,
    width: null,
    height: null,
    isClipped: false,
    uploadedAt: new Date(),
  };
  await db.collection(tableName).insertOne(doc);
}

export async function createClippedImageMongo(
  userId: number,
  imageId: string,
  imageOriginalName: string
): Promise<void> {
  const db = getMongoDb();
  const doc: ImageDoc = {
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
  await db.collection(tableName).insertOne(doc);
}

export async function getImagesByUserIdMongo(userId: number): Promise<Partial<ImageDoc>[]> {
  const db = getMongoDb();
  return db.collection<ImageDoc>(tableName)
    .find({ userId }, {
      projection: {
        imageId: 1,
        imageOriginalName: 1,
        imageType: 1,
        processing: 1,
        isClipped: 1,
        uploadedAt: 1,
        _id: 0,
      },
    }).toArray();
}

export async function getImageByImageIdMongo(userId: number, imageId: string): Promise<Partial<ImageDoc> | null> {
  const db = getMongoDb();
  return db.collection<ImageDoc>(tableName)
    .findOne({ userId, imageId }, {
      projection: {
        imageOriginalName: 1,
        processing: 1,
        maxZoomLevel: 1,
        width: 1,
        height: 1,
        _id: 0,
      },
    });
}
