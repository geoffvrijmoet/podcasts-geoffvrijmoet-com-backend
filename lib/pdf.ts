import { renderToStream } from '@react-pdf/renderer';
import { createInvoicePDF } from '@/components/invoice-pdf';
import { registerFonts } from '@/lib/fonts';

interface TimeEntry {
  hours: number;
  minutes: number;
  seconds: number;
}

interface Invoice {
  _id: string;
  client: string;
  episodeTitle: string;
  type: string;
  invoicedAmount: number;
  billedMinutes: number;
  length: TimeEntry[];
  paymentMethod: string;
  editingTime: TimeEntry[];
  dateInvoiced: string;
  datePaid: string;
  note: string;
}

interface Rate {
  episodeType: string;
  rateType: 'Per delivered minute' | 'Hourly' | 'Flat rate';
  rate: number;
}

interface Client {
  _id: string;
  name: string;
  aliases?: string[];
  rates: Rate[];
}

export async function generatePDF({ invoice, clientData }: { invoice: Invoice; clientData: Client }) {
  try {
    // Register fonts before generating PDF
    registerFonts();

    // Create PDF document
    const doc = createInvoicePDF({ 
      invoice,
      clientData
    });
    
    // Generate PDF stream
    const pdfStream = await renderToStream(doc);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error in generatePDF:', error);
    throw error;
  }
} 