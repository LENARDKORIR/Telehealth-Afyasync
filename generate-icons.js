const fs = require('fs');
const path = require('path');
const publicDir = path.join(process.cwd(), 'client', 'public');
if (!fs.existsSync(publicDir)) { fs.mkdirSync(publicDir, { recursive: true }); }

// Smallest possible 1x1 blue PNG pixel in base64
const bluePixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBAMCo9lMhgAAAABJRU5ErkJggg==';
const buffer = Buffer.from(bluePixelBase64, 'base64');

const icons = ['pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'];
icons.forEach(name => {
    fs.writeFileSync(path.join(publicDir, name), buffer);
    console.log('Generated ' + name);
});
