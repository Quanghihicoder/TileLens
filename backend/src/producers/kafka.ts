import { Admin, Consumer, Kafka, Producer } from "kafkajs";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const brokers = process.env.MSK_BROKERS?.split(",") || ["kafka:9092"];
const audioSendTopic = "audio.send";
const transcriptionResultsTopic = "transcription.results";

async function getKafkaConfig() {
  const config = {
    brokers: brokers,
    clientId: "tilelens",
  };

  return config;
}

async function waitForKafkaTopicReady(admin: Admin, topic: string, timeoutMs = 30000) {
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

async function connectKafka(producer: Producer, consumer: Consumer, io: Server) {
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
  audioSendTopic,
  transcriptionResultsTopic,
  getKafkaConfig,
  connectKafka,
  waitForKafkaTopicReady,
};
