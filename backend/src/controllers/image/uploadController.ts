import { Request, Response } from 'express';
import { MulterError } from 'multer';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image uploaded' });
      return;
    }

    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ success: false, message: 'Unauthorized: No user ID' });
      return;
    }

    const imageUrl = `/assets/images/${user.id}/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
    });
  } catch (err) {
    if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: 'File too large. Max allowed size is 50MB.',
      });
    } else {
      console.error('Upload error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};
