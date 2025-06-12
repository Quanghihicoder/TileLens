import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes/routes';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { requireAuth, requireOwnData } from './middlewares/auth';
import { connectMongo } from './db/mongo';

dotenv.config();

const app = express();
const __dirname = path.resolve();

const allowedOrigins = process.env.ALLOW_ORIGIN?.split(',') || [];

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

app.use(express.static(path.join(__dirname, './site/')));

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, './site/index.html'))
});

app.use('/api', routes);

app.get('/assets/tiles/:userId/:imageId/:z/:x/:y', requireAuth, requireOwnData, (req: Request, res: Response) => {
  const { userId, imageId, z, x, y } = req.params;
  const filePath = path.join(__dirname, 'assets', 'tiles', userId, imageId, z, x, y);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    sendError(req, res);
  }
});

app.get('/assets/images/:userId/:filename', requireAuth, requireOwnData, (req: Request, res: Response) => {
  const { userId, filename } = req.params;
  const filePath = path.join(__dirname, 'assets', 'images', userId, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    sendError(req, res);
  }
});

app.use((req: Request, res: Response) => {
  sendError(req, res);
});

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    await connectMongo(); // 👈 Ensure MongoDB is connected first
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1); 
  }
})();