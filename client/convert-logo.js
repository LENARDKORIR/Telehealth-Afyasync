import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, 'public', 'logo.svg');
const publicDir = path.join(__dirname, 'public');

async function convertLogo() {
  try {
    const svg = fs.readFileSync(logoPath);
    
    // Convert to 192x192
    await sharp(svg)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
    console.log('✓ Created pwa-192x192.png');
    
    // Convert to 512x512
    await sharp(svg)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512.png'));
    console.log('✓ Created pwa-512x512.png');
    
    // Convert to apple touch icon (180x180)
    await sharp(svg)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png');
    
    console.log('\n✅ All logos converted successfully!');
  } catch (error) {
    console.error('❌ Error converting logo:', error.message);
    process.exit(1);
  }
}

convertLogo();
