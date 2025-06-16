import { join } from "path";
import fs from "fs-extra";

export const setupOutputDir = async (path: string) => {
  const exists = await fs.pathExists(path);
  if (exists) {
    await fs.emptyDir(path);
    return;
  }
  await fs.mkdir(path);
};

export const getImagePath = (outDir: string, imageId: string) => join(outDir, `${imageId}.png`);
