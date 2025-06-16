import { getNumberOfLevelsForImage } from "../produceTiles";

describe("getNumberOfLevelsForImage", () => {
  const squareCases = [
    [[1, 1], 1],
    [[2, 2], 2],
    [[3, 3], 3],
    [[4, 4], 3],
    [[8, 8], 4],
  ] as const;
  test.each(squareCases)(
    "creates the correct number of levels for a square image dimension of %s",
    ([width, height], numberOfLevels) => {
      expect(getNumberOfLevelsForImage(width, height)).toEqual(numberOfLevels);
    }
  );
  const rectangleCases = [
    [[1, 2], 2],
    [[2, 3], 3],
    [[16, 8], 5],
  ] as const;
  test.each(rectangleCases)(
    "creates the correct number of levels for a rectangle image dimension of %s",
    ([width, height], numberOfLevels) => {
      expect(getNumberOfLevelsForImage(width, height)).toEqual(numberOfLevels);
    }
  );
});
