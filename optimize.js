import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const imagesDir = path.join(process.cwd(), "src/assets/images");

async function optimizeImages() {
  const images = [
    { src: path.join(imagesDir, "new-story-1.png"), dest: path.join(imagesDir, "new-story-1-temp.webp") },
    { src: path.join(imagesDir, "new-story-2.jpg"), dest: path.join(imagesDir, "new-story-2-temp.webp") },
    { src: path.join(imagesDir, "new-story-3.jpg"), dest: path.join(imagesDir, "new-story-3-temp.webp") },
    { src: path.join(imagesDir, "new-story-4.jpg"), dest: path.join(imagesDir, "new-story-4-temp.webp") },
    { src: path.join(imagesDir, "new-story-5.jpg"), dest: path.join(imagesDir, "new-story-5-temp.webp") },
    { src: path.join(imagesDir, "new-story-6.jpg"), dest: path.join(imagesDir, "new-story-6-temp.webp") },
    { src: path.join(imagesDir, "new-story-7.jpg"), dest: path.join(imagesDir, "new-story-7-temp.webp") },
    { src: path.join(imagesDir, "new-story-8.jpg"), dest: path.join(imagesDir, "new-story-8-temp.webp") },
    { src: path.join(imagesDir, "new-story-9.jpg"), dest: path.join(imagesDir, "new-story-9-temp.webp") }
  ];

  for (const img of images) {
    try {
      console.log(`Optimizing ${img.src}...`);
      await sharp(img.src)
        .resize({ width: 1280, withoutEnlargement: true }) // Max width 1280px (720p HD)
        .webp({ quality: 60 }) // Aggressive compression WebP
        .toFile(img.dest);
      
      console.log(`Successfully created ${img.dest}`);
      
      // Delete original to save space
      await fs.unlink(img.src);
      // Rename temp to original name but with webp extension
      const finalDest = img.src.replace(/\.(png|jpg)$/, '.webp');
      await fs.rename(img.dest, finalDest);
    } catch (err) {
      console.error(`Error optimizing ${img.src}:`, err);
    }
  }
}

optimizeImages();
