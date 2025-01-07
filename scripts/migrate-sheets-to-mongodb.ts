import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local before importing other modules
const result = dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (result.error) {
  console.error('Error loading .env.local file:', result.error);
  process.exit(1);
}

// Log environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID || 'Not set');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL || 'Not set');

// Import other modules after environment variables are loaded
import { MongoClient } from 'mongodb';
import { getSheetData } from '../lib/google-sheets';

// Define type for sheet row data
type SheetRowData = string[];

async function migrateData() {
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const invoicesCollection = db.collection('invoices');
    
    // Delete all existing documents
    console.log('Deleting existing documents...');
    const deleteResult = await invoicesCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing documents`);
    
    // Get all data from Google Sheets
    console.log('Fetching data from Google Sheets...');
    const data = await getSheetData('Sheet1!A2:Z'); // Skip header row
    
    if (!data) {
      throw new Error('No data found in Google Sheets');
    }

    // Get column indices for mapping
    const headerRow = (await getSheetData('Sheet1!1:1'))?.[0];
    if (!headerRow) {
      throw new Error('Could not find headers in spreadsheet');
    }

    console.log('Headers found:', headerRow);

    // Create a mapping of column indices
    const columnMap = {
      client: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'client'),
      episodeTitle: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'episode title'),
      type: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'type'),
      earnedAfterFees: headerRow.findIndex((h: string) => h.toLowerCase().trim() === '$ after fee'),
      invoicedAmount: headerRow.findIndex((h: string) => h.toLowerCase().trim() === '$ invoiced'),
      billedMinutes: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'billed minutes'),
      lengthHours: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'episode length hours'),
      lengthMinutes: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'episode length minutes'),
      lengthSeconds: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'episode length seconds'),
      paymentMethod: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'payment method'),
      editingHours: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'hours spent editing'),
      editingMinutes: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'minutes spent editing'),
      editingSeconds: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'seconds spent editing'),
      billableHours: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'billable hours'),
      runningHourlyTotal: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'running hourly total'),
      ratePerMinute: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'rate per minute'),
      dateInvoiced: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'date invoiced'),
      datePaid: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'date paid'),
      note: headerRow.findIndex((h: string) => h.toLowerCase().trim() === 'note'),
    };

    console.log('Column mapping:', columnMap);

    // Transform and insert data
    const documents = data.map((row: SheetRowData, index: number) => {
      // Helper function to parse currency values
      const parseCurrency = (value: string): number => {
        if (!value) return 0;
        // Remove dollar signs, spaces, and commas, then parse as float
        const cleanValue = value.replace(/[$,\s]/g, '');
        return parseFloat(cleanValue) || 0;
      };

      // Debug log for the first few rows
      if (index < 3) {
        console.log(`Row ${index + 1} data:`, {
          earnedAfterFees: {
            value: row[columnMap.earnedAfterFees],
            parsed: parseCurrency(row[columnMap.earnedAfterFees])
          },
          invoicedAmount: {
            value: row[columnMap.invoicedAmount],
            parsed: parseCurrency(row[columnMap.invoicedAmount])
          }
        });
      }

      return {
        client: row[columnMap.client] || '',
        episodeTitle: row[columnMap.episodeTitle] || '',
        type: row[columnMap.type] || '',
        earnedAfterFees: parseCurrency(row[columnMap.earnedAfterFees]),
        invoicedAmount: parseCurrency(row[columnMap.invoicedAmount]),
        billedMinutes: parseInt(row[columnMap.billedMinutes]) || 0,
        length: {
          hours: parseInt(row[columnMap.lengthHours]) || 0,
          minutes: parseInt(row[columnMap.lengthMinutes]) || 0,
          seconds: parseInt(row[columnMap.lengthSeconds]) || 0,
        },
        paymentMethod: row[columnMap.paymentMethod] || '',
        editingTime: {
          hours: parseInt(row[columnMap.editingHours]) || 0,
          minutes: parseInt(row[columnMap.editingMinutes]) || 0,
          seconds: parseInt(row[columnMap.editingSeconds]) || 0,
        },
        billableHours: parseFloat(row[columnMap.billableHours]) || 0,
        runningHourlyTotal: parseFloat(row[columnMap.runningHourlyTotal]) || 0,
        ratePerMinute: parseFloat(row[columnMap.ratePerMinute]) || 0,
        dateInvoiced: row[columnMap.dateInvoiced] ? new Date(row[columnMap.dateInvoiced]) : null,
        datePaid: row[columnMap.datePaid] ? new Date(row[columnMap.datePaid]) : null,
        note: row[columnMap.note] || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    if (documents.length > 0) {
      console.log(`Inserting ${documents.length} documents into MongoDB...`);
      const result = await invoicesCollection.insertMany(documents);
      console.log(`Successfully inserted ${result.insertedCount} documents`);
    } else {
      console.log('No documents to insert');
    }

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Closed MongoDB connection');
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 