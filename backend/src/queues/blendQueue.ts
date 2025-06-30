import { Queue as BullQueue } from "bullmq";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const region = process.env.AWS_REGION || "ap-southeast-2"
const queueURL = process.env.SQS_BLENDING_QUEUE_URL!
const redisHost = process.env.REDIS_HOST || "redis"
const redisPort = Number(process.env.REDIS_PORT) || 6379

let blendQueue: any;

if (isProd) {
  const sqs = new SQSClient({
    region: region,
  });

  blendQueue = {
    add: async (name: string, data: any) => {
      const command = new SendMessageCommand({
        QueueUrl: queueURL,
        MessageBody: JSON.stringify({
          type: name,
          payload: data,
        }),
      });
      await sqs.send(command);
    },
  };
} else {
  const connection = {
    host: redisHost,
    port: redisPort
  };

  const bullQueue = new BullQueue("image-blending", { connection });

  blendQueue = {
    add: async (name: string, data: any) => {
      await bullQueue.add(name, data);
    },
    _bull: bullQueue, // access the raw BullMQ queue
  };
}

export default blendQueue;