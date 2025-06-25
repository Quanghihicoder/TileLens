import multer, { FileFilterCallback} from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { nanoid } from 'nanoid';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import dotenv from "dotenv";
dotenv.config();

const environment = process.env.NODE_ENV || "development"
const region = process.env.AWS_REGION || "ap-southeast-2"
const bucketName = process.env.BUCKET_NAME || "tilelens"
const imageDir = process.env.IMAGE_DIR || "/assets/images"
const MAX_FILE_SIZE_MB = 50

let storage: multer.StorageEngine;

if (environment === 'production') {
  const s3 = new S3Client({
    region: region,
  });

  storage = multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: Request, file: Express.Multer.File, cb) => {
      const user = (req as any).user;
      if (!user?.id) return cb(new Error('Unauthorized: Missing user ID'), '');

      const extension = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${imageDir}/${user.id}/${nanoid()}${extension}`;
      cb(null, uniqueName);
    },
  });
} else {
  const paths = imageDir.split('/').filter(Boolean)
  const baseUploadDir = path.join(__dirname, '..', '..', `${paths[0]}`, `${paths[1]}`);

  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const user = (req as any).user;
      if (!user?.id) return cb(new Error('Unauthorized: Missing user ID'), '');

      const userUploadDir = path.join(baseUploadDir, String(user.id));
      if (!fs.existsSync(userUploadDir)) {
        fs.mkdirSync(userUploadDir, { recursive: true });
      }

      cb(null, userUploadDir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const extension = path.extname(file.originalname);
      const id = nanoid();
      const uniqueName = `${id}${extension.toLowerCase()}`;
      cb(null, uniqueName);
    },
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 }, // 50MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg formats allowed!'));
    }
  },
});
