import sharp from "sharp";
import fs from "fs-extra";
import { getImage } from "./Image";
import produceTiles from "./produceTiles";
import path from "path";
import { Worker } from "bullmq";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const redisHost = process.env.REDIS_HOST || "redis"
const redisPort = Number(process.env.REDIS_PORT) || 6379
const mongoURL = process.env.MONGO_URI
const worker_concurrency = Number(process.env.WORKER_CONCURRENCY) || 2
const tableName = process.env.TABLE_NAME || "images";
const imageDir = process.env.IMAGE_DIR || "/assets/images"
const tileDir = process.env.TILE_DIR || "/assets/tiles"

const MAX_TILE_DIMENSION_PIXELS = 256;

const connection = {
  host: redisHost,
  port: redisPort,
};

const workerOptions = {
  connection,
  lockDuration: 60000,
  concurrency: worker_concurrency,
};

// MongoDB connection setup
let mongoClient: MongoClient;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectMongo(retries = 0): Promise<void> {
  const uri = mongoURL;
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
  maxZoomLevel: number | null,
  processing: boolean = false,
  width: number | null,
  height: number | null
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
        processing,
        maxZoomLevel,
        width,
        height,
        processedAt: new Date(),
      },
    },
    { upsert: false }
  );
}

const imageWorker = new Worker(
  "image-tiling",
  async (job) => {
    const { userId, imageId, imageType, originalName } = job.data;
    const jobId = job.id;

    console.log(
      `[Job ${jobId}] Processing image ${imageId} for user ${userId}...`
    );
    console.log(job.data);

    const __dirname = path.resolve();

    const inputPath = path.join(
      __dirname,
      `${imageDir}`,
      `${userId}`,
      `${imageId}.${imageType}`
    );

    const outputDir = path.join(
      __dirname,
      `${tileDir}`,
      `${userId}`,
      `${imageId}`
    );

    try {
      await fs.access(inputPath, fs.constants.R_OK);
      await fs.ensureDir(outputDir);

      const image = await getImage(sharp(inputPath));
      const { width, height } = image.properties;
      const maxZoomLevel = Math.ceil(1 + Math.log10(Math.max(width, height)));

      await produceTiles(image, outputDir, MAX_TILE_DIMENSION_PIXELS);

      await updateImageDocument(
        userId,
        imageId,
        maxZoomLevel,
        false,
        width,
        height
      );

      console.log(`[Job ${jobId}] Successfully processed image ${imageId}`);
      return {
        status: "success",
        userId,
        imageId,
        originalName,
        outputDir,
        maxZoomLevel,
      };
    } catch (error) {
      console.error(
        `[Job ${jobId}] Failed to process image ${imageId}:`,
        error
      );

      try {
        if (mongoClient) {
          await updateImageDocument(userId, imageId, null, true, null, null);
        }
      } catch (mongoError) {
        console.error(
          `[Job ${jobId}] Failed to update MongoDB on error:`,
          mongoError
        );
      }

      // Cleanup partial output on failure
      try {
        await fs.remove(outputDir);
      } catch (cleanupError) {
        console.error(`[Job ${jobId}] Cleanup failed:`, cleanupError);
      }

      throw error;
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

console.log("Image processing worker started");
