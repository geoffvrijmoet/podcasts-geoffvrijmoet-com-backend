import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    // Fetch all invoices, sorted by date invoiced in descending order
    const invoices = await invoicesCollection
      .find({})
      .sort({ dateInvoiced: -1 })
      .toArray();
    
    await client.close();
    
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    const body = await request.json();
    
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
    
    await client.close();
    
    return NextResponse.json({ 
      success: true,
      _id: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
} 