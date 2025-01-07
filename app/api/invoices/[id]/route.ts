import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    const body = await request.json();
    const { _id: _id_unused, ...updateData } = body; // eslint-disable-line @typescript-eslint/no-unused-vars

    // Convert string dates to Date objects
    if (updateData.dateInvoiced) {
      updateData.dateInvoiced = new Date(updateData.dateInvoiced);
    }
    if (updateData.datePaid) {
      updateData.datePaid = new Date(updateData.datePaid);
    }

    updateData.updatedAt = new Date();
    
    const result = await invoicesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
} 