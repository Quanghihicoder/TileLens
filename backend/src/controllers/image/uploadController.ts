import { Request, Response } from "express";
import { MulterError } from "multer";
import { createClippedImage, createBlendedImage, createImage } from "../../models/image";
import tileQueue from "../../queues/tileQueue";
import clipQueue from "../../queues/clipQueue";
import blendQueue from "../../queues/blendQueue";
import path from "path";
import { nanoid } from 'nanoid';
import dotenv from "dotenv";
dotenv.config();

const imageDir = process.env.IMAGE_DIR || "/assets/images"
const environment = process.env.NODE_ENV || "development"

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

    let imageId: string;
    let imageType: string;
    let originalname: string;

    if (environment === "development") {
      const file = req.file as Express.Multer.File;
      if (!file?.filename || !file?.originalname) {
        throw new Error("Invalid file data in development mode");
      }
    
      originalname = file.originalname;
      const [id, ...extParts] = file.filename.split(".");
      imageId = id;
      imageType = extParts.join(".");
    } else {
      const file = req.file as any;
      if (!file?.key || !file?.originalname) {
        throw new Error("Invalid file data in production mode");
      }
    
      originalname = file.originalname;
      const baseFilename = path.basename(file.key);
      const [id, ...extParts] = baseFilename.split(".");
      imageId = id;
      imageType = extParts.join(".");
    }
   
    await createImage(user.id, imageId, originalname, imageType);

    await tileQueue.add("tile-image", {
      userId: user.id,
      imageId,
      imageType,
      originalName: originalname,
    });

    const imageUrl = `${imageDir}/${user.id}/${req.file.filename}`;
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


export const uploadBlended = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ success: false, message: "No image blended data" });
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

    if (!data.imageId || data.pastedImages.length <= 0 || Number(data.width) <= 0 || Number(data.height) <= 0) {
      res.status(400).json({ success: false, message: "Invalid blended data" });
      return;
    }

    const imageId = nanoid(); 
    const originalname= "blended-" + data.imageId

    await createBlendedImage(user.id, imageId, originalname);

    await blendQueue.add("blend-image", {
      userId: user.id,
      newImageId: imageId,
      originalImageId: data.imageId,
      levelWidth: data.width,
      levelHeight: data.height,
      pastedImages: data.pastedImages
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Blending error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
