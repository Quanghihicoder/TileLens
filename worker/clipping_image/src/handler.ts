import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import sharp from "sharp";
import fs from "fs-extra";
import { createCanvas } from "canvas";
import dotenv from "dotenv";
dotenv.config();

type Point = { x: number; y: number };

type BoundingRect = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

const region = process.env.AWS_REGION || "ap-southeast-2"
const tableName = process.env.TABLE_NAME || "images";
const bucketName = process.env.BUCKET_NAME || "tilelens-assets"
const imageDir = process.env.IMAGE_DIR || "assets/images"
const queueURL = process.env.SQS_TILING_QUEUE_URL!

const dynamodb = new DynamoDBClient({
  region,
});

const s3 = new S3Client({
  region,
});

const sqs = new SQSClient({
  region,
});

async function updateImageDocument(
  userId: number,
  imageId: string,
  imageType: string
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
      UpdateExpression: "SET imageType = :type",
      ExpressionAttributeValues: {
        ":type": { S: imageType },
      },
    })
  );
}

async function getImageType(
  userId: number,
  imageId: string
): Promise<string | null> {
  if (!dynamodb) {
    throw new Error("DynamoDB client is not connected");
  }

  const id = `${userId}_${imageId}`;

  const result = await dynamodb.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        id: { S: id },
      },
      ProjectionExpression: "imageType", 
    })
  );

  const item = result.Item;

  if (!item || !item.imageType || !item.imageType.S) {
    return null;
  }

  return item.imageType.S;
}

async function getImageFromS3(
  bucket: string,
  key: string
): Promise<sharp.Sharp> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`Image not found in s3://${bucket}/${key}`);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return await sharp(buffer);
}

function getBoundingRect(points: Point[]): BoundingRect {
  if (!points.length) return null;

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const recordBody = JSON.parse(record.body);
    const body = recordBody.payload

    const userId = body.userId;
    const newImageId = body.newImageId;
    const originalImageId = body.originalImageId;
    const levelWidth = body.levelWidth;
    const levelHeight = body.levelHeight;
    const clipPaths = body.clipPaths;

    try {
      const imageType = await getImageType(Number(userId), originalImageId);

      const inputPath =
        `${imageDir}` + "/" +
        `${userId}` + "/" +
        `${originalImageId}.${imageType}`;

      const outputDir = `${imageDir}` + "/" + `${userId}`;

      const canvas = createCanvas(Number(levelWidth), Number(levelHeight));
      const ctx = canvas.getContext("2d");

      ctx.beginPath();
      ctx.moveTo(clipPaths[0].x, clipPaths[0].y);
      for (let i = 1; i < clipPaths.length; i++) {
        ctx.lineTo(clipPaths[i].x, clipPaths[i].y);
      }
      ctx.lineTo(clipPaths[0].x, clipPaths[0].y);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();

      const maskBuffer = canvas.toBuffer("image/png");

      const rect = getBoundingRect(clipPaths);
      const tmpPath = `/tmp/temp-${newImageId}.png`;

      await (
        await getImageFromS3(bucketName, inputPath)
      )
        .rotate()
        .resize(Number(levelWidth), Number(levelHeight))
        .composite([{ input: maskBuffer, blend: "dest-in" }])
        .toFile(tmpPath);

      let tmpImage = sharp(tmpPath);

      if (rect && rect.width > 0 && rect.height > 0) {
        tmpImage = tmpImage.extract({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }

      const tmpBuffer = await tmpImage.png().toBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${outputDir}/${newImageId}.png`,
          Body: tmpBuffer,
          ContentType: "image/png",
        })
      );

      await fs.unlink(tmpPath);

      await updateImageDocument(userId, newImageId, "png");
      
    } catch (error) {
      console.log(error);
    } finally {
      const payload = {
        userId: userId,
        imageId: newImageId,
        imageType: "png",
        originalName: "clipped-" + originalImageId + ".png",
      };
      
      const command = new SendMessageCommand({
        QueueUrl: queueURL,
        MessageBody: JSON.stringify({
          type: "tile-image", 
          payload: payload,
        }),
      });
      
      await sqs.send(command);
    }
  }
};
