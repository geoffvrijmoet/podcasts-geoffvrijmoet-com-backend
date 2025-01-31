import { PDFViewer as ReactPDFViewer } from '@react-pdf/renderer';
import { ReactElement } from 'react';
import { DocumentProps } from '@react-pdf/renderer';

interface PDFViewerProps {
  children: ReactElement<DocumentProps>;
}

export function PDFViewer({ children }: PDFViewerProps) {
  return (
    <ReactPDFViewer style={{ width: '100%', height: '80vh' }}>
      {children}
    </ReactPDFViewer>
  );
} 