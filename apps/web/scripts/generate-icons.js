const fs = require("fs");
const path = require("path");

// Minimal PNG generator - creates valid but simple PNG files
// In production, replace with proper icon generation (e.g., using sharp, canvas, or design tools)

function createPNG(width, height, color = [26, 26, 46]) {
  // Create a minimal valid PNG with a solid color
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: truecolor
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrCrc = crc32(Buffer.concat([Buffer.from("IHDR"), ihdrData]));
  const ihdr = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from("IHDR"),
    ihdrData,
    Buffer.from(ihdrCrc.toString(16).padStart(8, "0"), "hex"),
  ]);

  // IDAT chunk - simple solid color image
  const rowSize = width * 3 + 1; // +1 for filter byte
  const imageData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    imageData[y * rowSize] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      imageData[y * rowSize + 1 + x * 3] = color[0]; // R
      imageData[y * rowSize + 1 + x * 3 + 1] = color[1]; // G
      imageData[y * rowSize + 1 + x * 3 + 2] = color[2]; // B
    }
  }
  const compressed = zlib.deflateSync(imageData);
  const idatCrc = crc32(Buffer.concat([Buffer.from("IDAT"), compressed]));
  const idat = Buffer.concat([
    Buffer.from(compressed.length.toString(16).padStart(8, "0"), "hex"),
    Buffer.from("IDAT"),
    compressed,
    Buffer.from(idatCrc.toString(16).padStart(8, "0"), "hex"),
  ]);

  // IEND chunk
  const iendCrc = crc32(Buffer.from("IEND"));
  const iend = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("IEND"),
    Buffer.from(iendCrc.toString(16).padStart(8, "0"), "hex"),
  ]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const zlib = require("zlib");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "public", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const png = createPNG(size, size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), png);
  console.log(`Created icon-${size}x${size}.png`);
}

// Also create a simple favicon.ico (16x16, 32x32)
const favicon16 = createPNG(16, 16);
const favicon32 = createPNG(32, 32);
fs.writeFileSync(path.join(iconsDir, "favicon-16x16.png"), favicon16);
fs.writeFileSync(path.join(iconsDir, "favicon-32x32.png"), favicon32);

console.log(
  "All icons generated. Note: These are placeholder solid-color icons. Replace with proper branded icons.",
);
