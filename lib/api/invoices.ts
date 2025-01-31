import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function getInvoiceById(id: string) {
  const client = await clientPromise;
  const collection = client.db().collection('invoices');
  
  const invoice = await collection.findOne({ _id: new ObjectId(id) });
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  return {
    ...invoice,
    _id: invoice._id.toString(),
  };
} 