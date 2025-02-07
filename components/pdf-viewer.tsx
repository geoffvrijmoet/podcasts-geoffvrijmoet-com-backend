import { BlobProvider } from '@react-pdf/renderer';
import { ReactElement } from 'react';
import { DocumentProps } from '@react-pdf/renderer';

interface PDFViewerProps {
  children: ReactElement<DocumentProps>;
}

export function PDFViewer({ children }: PDFViewerProps) {
  return (
    <BlobProvider document={children}>
      {({ url, loading, error }) => {
        if (loading) return <div>Loading PDF...</div>;
        if (error) return <div>Error loading PDF!</div>;
        if (!url) return null;
        
        return (
          <iframe
            src={url}
            style={{ width: '100%', height: '80vh', border: 'none' }}
            title="PDF Preview"
          />
        );
      }}
    </BlobProvider>
  );
} 