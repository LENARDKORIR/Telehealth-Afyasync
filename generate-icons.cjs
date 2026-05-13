const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const publicDir = path.join(process.cwd(), 'client', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
const generateIcon = async (size, fileName) => {
    const svg = '<svg width=\"' + size + '\" height=\"' + size + '\" viewBox=\"0 0 ' + size + ' ' + size + '\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"100%\" height=\"100%\" fill=\"#2563eb\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"' + (size * 0.5) + '\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\">A</text></svg>';
    await sharp(Buffer.from(svg)).png().toFile(path.join(publicDir, fileName));
    const stats = fs.statSync(path.join(publicDir, fileName));
    console.log('Generated ' + fileName + ': ' + stats.size + ' bytes');
};
const run = async () => {
    try {
        await generateIcon(192, 'pwa-192x192.png');
        await generateIcon(512, 'pwa-512x512.png');
        await generateIcon(180, 'apple-touch-icon.png');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
