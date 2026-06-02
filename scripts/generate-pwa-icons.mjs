import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const svgPath = path.join(root, "public/logo.svg");
const svg = fs.readFileSync(svgPath);

const outputs = [
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const { file, size, maskable } of outputs) {
  let pipeline = sharp(svg).resize(size, size);
  if (maskable) {
    pipeline = pipeline.extend({
      top: Math.round(size * 0.1),
      bottom: Math.round(size * 0.1),
      left: Math.round(size * 0.1),
      right: Math.round(size * 0.1),
      background: { r: 251, g: 250, b: 237, alpha: 1 },
    });
  }
  await pipeline.png().toFile(path.join(root, "public", file));
  console.log(`✓ public/${file}`);
}
