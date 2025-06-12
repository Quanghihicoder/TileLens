import sharp from "sharp";

export interface Image {
  // resizes an image to be 'inside' the bounding box of width and height, preserving dimensions.
  resize: (width: number, height: number) => Promise<Image>;
  extract: (
    left: number,
    top: number,
    width: number,
    height: number
  ) => Promise<Image>;
  save: (path: string) => Promise<void>;
  properties: { width: number; height: number };
}
export const getImage = async (image: sharp.Sharp): Promise<Image> => {
  const {
    info: { width, height, channels },
    data,
  } = await image.rotate().raw().toBuffer({ resolveWithObject: true });
  const raw = await sharp(data, {
    raw: { width, height, channels },
  });
  return {
    resize: (width: number, height: number) =>
      getImage(
        raw.resize(width, height, {
          background: "black",
          fit: "inside",
          position: "left top",
        })
      ),
    extract: (left: number, top: number, width: number, height: number) =>
      getImage(
        raw.extract({
          left,
          top,
          width,
          height,
        })
      ),
    save: async (path: string) => {
      await raw.toFile(path);
    },
    properties: { width, height },
  };
};
