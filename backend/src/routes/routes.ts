import express from 'express';
import { uploadImage } from '../controllers/image/uploadController';
import { upload } from '../middlewares/multer';

const router = express.Router();

router.post('/image/upload', upload.single('image'), uploadImage);

export default router;