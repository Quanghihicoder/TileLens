import { Request, Response } from "express";
import { MulterError } from "multer";
import { createClippedImage, createImage } from "../../models/imageModel";
import imageQueue from "../../queues/imageQueue";
import clipQueue from "../../queues/clipQueue";
import { nanoid } from 'nanoid';

export const uploadImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No image uploaded" });
      return;
    }

    const user = (req as any).user;
    if (!user?.id) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No user ID" });
      return;
    }

    const { originalname, filename } = req.file;
    const [imageId, ...extensionParts] = filename.split(".");
    const imageType = extensionParts.join("."); // handle case image.ff.png

    await createImage(user.id, imageId, originalname, imageType);

    await imageQueue.add("process-image", {
      userId: user.id,
      imageId,
      imageType,
      originalName: originalname,
    });

    const imageUrl = `/assets/images/${user.id}/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
    });
  } catch (err) {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        message: "File too large. Max allowed size is 50MB.",
      });
    } else {
      console.error("Upload error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
};

export const uploadClipped = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ success: false, message: "No image clipped data" });
      return;
    }

    const user = (req as any).user;
    if (!user?.id) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No user ID" });
      return;
    }

    const data = req.body;

    if (!data.imageId || data.paths.length < 3 || Number(data.width) <= 0 || Number(data.height) <= 0) {
      res.status(400).json({ success: false, message: "Invalid clipped data" });
      return;
    }

    const imageId = nanoid(); 
    const originalname= "clipped-" + data.imageId

    await createClippedImage(user.id, imageId, originalname);

    await clipQueue.add("clip-image", {
      userId: user.id,
      newImageId: imageId,
      originalImageId: data.imageId,
      levelWidth: data.width,
      levelHeight: data.height,
      clipPaths: data.paths
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Clipping error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
