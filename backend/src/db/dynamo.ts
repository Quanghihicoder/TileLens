import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const region = process.env.AWS_REGION || "ap-southeast-2"

let ddbDocClient: DynamoDBDocumentClient;

export async function connectDynamoDB() {
  const client = new DynamoDBClient({
    region: region,
  });

  ddbDocClient = DynamoDBDocumentClient.from(client);
  console.log("Connected to DynamoDB");
}

export function getDynamoDb(): DynamoDBDocumentClient {
  if (!ddbDocClient) throw new Error("DynamoDB not initialized");
  return ddbDocClient;
}