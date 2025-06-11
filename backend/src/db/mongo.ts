import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db: Db;

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri!);
  await client.connect();

  db = client.db(); // uses db from URI (e.g. mycustomdb)
  console.log("Connected to MongoDB:", db.databaseName);

  // Optional: Ensure indexes or initial collections
  await db.collection("logs").createIndex({ timestamp: 1 });
}

export function getMongoDb(): Db {
  if (!db) throw new Error("MongoDB not initialized");
  return db;
}