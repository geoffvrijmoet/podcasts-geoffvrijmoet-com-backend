import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createInvoicePDF } from '@/components/invoice-pdf';

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

interface Invoice {
  _id: ObjectId;
  client: string;
  episodeTitle: string;
  type: string;
  invoicedAmount: number;
  billedMinutes: number;
  length: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  paymentMethod: string;
  editingTime: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  dateInvoiced: string | Date;
  datePaid?: string | Date;
  note: string;
}

interface Rate {
  episodeType: string;
  rateType: 'Per delivered minute' | 'Hourly';
  rate: number;
}

interface Client {
  _id: string;
  name: string;
  aliases?: string[];
  rates: Rate[];
}

// Add this helper function for safe date conversion
function safeToISOString(dateValue: string | Date | undefined | null): string {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    // Check if the date is valid
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
  } catch {
    console.error('Invalid date value:', dateValue);
    return '';
  }
}

// Helper function to create a safe filename
function createSafeFilename(client: string, episodeTitle: string): string {
  // Clean up client name and episode title
  const safeClient = client
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars but keep spaces
    .replace(/\s+/g, '-')            // Replace spaces with single hyphens
    .toLowerCase();
  
  const safeEpisode = episodeTitle
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  return `invoice-${safeClient}-${safeEpisode}.pdf`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    const clientsCollection = db.collection('clients');
    
    // Fetch invoice
    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(params.id)
    }) as Invoice | null;
    
    if (!invoice) {
      await client.close();
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Find client by name or alias
    const clientData = await clientsCollection.findOne({
      $or: [
        { name: invoice.client },
        { aliases: invoice.client }
      ]
    }) as Client | null;

    if (!clientData) {
      await client.close();
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    await client.close();

    // Transform MongoDB document to expected invoice format
    const formattedInvoice = {
      client: invoice.client || '',
      episodeTitle: invoice.episodeTitle || '',
      type: invoice.type || '',
      invoicedAmount: invoice.invoicedAmount || 0,
      billedMinutes: invoice.billedMinutes || 0,
      length: invoice.length || { hours: 0, minutes: 0, seconds: 0 },
      paymentMethod: invoice.paymentMethod || '',
      editingTime: invoice.editingTime || { hours: 0, minutes: 0, seconds: 0 },
      dateInvoiced: safeToISOString(invoice.dateInvoiced),
      datePaid: safeToISOString(invoice.datePaid),
      note: invoice.note || '',
    };

    // Create PDF document with invoice and client data
    const doc = createInvoicePDF({ 
      invoice: formattedInvoice,
      clientData
    });
    
    // Generate PDF
    const pdfStream = await renderToStream(doc);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF with appropriate headers
    const filename = createSafeFilename(invoice.client, invoice.episodeTitle);
    const encodedFilename = encodeURIComponent(filename);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${filename}; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 