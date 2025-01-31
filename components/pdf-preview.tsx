'use client';

import { PDFViewer } from '@/components/pdf-viewer';
import { createInvoicePDF } from '@/components/invoice-pdf';
import { InvoicePDFProps } from '@/components/invoice-pdf';

interface PDFPreviewProps {
  invoice: InvoicePDFProps['invoice'];
  clientData: InvoicePDFProps['clientData'];
}

export default function PDFPreview({ invoice, clientData }: PDFPreviewProps) {
  return (
    <PDFViewer>
      {createInvoicePDF({ invoice, clientData })}
    </PDFViewer>
  );
} 