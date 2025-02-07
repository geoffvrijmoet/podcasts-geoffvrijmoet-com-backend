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
    console.log('PDF generation request for:', {
      client: invoiceData.client,
      episodeTitle: invoiceData.episodeTitle,
      type: invoiceData.type
    });
    
    // Generate PDF using the provided invoice data
    const pdfBuffer = await generatePDF(invoiceData);
    
    // Clean filename function
    const cleanFileName = (str: string) => {
      const cleaned = str
        .toLowerCase()
        // Replace apostrophes and special characters with nothing
        .replace(/[''"]/g, '')
        // Replace [video] with video-
        .replace(/\[video\]/gi, 'video-')
        // Remove any remaining square brackets and their contents
        .replace(/\[.*?\]/g, '')
        // Replace spaces with dashes
        .replace(/\s+/g, '-')
        // Remove parentheses and their contents
        .replace(/\(.*?\)/g, '')
        // Remove any leading dashes
        .replace(/^-+/, '')
        // Remove any trailing dashes
        .replace(/-+$/, '')
        // Replace multiple dashes with single dash (do this last)
        .replace(/-+/g, '-');
      console.log(`Cleaning filename part: "${str}" -> "${cleaned}"`);
      return cleaned;
    };

    const cleanedClient = cleanFileName(invoiceData.client);
    const cleanedEpisodeTitle = cleanFileName(invoiceData.episodeTitle);
    const filename = `${cleanedClient}-${cleanedEpisodeTitle}.pdf`;
    console.log('Final generated filename:', filename);
    
    // Return the PDF with appropriate headers
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

    // Clean filename function
    const cleanFileName = (str: string) => {
      const cleaned = str
        .toLowerCase()
        // Replace apostrophes and special characters with nothing
        .replace(/[''"]/g, '')
        // Replace [video] with video-
        .replace(/\[video\]/gi, 'video-')
        // Remove any remaining square brackets and their contents
        .replace(/\[.*?\]/g, '')
        // Replace spaces with dashes
        .replace(/\s+/g, '-')
        // Remove parentheses and their contents
        .replace(/\(.*?\)/g, '')
        // Remove any leading dashes
        .replace(/^-+/, '')
        // Remove any trailing dashes
        .replace(/-+$/, '')
        // Replace multiple dashes with single dash (do this last)
        .replace(/-+/g, '-');
      console.log(`Cleaning filename part: "${str}" -> "${cleaned}"`);
      return cleaned;
    };

    const filename = `${cleanFileName(invoice.client)}-${cleanFileName(invoice.episodeTitle)}.pdf`;
    console.log('Generated filename:', filename);
    
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