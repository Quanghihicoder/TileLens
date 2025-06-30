import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { Queue, Worker } from "bullmq";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { getImagePath } from "./utilities";
dotenv.config();

type PastedImage = {
  width: number;
  height: number;
  left: number;
  top: number;
  imageId: string;
  imageType: string;
};

const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const tableName = process.env.TABLE_NAME || "images";
const imageDir = process.env.IMAGE_DIR || "/assets/images";

const connection = {
  host: redisHost,
  port: redisPort,
};

const imageQueue = new Queue("image-tiling", { connection });

const workerOptions = {
  connection,
  lockDuration: 60000,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),
};

// MongoDB connection setup
let mongoClient: MongoClient;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectMongo(retries = 0): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");

  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000, // Fail fast if unreachable
    });

    await mongoClient.connect();
    console.log("✅ MongoDB Connected");

    // Auto-reconnect on failure
    mongoClient.on("close", () => {
      console.log("❌ MongoDB Disconnected. Attempting to reconnect...");
      connectMongo().catch(() => {}); // Silent retry
    });
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.log(
        `Retrying MongoDB connection (${retries + 1}/${MAX_RETRIES})...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectMongo(retries + 1);
    }
  }
}

async function updateImageDocument(
  userId: number,
  imageId: string,
  imageType: string | null
) {
  if (!mongoClient) {
    throw new Error("MongoDB client is not connected");
  }

  const db = mongoClient.db();
  const collection = db.collection(tableName);

  await collection.updateOne(
    { userId, imageId },
    {
      $set: {
        imageType,
      },
    },
    { upsert: false }
  );
}

async function getImageType(
  userId: number,
  imageId: string
): Promise<string | undefined> {
  if (!mongoClient) {
    throw new Error("MongoDB client is not connected");
  }

  const db = mongoClient.db();
  const collection = db.collection<{
    userId: number;
    imageId: string;
    imageType: string;
  }>(tableName);

  const image = await collection.findOne(
    { userId, imageId },
    {
      projection: {
        imageType: 1,
        _id: 0,
      },
    }
  );

  return image?.imageType;
}

const imageWorker = new Worker(
  "image-blending",
  async (job) => {
    const {
      userId,
      newImageId,
      originalImageId,
      levelWidth,
      levelHeight,
      pastedImages,
    } = job.data;
    const jobId = job.id;

    console.log(
      `[Job ${jobId}] Blending image ${originalImageId} to ${newImageId} for user ${userId}...`
    );

    const imageType = await getImageType(Number(userId), originalImageId);

    const __dirname = path.resolve();

    const inputPath = path.join(
      __dirname,
      `${imageDir}`,
      `${userId}`,
      `${originalImageId}.${imageType}`
    );

    const outputDir = path.join(__dirname, `${imageDir}`, `${userId}`);

    try {
      await fs.access(inputPath, fs.constants.R_OK);
      await fs.ensureDir(outputDir);

      const canvas = await sharp(inputPath)
        .rotate()
        .resize(Number(levelWidth), Number(levelHeight));

      const composites = await Promise.all(
        pastedImages.map(async (img: PastedImage) => {
          const pastedImageInputPath = path.join(
            __dirname,
            `${imageDir}`,
            `${userId}`,
            `${img.imageId}.${img.imageType}`
          );
          const buffer = await sharp(pastedImageInputPath)
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

      const blended = await canvas
        .composite(composites)
        .toFile(getImagePath(outputDir, newImageId));

      // Update MongoDB document after successful blending
      await updateImageDocument(userId, newImageId, "png");

      console.log(
        `[Job ${jobId}] Successfully blended image ${originalImageId} to ${newImageId}`
      );
      return { status: "success", userId, outputDir, newImageId };
    } catch (error) {
      console.error(
        `[Job ${jobId}] Failed to blend image ${originalImageId}:`,
        error
      );
      throw error;
    } finally {
      await imageQueue.add("process-image", {
        userId: userId,
        imageId: newImageId,
        imageType: "png",
        originalName: "blended-" + originalImageId + ".png",
      });
    }
  },
  workerOptions
);

// Initialize MongoDB connection when worker starts
connectMongo().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received - closing worker");
  await imageWorker.close();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received - closing worker");
  await imageWorker.close();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

console.log("Image blending worker started");
