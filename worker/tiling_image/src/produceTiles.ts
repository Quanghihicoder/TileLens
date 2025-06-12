import { Image } from "./Image";
import { getImagePath, prepareLevelDirectory, prepareXYDirectory } from "./utilities";

export const getNumberOfLevelsForImage = (width: number, height: number) => {
  const maxDimension = Math.max(width, height);
  return Math.ceil(1 + Math.log10(maxDimension));
};

const produceTiles = async (
  image: Image,
  outputPath: string,
  maxTileDimension: number,
  deps = { prepareLevelDirectory, prepareXYDirectory }
) => {
  const { width, height } = image.properties;
  const maxDimension = Math.max(width, height);
  const numberOfLevels = getNumberOfLevelsForImage(width, height);

  console.log(`Number of levels expected: ${numberOfLevels}`);

  for (let tileLevel = 0; tileLevel < numberOfLevels; tileLevel++) {
    const levelMaxDimension = Math.ceil(
      maxDimension / 2 ** (numberOfLevels - 1 - tileLevel)
    );
    const tileLevelDirectory = await deps.prepareLevelDirectory(
      outputPath,
      tileLevel
    );

    const ratio = width / height;
    const levelWidth = ratio > 1 ? levelMaxDimension : Math.ceil(levelMaxDimension * ratio);
    const levelHeight = ratio > 1 ? Math.ceil(levelMaxDimension / ratio) : levelMaxDimension;

    const resized = await image.resize(levelWidth, levelHeight);

    if (levelMaxDimension >= maxTileDimension) {
      const maxNumTileWidth = Math.ceil(levelWidth / maxTileDimension);
      const maxNumTileHeight = Math.ceil(levelHeight / maxTileDimension);

      for (let x = 0; x < maxNumTileWidth; x++) {
        const xDirectory = await deps.prepareXYDirectory(tileLevelDirectory, x);

        for (let y = 0; y < maxNumTileHeight; y++) {
          const extracted = await resized.extract(
            (x == maxNumTileWidth - 1 && levelWidth - 1 > maxTileDimension) 
              ? (levelWidth - maxTileDimension - 1) 
              : x * maxTileDimension,
            (y == maxNumTileHeight - 1 && levelHeight - 1 > maxTileDimension) 
              ? (levelHeight - maxTileDimension - 1) 
              : y * maxTileDimension,
            levelWidth - 1 > maxTileDimension ? maxTileDimension : levelWidth - 1,
            levelHeight - 1 > maxTileDimension ? maxTileDimension : levelHeight - 1
          );
          await extracted.save(getImagePath(xDirectory, y));
        }
      }
    } else {
      const xDirectory = await deps.prepareXYDirectory(tileLevelDirectory, 0);
      await resized.save(getImagePath(xDirectory, 0));
    }
  }
};

export default produceTiles;