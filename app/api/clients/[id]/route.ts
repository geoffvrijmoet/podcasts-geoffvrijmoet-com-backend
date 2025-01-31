import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const collection = client.db().collection('clients');
    const decodedName = decodeURIComponent(params.id);
    
    // Look for client by name or in aliases
    const clientData = await collection.findOne({
      $or: [
        { name: decodedName },
        { aliases: decodedName }
      ]
    });

    if (!clientData) {
      return new NextResponse('Client not found', { status: 404 });
    }

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Error fetching client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 