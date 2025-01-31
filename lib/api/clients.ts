import clientPromise from '@/lib/mongodb';

export async function getClientById(id: string) {
  const client = await clientPromise;
  const collection = client.db().collection('clients');
  
  // Find by name instead of _id since we store client names in the invoice
  const clientData = await collection.findOne({ name: id });
  if (!clientData) {
    throw new Error('Client not found');
  }
  
  return {
    ...clientData,
    _id: clientData._id.toString(),
  };
} 