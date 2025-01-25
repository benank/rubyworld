import { Jimp, intToRGBA } from "jimp";
import fs from "fs";

async function classifyTiles(
  imagePath: string,
  outputPath: string
): Promise<void> {
  try {
    const image = await Jimp.read(imagePath);
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;

    if (imageWidth % 16 !== 0 || imageHeight % 16 !== 0) {
      throw new Error("Image dimensions must be multiples of 16.");
    }

    const tileWidth = 16;
    const tileHeight = 16;
    const gridWidth = imageWidth / tileWidth;
    const gridHeight = imageHeight / tileHeight;

    let output = "";

    for (let y = 0; y < gridHeight; y++) {
      let row = "";
      for (let x = 0; x < gridWidth; x++) {
        let tileType = 1; // Default to 1

        // Analyze the tile
        for (let ty = 0; ty < tileHeight; ty++) {
          for (let tx = 0; tx < tileWidth; tx++) {
            const pixelColor = image.getPixelColor(
              x * tileWidth + tx,
              y * tileHeight + ty
            );
            const { r, g, b } = intToRGBA(pixelColor); // Extract red channel for simplicity, assuming character colors are distinct

            // Red or water
            if (
              (r == 255 && b == 0 && g == 0) || // Red
              (r == 153 && g == 177 && b == 255) || // Water
              (r == 0 && g == 0 && b == 0) // Empty
            ) {
              tileType = 0;
            }
          }
          if (tileType === 0) break; //No need to check further rows in this tile if already classified
        }

        row += tileType;
      }
      output += row + "\n";
    }

    fs.writeFileSync(outputPath, output);
    console.log(`Tile classification written to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example usage:
classifyTiles("public/assets/map_collision.png", "public/assets/collision.txt");
