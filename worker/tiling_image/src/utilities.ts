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

export const prepareLevelDirectory = async (
  outputPath: string,
  level: number
) => {
  const tileLevelDirectory = join(outputPath, `${level}`);
  await fs.mkdir(tileLevelDirectory);
  return tileLevelDirectory;
};


export const prepareXYDirectory = async (
  levelPath: string,
  x: number
) => {
  const xDirectory = join(levelPath, `${x}`);
  await fs.mkdir(xDirectory, { recursive: true });
  return xDirectory;
};

export const getImagePath = (xDir: string, y: number) => join(xDir, `${y}.png`);
