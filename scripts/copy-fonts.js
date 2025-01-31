import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../node_modules/@fontsource/quicksand/files');
const targetDir = path.join(__dirname, '../public/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Font files to copy
const fontFiles = [
  'quicksand-latin-400-normal.woff',
  'quicksand-latin-700-normal.woff'
];

// Copy font files
fontFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to public/fonts/`);
}); 