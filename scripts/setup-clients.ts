import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

interface Client {
  _id?: ObjectId;
  name: string;
  email: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

async function setupClientsAndUpdateInvoices() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const clientsCollection = db.collection('clients');
    const invoicesCollection = db.collection('invoices');

    // Initial clients data with aliases
    const clients: Client[] = [
      {
        name: 'Making Movies is Hard',
        email: 'alrik@bursellproductions.com',
        aliases: ['MMIH', 'Making Movies is Hard'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "That's My Girl",
        email: 'thatsmygirlinfo@gmail.com',
        aliases: ["That's My Girl"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Just Screen It',
        email: 'colin@darkrosepictures.com',
        aliases: ['Just Screen It', 'Colin Stryker'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert clients
    console.log('Inserting clients...');
    const result = await clientsCollection.insertMany(clients);
    console.log(`Inserted ${result.insertedCount} clients`);

    // Create a map of client names and aliases to their IDs for easy lookup
    const clientMap = new Map<string, ObjectId>();
    for (const [index, id] of Object.entries(result.insertedIds)) {
      const client = clients[Number(index)];
      // Add both the main name and aliases to the map
      client.aliases.forEach(alias => {
        clientMap.set(alias, id);
      });
    }

    // Update all invoices with their corresponding client IDs
    console.log('Updating invoices with client references...');
    const invoices = await invoicesCollection.find({}).toArray();
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const invoice of invoices) {
      const clientId = clientMap.get(invoice.client);
      if (clientId) {
        await invoicesCollection.updateOne(
          { _id: invoice._id },
          { 
            $set: { 
              clientId,
              updatedAt: new Date()
            } 
          }
        );
        updatedCount++;
      } else {
        console.warn(`No matching client found for invoice with client name: ${invoice.client}`);
        skippedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} invoices with client references`);
    console.log(`Skipped ${skippedCount} invoices due to no matching client`);
    
  } catch (error) {
    console.error('Error during setup:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Closed MongoDB connection');
  }
}

// Run the setup
setupClientsAndUpdateInvoices()
  .then(() => {
    console.log('Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 