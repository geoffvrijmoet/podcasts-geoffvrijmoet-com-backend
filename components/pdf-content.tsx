'use client';

import { useMemo } from 'react';
import { PDFViewer } from '@/components/pdf-viewer';
import { createInvoicePDF, InvoicePDFProps } from '@/components/invoice-pdf';

interface PDFContentProps {
  invoice: InvoicePDFProps['invoice'];
  clientData: InvoicePDFProps['clientData'];
}

export default function PDFContent({ invoice, clientData }: PDFContentProps) {
  const pdfDocument = useMemo(() => {
    return createInvoicePDF({ invoice, clientData });
  }, [invoice, clientData]);

  return (
    <div className="w-full h-full">
      <PDFViewer>
        {pdfDocument}
      </PDFViewer>
    </div>
  );
} 