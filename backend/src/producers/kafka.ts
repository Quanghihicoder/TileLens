import { Kafka, SASLOptions } from "kafkajs";
import { getIO } from "../sockets/socket";
import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Topics
const audioSendTopic = "audio.send";
const transcriptionResultsTopic = "transcription.results";

const commonConfig = {
  clientId: "tilelens",
};

const productionConfig = {
  brokers: (process.env.AWS_MSK_BROKERS || "").split(","),
  ssl: true,
  sasl: {
    mechanism: process.env.AWS_MSK_AUTH_MECHANISM as "aws" | "plain" | "scram-sha-256" | "scram-sha-512",
    authorizationIdentity: process.env.AWS_MSK_IAM_ARN,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  } as SASLOptions
};

const developmentConfig = {
  brokers: ["kafka:9092"], 
  ssl: false,
};

const kafka = new Kafka({
  ...commonConfig,
  ...(isProd ? productionConfig : developmentConfig)
});

// it should export producer
const admin = kafka.admin();
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "speech-to-text-group" });

async function waitForKafkaTopicReady(topic: string, timeoutMs = 30000) {
  await admin.connect();

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
      const topicMeta = metadata.topics.find((t) => t.name === topic);

      if (topicMeta && topicMeta.partitions.length > 0) {
        const allHaveLeaders = topicMeta.partitions.every(
          (p) => p.leader !== -1
        );
        if (allHaveLeaders) {
          console.log(`✅ Kafka topic "${topic}" is fully ready.`);
          await admin.disconnect();
          return;
        }
      }
    } catch (err) {
      console.log(`⏳ Waiting for topic "${topic}" metadata to stabilize...`);
    }

    await new Promise((res) => setTimeout(res, 2000));
  }

  await admin.disconnect();
  throw new Error(`❌ Kafka topic "${topic}" not ready after ${timeoutMs}ms`);
}

async function connectKafka() {
  await producer.connect();
  await consumer.connect();

  // Subscribe to multiple topics with one consumer
  await consumer.subscribe({
    topic: transcriptionResultsTopic,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      const result = JSON.parse(message.value.toString());

      if (topic === transcriptionResultsTopic) {
        try {
          const io = getIO();
          io.to(result.sessionId).emit("transcription:received", {
            text: result.text,
            isFinal: result.isFinal,
          });
        } catch (socketError) {
          console.error(
            `Failed to emit to socket ${result.sessionId}:`,
            socketError
          );
        }
      }
    },
  });
}

export {
  producer,
  audioSendTopic,
  transcriptionResultsTopic,
  connectKafka,
  waitForKafkaTopicReady,
};
