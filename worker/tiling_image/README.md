# 🧩 Image Tiles Generator

This tool resizes an image to preserve its aspect ratio and generates 256x256 pixel tiles, 
handling edge cases where the image dimensions are not perfectly divisible by 256.

---

## 📐 Resize Logic
- The aspect ratio is calculated as:
  ratio = width / height

- This ratio is preserved regardless of scaling or zooming to maintain pixel fidelity.

- Determine the longest side (width or height) and resize accordingly:
  - If ratio > 1 (horizontal rectangle):
    - width = MaxDimension
    - height = MaxDimension / ratio
  - If ratio < 1 (vertical rectangle):
    - height = MaxDimension
    - width = MaxDimension * ratio

---

## ✂️ Tiling & Cropping Logic
- Tiles are fixed at 256x256 pixels.
- If the image width and height are divisible by 256 (e.g., width % 256 == 0), tiling is perfect.
- If not, the last row or column of tiles overlaps with the previous one:
  - Example: image width % 256 = 100 → last tile overlaps 156px with the previous tile.
- The same applies to height.

![Cropping Logic](https://github.com/Quanghihicoder/completed_challenges/blob/master/propelleraero/images/cut_logic.jpeg)

---

## 🚀 How to Run Locally

Using Node.js (v20.3.0 or newer):
  yarn install
  yarn start sample_0.png

Using Docker:
  1. Ensure Docker is running.
  2. Build the image:
     ./build.sh
  3. Run the tool:
     ./run.sh sample_0.png

---