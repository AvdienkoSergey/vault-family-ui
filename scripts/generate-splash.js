#!/usr/bin/env node
/**
 * Generates splash-icon.png — a white shield+lock SVG rendered to PNG.
 * Requires: npm install --save-dev sharp
 */

const sharp = require("sharp");
const path = require("path");

const SIZE = 1024;
const OUT = path.join(__dirname, "../assets/images/splash-icon.png");

// SVG: shield with a keyhole lock, white on transparent background
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
  <!-- Shield -->
  <path
    d="M50 8 L86 22 L86 52 C86 72 68 88 50 94 C32 88 14 72 14 52 L14 22 Z"
    fill="white"
    fill-opacity="0.95"
  />
  <!-- Lock body -->
  <rect x="36" y="52" width="28" height="22" rx="4" ry="4" fill="#0d0d14"/>
  <!-- Lock shackle -->
  <path
    d="M40 52 L40 44 A10 10 0 0 1 60 44 L60 52"
    fill="none"
    stroke="#0d0d14"
    stroke-width="5"
    stroke-linecap="round"
  />
  <!-- Keyhole -->
  <circle cx="50" cy="61" r="4" fill="white"/>
  <rect x="47.5" y="61" width="5" height="7" rx="1" fill="white"/>
</svg>
`.trim();

async function main() {
  await sharp(Buffer.from(svg))
    .png()
    .resize(SIZE, SIZE)
    .toFile(OUT);

  console.log(`✓ Splash icon generated → ${OUT}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
