import { Image } from "./Image";
import {
  getImagePath,
  prepareLevelDirectory,
  prepareXYDirectory,
} from "./utilities";

export const getNumberOfLevelsForImage = (width: number, height: number) => {
  const maxDimension = Math.max(width, height);
  return Math.ceil(1 + Math.log10(maxDimension));
};

type ProduceTilesOptions = {
  destination?: "local" | "s3";
  bucketName?: string;
  deps?: {
    prepareLevelDirectory?: typeof prepareLevelDirectory;
    prepareXYDirectory?: typeof prepareXYDirectory;
    saveImageToS3?: (
      bucket: string,
      key: string,
      image: Image
    ) => Promise<void>;
  };
};

const produceTiles = async (
  image: Image,
  outputPath: string,
  maxTileDimension: number,
  options: ProduceTilesOptions = {
    destination: "local",
    deps: { prepareLevelDirectory, prepareXYDirectory },
  }
) => {
  const { destination = "local", bucketName, deps = {} } = options;

  const {
    prepareLevelDirectory: prepLevel = prepareLevelDirectory,
    prepareXYDirectory: prepXY = prepareXYDirectory,
    saveImageToS3,
  } = deps;

  const { width, height } = image.properties;
  const maxDimension = Math.max(width, height);
  const numberOfLevels = getNumberOfLevelsForImage(width, height);

  console.log(`Number of levels expected: ${numberOfLevels}`);

  for (let tileLevel = 0; tileLevel < numberOfLevels; tileLevel++) {
    const levelMaxDimension = Math.ceil(
      maxDimension / 2 ** (numberOfLevels - 1 - tileLevel)
    );

    let tileLevelDirectory = "";

    if (destination == "local") {
      tileLevelDirectory = await prepLevel(outputPath, tileLevel);
    } else {
      tileLevelDirectory = outputPath + "/" + tileLevel.toString();
    }

    const ratio = width / height;
    const levelWidth =
      ratio > 1 ? levelMaxDimension : Math.ceil(levelMaxDimension * ratio);
    const levelHeight =
      ratio > 1 ? Math.ceil(levelMaxDimension / ratio) : levelMaxDimension;

    const resized = await image.resize(levelWidth, levelHeight);

    if (levelMaxDimension >= maxTileDimension) {
      const maxNumTileWidth = Math.ceil(levelWidth / maxTileDimension);
      const maxNumTileHeight = Math.ceil(levelHeight / maxTileDimension);

      for (let x = 0; x < maxNumTileWidth; x++) {
        let xDirectory = "";
        if (destination === "local") {
          xDirectory = await prepXY(tileLevelDirectory, x);
        } else {
          xDirectory = tileLevelDirectory + "/" + x.toString();
        }

        for (let y = 0; y < maxNumTileHeight; y++) {
          const extracted = await resized.extract(
            x == maxNumTileWidth - 1 && levelWidth - 1 > maxTileDimension
              ? levelWidth - maxTileDimension - 1
              : x * maxTileDimension,
            y == maxNumTileHeight - 1 && levelHeight - 1 > maxTileDimension
              ? levelHeight - maxTileDimension - 1
              : y * maxTileDimension,
            levelWidth - 1 > maxTileDimension
              ? maxTileDimension
              : levelWidth - 1,
            levelHeight - 1 > maxTileDimension
              ? maxTileDimension
              : levelHeight - 1
          );

          if (destination === "local") {
            await extracted.save(getImagePath(xDirectory, y));
          } else {
            if (!bucketName || !saveImageToS3) {
              throw new Error(
                "Missing bucketName or saveImageToS3() dependency for S3 destination."
              );
            }
            await saveImageToS3(
              bucketName,
              getImagePath(xDirectory, y),
              extracted
            );
          }
        }
      }
    } else {
      let xDirectory = "";
      if (destination === "local") {
        xDirectory = await prepXY(tileLevelDirectory, 0);
      } else {
        xDirectory = tileLevelDirectory + "/0";
      }

      if (destination == "local") {
        await resized.save(getImagePath(xDirectory, 0));
      } else {
        if (!bucketName || !saveImageToS3) {
          throw new Error(
            "Missing bucketName or saveImageToS3() dependency for S3 destination."
          );
        }
        await saveImageToS3(bucketName, getImagePath(xDirectory, 0), resized);
      }
    }
  }
};

export default produceTiles;
