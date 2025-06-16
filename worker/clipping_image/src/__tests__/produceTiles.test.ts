import { Image } from "../Image";
import produceTiles from "../produceTiles";

const mockSave = jest.fn();

const createImageMock = (
  properties: { width: number; height: number },
  mocks = { mockSave }
): Image => {
  return {
    resize: jest
      .fn()
      .mockImplementation((width: number, height: number) =>
        createImageMock({ width, height }, mocks)
      ),
    save: mocks.mockSave,
    extract: jest
      .fn()
      .mockImplementation(
        (left: number, top: number, width: number, height: number) =>
          left + width > properties.width || top + height > properties.height
            ? Promise.reject("Invalid extract")
            : createImageMock({ width, height }, mocks)
      ),
    properties,
  };
};

describe("produceTiles", () => {
  beforeEach(() => {
    mockSave.mockClear();
  });

  it("should produce the correct tiles if the image is square and its size is equal to the maxTileDimension", async () => {
    await produceTiles(createImageMock({ width: 4, height: 4 }), "path", 4, {
      prepareLevelDirectory: async (path, level) => `${path}/${level}`,
    });
    expect(mockSave).toHaveBeenCalledTimes(3);
    expect(mockSave).toHaveBeenCalledWith("path/0/0_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/1/0_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/2/0_0.png");
  });

  it("should produce the correct tiles if the image is square and its size is double the maxTileDimension", async () => {
    // TODO: Write this test
    await produceTiles(createImageMock({ width: 8, height: 8 }), "path", 4, {
      prepareLevelDirectory: async (path, level) => `${path}/${level}`,
    });
  
    expect(mockSave).toHaveBeenCalledTimes(6);
    expect(mockSave).toHaveBeenCalledWith("path/0/0_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/1/0_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/2/0_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/2/0_1.png");
    expect(mockSave).toHaveBeenCalledWith("path/2/1_0.png");
    expect(mockSave).toHaveBeenCalledWith("path/2/1_1.png");
  });
});