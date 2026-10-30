const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
];

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

for (const vp of viewports) {
  const outFile = path.join(outDir, `${vp.name}.png`);
  console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
  const args = [
    '--headless',
    '--disable-gpu',
    `--window-size=${vp.width},${vp.height}`,
    `--screenshot=${outFile}`,
    'http://localhost:5173'
  ];
  try {
    execFileSync(edgePath, args, { stdio: 'ignore', timeout: 15000 });
    const stat = fs.statSync(outFile);
    console.log(`✓ Saved ${vp.name}.png (${Math.round(stat.size / 1024)} KB)`);
  } catch (err) {
    console.error(`✗ Failed for ${vp.name}:`, err.message);
  }
}
console.log('Capture complete!');
