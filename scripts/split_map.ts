import { Jimp } from "jimp";
import fs from "fs";

(async () => {
  // Input image path
  const inputImagePath = "public/assets/map.png";
  // Output directory for tiles
  const outputDir = "public/assets/tiles";

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Load the input image
    const image = await Jimp.read(inputImagePath);

    // Get image dimensions
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;

    // Tile size
    const tileSize = 192;

    // Iterate over the image in 128x128 tiles
    for (let y = 0; y < imageHeight; y += tileSize) {
      for (let x = 0; x < imageWidth; x += tileSize) {
        // Crop the tile from the image
        const tile = image.clone().crop({ x, y, w: tileSize, h: tileSize });

        // Save the tile
        console.log(`Saving tile map_${x}_${y}.png`);
        tile.write(`${outputDir}/map_${x}_${y}.png`);
      }
    }

    console.log("Image successfully split into tiles.");
  } catch (error) {
    console.error("Error processing the image:", error);
  }
})();
