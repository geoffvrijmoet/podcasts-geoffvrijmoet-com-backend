import { Font } from '@react-pdf/renderer';
import path from 'path';

export function registerFonts() {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Quicksand-VariableFont_wght.ttf');
  
  // Register Quicksand variable font
  Font.register({
    family: 'Quicksand',
    src: fontPath
  });

  // Register bold weight
  Font.register({
    family: 'Quicksand-Bold',
    src: fontPath,
    fontStyle: 'normal',
    fontWeight: 700
  });
}