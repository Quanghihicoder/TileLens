import * as express from 'express';
import { File } from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: File;          // for single file upload
      files?: File[];       // for multiple files upload
    }
  }
}
