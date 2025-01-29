import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    // Fetch all invoices, sorted by date invoiced in descending order
    const invoices = await invoicesCollection
      .aggregate([
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'clientDetails'
          }
        },
        {
          $unwind: {
            path: '$clientDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { dateInvoiced: -1 }
        }
      ])
      .toArray();
    
    await client.close();
    
    return NextResponse.json({ invoices }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(request: Request) {
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: corsHeaders() });
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    const clientsCollection = db.collection('clients');
    
    const body = await request.json();
    console.log('Received request body:', body);
    
    // Find the client by name or alias
    const clientDoc = await clientsCollection.findOne({
      $or: [
        { name: body.client },
        { aliases: body.client }
      ]
    });
    console.log('Found client:', clientDoc);
    
    if (!clientDoc) {
      await client.close();
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    // Add clientId to the invoice document
    body.clientId = clientDoc._id;
    
    // Convert string dates to Date objects
    if (body.dateInvoiced) {
      body.dateInvoiced = new Date(body.dateInvoiced);
    }
    if (body.datePaid) {
      body.datePaid = new Date(body.datePaid);
    }

    // Add timestamps
    body.createdAt = new Date();
    body.updatedAt = new Date();
    
    const result = await invoicesCollection.insertOne(body);
    console.log('Insert result:', result);
    
    await client.close();
    
    return NextResponse.json({ 
      success: true,
      _id: result.insertedId 
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 