const fs = require('fs');
const path = require('path');

// SVG icon template
const generateSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066ff"/>
      <stop offset="100%" style="stop-color:#00d9ff"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}" fill="url(#bg-gradient)"/>
  <!-- Folder icon -->
  <g transform="translate(${size * 0.1875}, ${size * 0.25}) scale(${size / 512})">
    <!-- Folder back -->
    <path d="M0 48C0 21.5 21.5 0 48 0h96l32 48h144c26.5 0 48 21.5 48 48v160c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V48z" fill="white" opacity="0.9"/>
    <!-- Document inside -->
    <rect x="80" y="80" width="160" height="120" rx="8" fill="#0066ff" opacity="0.3"/>
    <rect x="100" y="100" width="80" height="8" rx="4" fill="white"/>
    <rect x="100" y="120" width="120" height="8" rx="4" fill="white"/>
    <rect x="100" y="140" width="100" height="8" rx="4" fill="white"/>
    <rect x="100" y="160" width="60" height="8" rx="4" fill="white"/>
  </g>
</svg>`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');

// Ensure directories exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG icons (PNG would require sharp or similar)
sizes.forEach(size => {
  const svg = generateSvg(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Generate favicon SVGs
[16, 32].forEach(size => {
  const svg = generateSvg(size);
  fs.writeFileSync(path.join(iconsDir, `favicon-${size}x${size}.svg`), svg);
  console.log(`Generated favicon-${size}x${size}.svg`);
});

// Apple touch icon
const appleSvg = generateSvg(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleSvg);
console.log('Generated apple-touch-icon.svg');

// Create placeholder screenshots (simple colored rectangles as SVG)
const desktopScreenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <rect width="1280" height="720" fill="#f8fafc"/>
  <rect x="0" y="0" width="1280" height="64" fill="#ffffff"/>
  <rect x="40" y="16" width="120" height="32" rx="8" fill="#0066ff" opacity="0.1"/>
  <rect x="40" y="100" width="400" height="32" rx="4" fill="#1e293b"/>
  <rect x="40" y="150" width="300" height="16" rx="4" fill="#64748b"/>
  <g transform="translate(40, 200)">
    <rect width="280" height="160" rx="12" fill="white" stroke="#e2e8f0"/>
    <rect width="280" height="160" rx="12" fill="white" stroke="#e2e8f0" x="300"/>
    <rect width="280" height="160" rx="12" fill="white" stroke="#e2e8f0" x="600"/>
    <rect width="280" height="160" rx="12" fill="white" stroke="#e2e8f0" x="900"/>
  </g>
  <text x="640" y="500" text-anchor="middle" font-family="Arial" font-size="24" fill="#64748b">Dashboard Extranet Client</text>
</svg>`;

const mobileScreenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334">
  <rect width="750" height="1334" fill="#f8fafc"/>
  <rect x="0" y="0" width="750" height="120" fill="#ffffff"/>
  <rect x="30" y="40" width="80" height="40" rx="8" fill="#0066ff" opacity="0.1"/>
  <rect x="30" y="160" width="400" height="40" rx="4" fill="#1e293b"/>
  <rect x="30" y="220" width="300" height="20" rx="4" fill="#64748b"/>
  <g transform="translate(30, 280)">
    <rect width="690" height="200" rx="12" fill="white" stroke="#e2e8f0"/>
    <rect width="690" height="200" rx="12" fill="white" stroke="#e2e8f0" y="220"/>
    <rect width="690" height="200" rx="12" fill="white" stroke="#e2e8f0" y="440"/>
  </g>
  <text x="375" y="1000" text-anchor="middle" font-family="Arial" font-size="32" fill="#64748b">Documents Mobile</text>
</svg>`;

fs.writeFileSync(path.join(screenshotsDir, 'desktop-1.svg'), desktopScreenshot);
fs.writeFileSync(path.join(screenshotsDir, 'mobile-1.svg'), mobileScreenshot);
console.log('Generated placeholder screenshots');

console.log('\\nPWA icons generated successfully!');
console.log('Note: For production, convert SVGs to PNGs using:');
console.log('  - Online tools like svgtopng.com');
console.log('  - Or install sharp: npm install sharp');
