/**
 * PWA Icon Generator Script
 * 
 * This script generates PNG icons from the SVG favicon for PWA installation.
 * 
 * USAGE:
 * 1. Install sharp: npm install sharp --save-dev
 * 2. Run: node scripts/generate-icons.js
 * 
 * Or use an online tool like https://realfavicongenerator.net/
 * Upload the favicon.svg and download the icon pack.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('='.repeat(60));
  console.log('Sharp is not installed. To generate PNG icons:');
  console.log('');
  console.log('Option 1: Install sharp and run this script');
  console.log('  npm install sharp --save-dev');
  console.log('  node scripts/generate-icons.js');
  console.log('');
  console.log('Option 2: Use an online generator');
  console.log('  1. Go to https://realfavicongenerator.net/');
  console.log('  2. Upload public/favicon.svg');
  console.log('  3. Download and extract icons to public/icons/');
  console.log('');
  console.log('Option 3: The app will still work with SVG icons');
  console.log('  Modern browsers support SVG icons in PWA manifests.');
  console.log('='.repeat(60));
  process.exit(0);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Read SVG file
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating PWA icons...\n');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated: icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`✗ Failed: icon-${size}x${size}.png - ${err.message}`);
    }
  }
  
  // Generate Apple Touch Icon (180x180)
  const appleTouchPath = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
  try {
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(appleTouchPath);
    
    console.log(`✓ Generated: apple-touch-icon.png (180x180)`);
  } catch (err) {
    console.error(`✗ Failed: apple-touch-icon.png - ${err.message}`);
  }
  
  console.log('\n✓ Icon generation complete!');
}

generateIcons().catch(console.error);

