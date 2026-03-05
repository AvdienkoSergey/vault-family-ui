#!/usr/bin/env node
/**
 * Generates splash-icon.png — Vault Family splash with studio branding.
 * Requires: npm install --save-dev sharp
 *
 * v4 fixes:
 *  - Lock smaller: more breathing room
 *  - Radial gradient bg with subtle depth
 *  - "VAULT FAMILY" x-offset fixed for letter-spacing optical center
 *  - Tagline added below app name
 *  - Studio logo block (hex + ПЯТНАШКА + STUDIO) centered at x=512
 */

const sharp = require("sharp");
const path = require("path");

const SIZE = 1024;
const OUT = path.join(__dirname, "../assets/images/splash-icon.png");

const C = {
  bgDark: "#0F1420",
  bgMid: "#161C2E",
  primary: "#6366F1",
  primaryLt: "#818CF8",
  text: "#ECEEF4",
  textDim: "rgba(236,238,244,0.45)",
};

const s = 1.18;
const R = 38 * s;
const GAP = 8 * s;
const FONT_BRAND = 40 * s;
const TEXT_W = 8 * 0.62 * FONT_BRAND;
const BLOCK_W = 2 * R + GAP + TEXT_W;
const LOGO_CY = 940;
const HCX = 512 - BLOCK_W / 2 + R;
const TEXT_X = HCX + R + GAP;
const BRAND_Y = LOGO_CY - FONT_BRAND * 0.18;
const SUB_Y = LOGO_CY + FONT_BRAND * 0.6;
const FONT_SUB = 15 * s;

const hexPoints = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(HCX + R * Math.cos(a)).toFixed(2)},${(
    LOGO_CY +
    R * Math.sin(a)
  ).toFixed(2)}`;
}).join(" ");

const dotGrid = Array.from({ length: 7 }, (_, xi) =>
  Array.from(
    { length: 7 },
    (_, yi) =>
      `<circle cx="${128 + xi * 128}" cy="${128 + yi * 128}" r="1" fill="${
        C.primaryLt
      }" opacity="0.06"/>`
  ).join("")
).join("");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="72%">
      <stop offset="0%"   stop-color="#1B2240"/>
      <stop offset="100%" stop-color="${C.bgDark}"/>
    </radialGradient>
    <linearGradient id="lockGrad" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%"   stop-color="#9DA5FB"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
    <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#A5AFFC"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${C.primary}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${C.primary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bodyHL" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#FFFFFF" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#F5A623"/>
      <stop offset="45%"  stop-color="#E040D0"/>
      <stop offset="100%" stop-color="#7C4DFF"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#FF9500"/>
      <stop offset="30%"  stop-color="#FF5CAA"/>
      <stop offset="65%"  stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="1024" fill="${C.bgDark}"/>
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>
  ${dotGrid}

  <ellipse cx="512" cy="415" rx="270" ry="230" fill="url(#halo)"/>

  <path d="M 406 356 L 406 292 Q 406 224 512 224 Q 618 224 618 292 L 618 356"
        fill="none" stroke="url(#shackleGrad)" stroke-width="50"
        stroke-linecap="round" stroke-linejoin="round"/>

  <rect x="352" y="342" width="320" height="254" rx="36" fill="url(#lockGrad)"/>
  <rect x="352" y="342" width="320" height="254" rx="36" fill="url(#bodyHL)"/>

  <circle cx="512" cy="456" r="42" fill="${C.bgMid}"/>
  <rect   x="492" y="484" width="40" height="54" rx="12" fill="${C.bgMid}"/>

  <circle cx="455" cy="414" r="11" fill="${C.text}" opacity="0.27"/>
  <circle cx="512" cy="402" r="11" fill="${C.text}" opacity="0.37"/>
  <circle cx="569" cy="414" r="11" fill="${C.text}" opacity="0.27"/>

  <rect x="352" y="342" width="320" height="254" rx="36"
        fill="none" stroke="${C.primaryLt}" stroke-width="1.5" opacity="0.30"/>

  <text x="509" y="666"
        font-family="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
        font-size="56" font-weight="700" letter-spacing="5"
        fill="${
          C.text
        }" text-anchor="middle" dominant-baseline="middle">VAULT FAMILY</text>

  <text x="512" y="706"
        font-family="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
        font-size="19" font-weight="400" letter-spacing="2.5"
        fill="${
          C.textDim
        }" text-anchor="middle" dominant-baseline="middle">Семейный менеджер паролей</text>

  <line x1="382" y1="854" x2="642" y2="854"
        stroke="${C.primaryLt}" stroke-width="1" opacity="0.14"/>

  <polygon points="${hexPoints}" fill="url(#hexGrad)"/>
  <text x="${HCX.toFixed(1)}" y="${LOGO_CY}"
        font-family="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
        font-size="${(28 * s).toFixed(1)}" font-weight="900"
        fill="white" text-anchor="middle" dominant-baseline="central">15</text>
  <text x="${TEXT_X.toFixed(1)}" y="${BRAND_Y.toFixed(1)}"
        font-family="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
        font-size="${FONT_BRAND.toFixed(1)}" font-weight="800"
        letter-spacing="${(2.5 * s).toFixed(1)}"
        fill="url(#brandGrad)">ПЯТНАШКА</text>
  <text x="${TEXT_X.toFixed(1)}" y="${SUB_Y.toFixed(1)}"
        font-family="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
        font-size="${FONT_SUB.toFixed(1)}" font-weight="400"
        letter-spacing="${(5.5 * s).toFixed(1)}"
        fill="${C.textDim}">STUDIO</text>
</svg>
`.trim();

async function main() {
  await sharp(Buffer.from(svg)).png().resize(SIZE, SIZE).toFile(OUT);
  console.log(`✓ Splash icon generated → ${OUT}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
