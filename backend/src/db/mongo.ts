import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoURL = process.env.MONGO_URI

let db: Db;

export async function connectMongo() {
  const uri = mongoURL;
  const client = new MongoClient(uri!);
  await client.connect();

  db = client.db();
  console.log("Connected to MongoDB:", db.databaseName);

  await db.collection("logs").createIndex({ timestamp: 1 });
}

export function getMongoDb(): Db {
  if (!db) throw new Error("MongoDB not initialized");
  return db;
}