import { Request, Response } from 'express';
import { getImagesByUserId, getImageByImageId } from '../../models/imageModel';

export const getImagesByUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return; 
    }

    const images = await getImagesByUserId(userId);
    res.status(200).json({ success: true, images });
  } catch (err) {
    console.error('Error fetching images by user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const image = await getImageByImageId(imageId);
    if (!image) {
      res.status(404).json({ success: false, message: 'Image not found' });
      return; 
    }

    res.status(200).json({ success: true, image });
  } catch (err) {
    console.error('Error fetching image by ID:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};