import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import sharp from "sharp";
import dotenv from "dotenv";
dotenv.config();

type PastedImage = {
  width: number;
  height: number;
  left: number;
  top: number;
  imageId: string;
  imageType: string;
};

const region = process.env.AWS_REGION || "ap-southeast-2";
const tableName = process.env.TABLE_NAME || "images";
const bucketName = process.env.BUCKET_NAME || "tilelens-assets";
const imageDir = process.env.IMAGE_DIR || "assets/images";
const queueURL = process.env.SQS_TILING_QUEUE_URL!;

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

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const recordBody = JSON.parse(record.body);
    const body = recordBody.payload;

    const userId = body.userId;
    const newImageId = body.newImageId;
    const originalImageId = body.originalImageId;
    const levelWidth = body.levelWidth;
    const levelHeight = body.levelHeight;
    const pastedImages = body.pastedImages;

    try {
      const imageType = await getImageType(Number(userId), originalImageId);

      const inputPath =
        `${imageDir}` +
        "/" +
        `${userId}` +
        "/" +
        `${originalImageId}.${imageType}`;

      const outputDir = `${imageDir}` + "/" + `${userId}`;

      const canvas = await (await getImageFromS3(bucketName, inputPath))
        .rotate()
        .resize(Number(levelWidth), Number(levelHeight));

      const composites = await Promise.all(
        pastedImages.map(async (img: PastedImage) => {
          const pastedImageInputPath =
            `${imageDir}` +
            "/" +
            `${userId}` +
            "/" +
            `${img.imageId}.${img.imageType}`;

          const buffer = await (
            await getImageFromS3(bucketName, pastedImageInputPath)
          )
            .rotate()
            .resize(Math.ceil(img.width), Math.ceil(img.height))
            .toBuffer();

          return {
            input: buffer,
            top: Math.ceil(img.top),
            left: Math.ceil(img.left),
          };
        })
      );

      const blended = await canvas.composite(composites).toBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${outputDir}/${newImageId}.png`,
          Body: blended,
          ContentType: "image/png",
        })
      );

      await updateImageDocument(userId, newImageId, "png");
    } catch (error) {
      console.log(error);
    } finally {
      const payload = {
        userId: userId,
        imageId: newImageId,
        imageType: "png",
        originalName: "blended-" + originalImageId + ".png",
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
