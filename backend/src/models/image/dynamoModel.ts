import { getDynamoDb } from "../../db/dynamo";
import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const tableName = process.env.TABLE_NAME || "images";

function makeId(userId: number, imageId: string) {
  return `${userId}_${imageId}`;
}

export async function createImageDynamo(
  userId: number,
  imageId: string,
  imageOriginalName: string,
  imageType: string
): Promise<void> {
  const client = getDynamoDb();
  await client.send(new PutCommand({
    TableName: tableName,
    Item: {
      id: makeId(userId, imageId), 
      userId,
      imageId,
      imageOriginalName,
      imageType,
      processing: true,
      maxZoomLevel: null,
      width: null,
      height: null,
      isClipped: false,
      uploadedAt: new Date().toISOString(),
    },
  }));
}

export async function createClippedImageDynamo(
  userId: number,
  imageId: string,
  imageOriginalName: string
): Promise<void> {
  const client = getDynamoDb();
  await client.send(new PutCommand({
    TableName: tableName,
    Item: {
      id: makeId(userId, imageId),
      userId,
      imageId,
      imageOriginalName,
      imageType: null,
      processing: true,
      maxZoomLevel: null,
      width: null,
      height: null,
      isClipped: true,
      uploadedAt: new Date().toISOString(),
    },
  }));
}

// Since 'id' is the primary key, querying by userId only requires scanning or a secondary index
// Assuming no GSI for userId, so we do Scan with FilterExpression
export async function getImagesByUserIdDynamo(userId: number): Promise<any[]> {
  const client = getDynamoDb();
  const res = await client.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
    ProjectionExpression: "imageId, imageOriginalName, imageType, processing, isClipped, uploadedAt", 
  }));
  return res.Items ?? [];
}

// Get by full PK 'id'
export async function getImageByImageIdDynamo(userId: number, imageId: string): Promise<any | null> {
  const client = getDynamoDb();
  const res = await client.send(new GetCommand({
    TableName: tableName,
    Key: {
      id: makeId(userId, imageId),
    },
    ProjectionExpression: "imageOriginalName, imageType, processing, maxZoomLevel, width, height",
  }));
  return res.Item ?? null;
}
