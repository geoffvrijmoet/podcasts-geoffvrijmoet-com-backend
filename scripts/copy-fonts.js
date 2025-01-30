import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../node_modules/@fontsource/quicksand/files');
const targetFile = path.join(__dirname, '../lib/fonts.ts');

// Font files to process
const fontFiles = [
  'quicksand-latin-400-normal.woff',
  'quicksand-latin-700-normal.woff'
];

// Generate the fonts file
const fontData = fontFiles.map(file => {
  const fontPath = path.join(sourceDir, file);
  const fontBuffer = fs.readFileSync(fontPath);
  const base64Font = fontBuffer.toString('base64');
  return { file, data: base64Font };
});

// Create the TypeScript content
const tsContent = `// Generated font data
export const fonts = {
  ${fontData.map(font => `'${font.file}': 'data:font/woff;base64,${font.data}'`).join(',\n  ')}
};`;

// Write the TypeScript file
fs.writeFileSync(targetFile, tsContent);
console.log('Generated font data file at lib/fonts.ts'); 