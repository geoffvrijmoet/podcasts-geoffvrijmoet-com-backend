import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { generatePDF } from '../../../../../lib/pdf';

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
  earnedAfterFees: number;
  billedMinutes: number;
  length: TimeEntry[];
  editingTime: TimeEntry[];
  dateInvoiced: string;
  datePaid: string;
  note: string;
  paymentMethod: string;
}

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

export async function POST(request: Request) {
  try {
    // Get the invoice data from the request body instead of the database
    const invoiceData = await request.json();
    
    // Generate PDF using the provided invoice data
    const pdfBuffer = await generatePDF(invoiceData);
    
    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceData.client.toLowerCase().replace(/\s+/g, '-')}-${invoiceData.episodeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}

// Keep the GET endpoint as a fallback
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const collection = client.db().collection('invoices');
    
    const invoice = (await collection.findOne({ 
      _id: new ObjectId(params.id)
    })) as unknown as Invoice;
    
    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }
    
    const pdfBuffer = await generatePDF(invoice);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.client.toLowerCase().replace(/\s+/g, '-')}-${invoice.episodeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
} 