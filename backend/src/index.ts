import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes/routes';
import cookieParser from 'cookie-parser';
import { requireAuth, requireOwnData } from './middlewares/auth';
import { connectMongo } from './db/mongo';
import { connectDynamoDB } from './db/dynamo';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import dotenv from 'dotenv';
dotenv.config();

const environment = process.env.NODE_ENV || "development"
const port = process.env.PORT || 8000
const region = process.env.AWS_REGION || "ap-southeast-2"
const bucketName = process.env.BUCKET_NAME || "tilelens"
const imageDir = process.env.IMAGE_DIR || "/assets/images"
const tileDir = process.env.TILE_DIR || "/assets/tiles"
const allowedOrigins = process.env.ALLOW_ORIGIN?.split(',') || [];

const app = express();
const __dirname = path.resolve();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

const sendError = (req: Request, res: Response): void => {
  res.status(404);

  if (req.accepts('html')) {
    res.set('Content-Type', 'text/html');
    res.send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Not Found</title>
        <meta name="description" content="Page not found">
      </head>
      <body>
        <p>Not Found! Please check your URL.</p>
      </body>
      </html>
    `);
    return;
  }

  if (req.accepts('json')) {
    res.json({ status: 0, message: 'API not found!', data: [] });
    return;
  }

  res.type('txt').send('Not Found');
};

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api', routes);

let s3 = null

if (environment == "production") {
  s3 = new S3Client({
  region: region
});
}

app.get(`${tileDir}/:userId/:imageId/:z/:x/:y`, requireAuth, requireOwnData, async (req: Request, res: Response) => {
  const { userId, imageId, z, x, y } = req.params;

  if (environment == "production") {
    if (s3) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: `${tileDir}/${userId}/${imageId}/${z}/${x}/${y}`,
      });
  
      try {
        const s3Response = await s3.send(command);

        if (!s3Response.Body) {
          res.status(500).json({ error: "Missing image body from S3 response" });
        }
    
        res.setHeader("Content-Type", s3Response.ContentType || "image/png");
    
        if (s3Response.Body instanceof Readable) {
          s3Response.Body.pipe(res);
        } else {
          const readable = Readable.from(s3Response.Body as any);
          readable.pipe(res);
        }
      } catch (err) {
        res.status(500).json({ error: "Failed to generate signed URL" });
      }
    } else {
      res.status(500).json({ error: "Cannot connect to S3" });
    }
  } else {
    const paths = tileDir.split('/').filter(Boolean)
    const filePath = path.join(__dirname, paths[0], paths[1], userId, imageId, z, x, y);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      sendError(req, res);
    }
  }
});

app.get(`${imageDir}/:userId/:filename`, requireAuth, requireOwnData, async (req: Request, res: Response) => {
  const { userId, filename } = req.params;

  if (environment== "production") {
    if (s3) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: `${imageDir}/${userId}/${filename}`,
      });
  
      try {
        const s3Response = await s3.send(command);

        if (!s3Response.Body) {
          res.status(500).json({ error: "Missing image body from S3 response" });
        }
    
        res.setHeader("Content-Type", s3Response.ContentType || "image/png");
    
        if (s3Response.Body instanceof Readable) {
          s3Response.Body.pipe(res);
        } else {
          const readable = Readable.from(s3Response.Body as any);
          readable.pipe(res);
        }
      } catch (err) {
        res.status(500).json({ error: "Failed to generate signed URL" });
      }
    } else {
      res.status(500).json({ error: "Cannot connect to S3" });
    }
  } else {
    const paths = imageDir.split('/').filter(Boolean)
    const filePath = path.join(__dirname, paths[0], paths[1], userId, filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      sendError(req, res);
    }
  }
});

app.use((req: Request, res: Response) => {
  sendError(req, res);
});

const PORT = port;

(async () => {
  try {
    if (environment == "production") {
      await connectDynamoDB();
    } else {
      await connectMongo(); 
    }

    app.listen(PORT, () => {
      if (environment == "production") {
        console.log(`✅ Server is running on port: ${PORT}`);
      } else {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
      }
    });
  } catch (err) {
    if (environment == "production") {
      console.error('❌ Failed to connect to DynamoDB:', err);
    } else {
      console.error('❌ Failed to connect to MongoDB:', err);
    }
    process.exit(1); 
  }
})();