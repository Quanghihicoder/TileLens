import multer, { FileFilterCallback} from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE_MB = 50

const baseUploadDir = path.join(__dirname, '..', '..', 'assets', 'images');

// Ensure directory exists
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const user = (req as any).user;
    if (!user?.id) {
      return cb(new Error('Unauthorized: Missing user ID'), '');
    }

    const userUploadDir = path.join(baseUploadDir, String(user.id));
    
    // Ensure user folder exists
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    cb(null, userUploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const extension = path.extname(file.originalname); 
    const id = nanoid(); 
    const uniqueName = `${id}${extension.toLowerCase()}`; 
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});
