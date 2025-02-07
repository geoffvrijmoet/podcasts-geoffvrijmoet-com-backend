'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { InvoicePDFProps } from '@/components/invoice-pdf';

interface PDFPreviewProps {
  invoice: InvoicePDFProps['invoice'];
  clientData: InvoicePDFProps['clientData'];
}

const PDFContent = dynamic<PDFPreviewProps>(() => 
  import('./pdf-content').then((mod) => mod.default), 
  { ssr: false }
);

export default function PDFPreview({ invoice, clientData }: PDFPreviewProps) {
  return (
    <Suspense fallback={<div>Loading PDF...</div>}>
      <PDFContent invoice={invoice} clientData={clientData} />
    </Suspense>
  );
} 