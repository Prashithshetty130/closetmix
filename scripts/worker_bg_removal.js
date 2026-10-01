const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node worker_bg_removal.js <inputPath> <outputPath>');
  process.exit(1);
}

(async () => {
  try {
    const fileUrl = 'file:///' + path.resolve(inputPath).replace(/\\/g, '/');
    const blob = await removeBackground(fileUrl);
    const arrayBuf = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    fs.writeFileSync(outputPath, buffer);
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
