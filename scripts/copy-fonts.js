const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/@fontsource/quicksand/files');
const targetDir = path.join(__dirname, '../public/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy font files
const fontFiles = [
  'quicksand-latin-400-normal.woff',
  'quicksand-latin-500-normal.woff',
  'quicksand-latin-600-normal.woff',
  'quicksand-latin-700-normal.woff',
];

fontFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to public/fonts/`);
}); 