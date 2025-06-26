import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import sharp from "sharp";
import { getImage, Image } from "./Image";
import produceTiles from "./produceTiles";
import dotenv from "dotenv";
dotenv.config();

const region = process.env.AWS_REGION || "ap-southeast-2";
const tableName = process.env.TABLE_NAME || "images";
const bucketName = process.env.BUCKET_NAME || "tilelens-assets";
const imageDir = process.env.IMAGE_DIR || "assets/images";
const tileDir = process.env.TILE_DIR || "assets/tiles";

const MAX_TILE_DIMENSION_PIXELS = 256;

const dynamodb = new DynamoDBClient({
  region,
});

const s3 = new S3Client({
  region,
});

async function updateImageDocument(
  userId: number,
  imageId: string,
  maxZoomLevel: number | null,
  processing: boolean = false,
  width: number | null,
  height: number | null
) {
  if (!dynamodb) {
    throw new Error("DynamoDB client is not connected");
  }

  const id = `${userId}_${imageId}`;

  await dynamodb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        id: { S: id },
      },
      UpdateExpression: `
        SET 
          maxZoomLevel = :zoom,
          processing = :processing,
          width = :width,
          height = :height,
          processedAt = :processedAt
      `,
      ExpressionAttributeValues: {
        ":zoom": { N: maxZoomLevel?.toString() || "0" },
        ":processing": { BOOL: processing },
        ":width": { N: width?.toString() || "0" },
        ":height": { N: height?.toString() || "0" },
        ":processedAt": { S: new Date().toISOString() },
      },
    })
  );
}

async function getImageFromS3(bucket: string, key: string): Promise<Image> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`Image not found in s3://${bucket}/${key}`);
  }

  // Convert stream to Buffer (for Node <18 compatibility)
  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Feed into Sharp and use getImage()
  return await getImage(sharp(buffer));
}

async function saveImageToS3(bucket: string, key: string, image: Image) {
  const buffer = await image.toBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );
}

// Entry point for AWS Lambda (or simulated)
export const handler = async (event: any) => {
  for (const record of event.Records) {
    const recordBody = JSON.parse(record.body);
    const body = recordBody.payload;

    const userId = body.userId;
    const imageId = body.imageId;
    const imageType = body.imageType;

    const inputPath =
      `${imageDir}` + "/" + `${userId}` + "/" + `${imageId}.${imageType}`;

    const outputDir = `${tileDir}` + "/" + `${userId}` + "/" + `${imageId}`;

    const image = await getImageFromS3(bucketName, inputPath);
    const { width, height } = image.properties;
    const maxZoomLevel = Math.ceil(1 + Math.log10(Math.max(width, height)));

    await produceTiles(image, outputDir, MAX_TILE_DIMENSION_PIXELS, {
      destination: "s3",
      bucketName: bucketName,
      deps: {
        saveImageToS3,
      },
    });

    // Write to DynamoDB
    await updateImageDocument(
      userId,
      imageId,
      maxZoomLevel,
      false,
      width,
      height
    );
  }
};
