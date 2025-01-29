import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
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
    
    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(params.id)
    });
    
    await client.close();
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    return NextResponse.json(invoice, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    const clientsCollection = db.collection('clients');
    
    const body = await request.json();
    const { _id: _id_unused, ...updateData } = body; // eslint-disable-line @typescript-eslint/no-unused-vars

    // If client name is being updated, find the new clientId
    if (updateData.client) {
      const clientDoc = await clientsCollection.findOne({
        $or: [
          { name: updateData.client },
          { aliases: updateData.client }
        ]
      });
      if (!clientDoc) {
        await client.close();
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404, headers: corsHeaders() }
        );
      }
      updateData.clientId = clientDoc._id;
    }

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
        { status: 404, headers: corsHeaders() }
      );
    }
    
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    const result = await invoicesCollection.deleteOne({
      _id: new ObjectId(params.id)
    });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404, headers: corsHeaders() }
      );
    }
    
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500, headers: corsHeaders() }
    );
  }
} 