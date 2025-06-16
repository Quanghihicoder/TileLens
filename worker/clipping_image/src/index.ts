import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { Queue, Worker } from "bullmq";
import { MongoClient } from "mongodb";
import { createCanvas } from "canvas";
import dotenv from "dotenv";
import { getImagePath } from "./utilities";

dotenv.config();

type Point = { x: number; y: number };

type BoundingRect = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

const connection = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const imageQueue = new Queue("image-processing", { connection });

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
  const collection = db.collection("images");

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
  }>("images");

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

const imageWorker = new Worker(
  "image-clipping",
  async (job) => {
    const {
      userId,
      newImageId,
      originalImageId,
      levelWidth,
      levelHeight,
      clipPaths,
    } = job.data;
    const jobId = job.id;

    console.log(
      `[Job ${jobId}] Clipping image ${originalImageId} to ${newImageId} for user ${userId}...`
    );

    const imageType = await getImageType(Number(userId), originalImageId);

    const __dirname = path.resolve();

    const inputPath = path.join(
      __dirname,
      "/assets/images",
      `${userId}`,
      `${originalImageId}.${imageType}`
    );

    const outputDir = path.join(__dirname, "/assets/images", `${userId}`);

    try {
      await fs.access(inputPath, fs.constants.R_OK);
      await fs.ensureDir(outputDir);

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

      await sharp(inputPath).rotate()
        .resize(Number(levelWidth), Number(levelHeight))
        .composite([{ input: maskBuffer, blend: "dest-in" }])
        .toFile(getImagePath(outputDir, "temp-" + newImageId));

      if (rect && rect.width > 0 && rect.height > 0) {
        await sharp(getImagePath(outputDir, "temp-" + newImageId))
          .extract({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
          .toFile(getImagePath(outputDir, newImageId));

        await fs.unlink(getImagePath(outputDir, "temp-" + newImageId));
      } else {
        await fs.rename(
          getImagePath(outputDir, "temp-" + newImageId),
          getImagePath(outputDir, newImageId)
        );
      }

      // Update MongoDB document after successful clipping
      await updateImageDocument(userId, newImageId, "png");

      console.log(
        `[Job ${jobId}] Successfully clipped image ${originalImageId} to ${newImageId}`
      );
      return { status: "success", userId, outputDir, newImageId };
    } catch (error) {
      console.error(
        `[Job ${jobId}] Failed to clip image ${originalImageId}:`,
        error
      );

      // Update MongoDB document to mark clipping as failed
      try {
        if (mongoClient) {
          await updateImageDocument(userId, newImageId, null);
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
    } finally {
      await imageQueue.add("process-image", {
        userId: userId,
        imageId: newImageId,
        imageType: "png",
        originalName: "clipped-" + originalImageId + ".png",
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

console.log("Image clipping worker started");
