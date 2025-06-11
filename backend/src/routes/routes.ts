import express from 'express';
import { uploadImage } from '../controllers/image/uploadController';
import { getImagesByUser, getImage } from '../controllers/image/getController';
import { login, logout, currentUser } from '../controllers/auth/authController'
import { upload } from '../middlewares/multer';
import { requireAuth, requireOwnData } from '../middlewares/auth';


const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/current_user', currentUser);

router.post('/image/upload', requireAuth, upload.single('image'), uploadImage);

router.get('/image/:userId', requireAuth, requireOwnData, getImagesByUser);
router.get('/image/:userId/:imageId', requireAuth, requireOwnData, getImage);


export default router;