import express from 'express';
import { uploadImage } from '../controllers/image/uploadController';
import { login, logout, currentUser } from '../controllers/auth/authController'
import { upload } from '../middlewares/multer';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/current_user', currentUser);

router.post('/image/upload', requireAuth, upload.single('image'), uploadImage);


export default router;