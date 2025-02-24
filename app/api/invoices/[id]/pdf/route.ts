import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { generatePDF } from '@/lib/pdf';
import type { Invoice, Client } from '@/components/invoice-pdf';

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get invoice data
    const invoiceDoc = await db.collection('invoices').findOne({
      _id: new ObjectId(params.id)
    });

    if (!invoiceDoc) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const invoice = { ...invoiceDoc, _id: invoiceDoc._id.toString() } as Invoice;

    // Get client data
    const clientDoc = await db.collection('clients').findOne({
      $or: [
        { name: invoice.client },
        { aliases: invoice.client }
      ]
    });

    if (!clientDoc) {
      console.error('Client not found:', {
        invoiceClient: invoice.client,
        query: {
          name: invoice.client,
          aliases: invoice.client
        }
      });
      return new NextResponse('Client not found', { status: 404 });
    }

    const clientData = { ...clientDoc, _id: clientDoc._id.toString() } as Client;

    // Generate PDF with both invoice and client data
    const pdfBuffer = await generatePDF({ 
      invoice, 
      clientData 
    });

    // Clean filename
    const cleanFileName = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[''"]/g, '')
        .replace(/\[video\]/gi, 'video-')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\(.*?\)/g, '')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        .replace(/-+/g, '-');
    };

    const filename = `${cleanFileName(invoice.client)}-${cleanFileName(invoice.episodeTitle)}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
} 