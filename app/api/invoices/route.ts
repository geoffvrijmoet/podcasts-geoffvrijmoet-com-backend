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