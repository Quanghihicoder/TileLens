import http from "http";
import { Server } from "socket.io";
import { producer, audioSendTopic } from "../producers/kafka";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("audio:send", async (audioData) => {
      try {
        // Send audio chunk to Kafka for processing
        await producer.send({
          topic: audioSendTopic,
          messages: [
            {
              value: JSON.stringify({
                sessionId: socket.id,
                audio: audioData.toString("base64"),
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        });
      } catch (error) {
        console.error("Error sending to Kafka:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};


