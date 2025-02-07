'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { InvoicePDFProps } from '@/components/invoice-pdf';

interface PDFPreviewProps {
  invoice: InvoicePDFProps['invoice'];
  clientData: InvoicePDFProps['clientData'];
}

// Lazy load the PDF components
const PDFContent = lazy(() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(import('./pdf-content'));
    }, 100);
  });
});

export default function PDFPreview({ invoice, clientData }: PDFPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <Suspense fallback={<div>Loading PDF...</div>}>
      <PDFContent invoice={invoice} clientData={clientData} />
    </Suspense>
  );
} 