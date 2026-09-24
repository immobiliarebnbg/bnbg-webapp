import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const imagesDir = path.join(process.cwd(), "src/assets/images");
const publicDir = path.join(process.cwd(), "public");

async function optimizeImages() {
  const images = [
    { src: path.join(imagesDir, "slide-1.webp"), dest: path.join(imagesDir, "slide-1-temp.webp") },
    { src: path.join(imagesDir, "slide-2.webp"), dest: path.join(imagesDir, "slide-2-temp.webp") },
    { src: path.join(imagesDir, "slide-3.webp"), dest: path.join(imagesDir, "slide-3-temp.webp") },
    { src: path.join(imagesDir, "slide-4.webp"), dest: path.join(imagesDir, "slide-4-temp.webp") },
    { src: path.join(imagesDir, "slide-5.webp"), dest: path.join(imagesDir, "slide-5-temp.webp") },
    { src: path.join(imagesDir, "slide-6.webp"), dest: path.join(imagesDir, "slide-6-temp.webp") },
    { src: path.join(imagesDir, "slide-7.webp"), dest: path.join(imagesDir, "slide-7-temp.webp") },
    { src: path.join(imagesDir, "hero-bg.webp"), dest: path.join(imagesDir, "hero-bg-temp.webp") }
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
      // Rename temp to original
      await fs.rename(img.dest, img.src);
    } catch (err) {
      console.error(`Error optimizing ${img.src}:`, err);
    }
  }
}

optimizeImages();
