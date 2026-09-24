import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const imagesDir = path.join(process.cwd(), "src/assets/images");
const publicDir = path.join(process.cwd(), "public");

async function optimizeImages() {
  const images = [
    { src: path.join(imagesDir, "slide-1.jpg"), dest: path.join(imagesDir, "slide-1.webp") },
    { src: path.join(imagesDir, "slide-2.jpg"), dest: path.join(imagesDir, "slide-2.webp") },
    { src: path.join(imagesDir, "slide-3.jpg"), dest: path.join(imagesDir, "slide-3.webp") },
    { src: path.join(imagesDir, "slide-4.jpg"), dest: path.join(imagesDir, "slide-4.webp") },
    { src: path.join(imagesDir, "slide-5.jpg"), dest: path.join(imagesDir, "slide-5.webp") },
    { src: path.join(imagesDir, "slide-6.jpg"), dest: path.join(imagesDir, "slide-6.webp") },
    { src: path.join(imagesDir, "slide-7.jpg"), dest: path.join(imagesDir, "slide-7.webp") },
    { src: path.join(publicDir, "hero-bg.jpg"), dest: path.join(publicDir, "hero-bg.webp") }
  ];

  for (const img of images) {
    try {
      console.log(`Optimizing ${img.src}...`);
      await sharp(img.src)
        .resize({ width: 1920, withoutEnlargement: true }) // Max width 1920px for HD displays
        .webp({ quality: 75 }) // High compression WebP
        .toFile(img.dest);
      
      console.log(`Successfully created ${img.dest}`);
      
      // Delete original to save space
      await fs.unlink(img.src);
    } catch (err) {
      console.error(`Error optimizing ${img.src}:`, err);
    }
  }
}

optimizeImages();
