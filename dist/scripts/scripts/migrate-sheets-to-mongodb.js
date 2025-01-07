"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const google_sheets_1 = require("../lib/google-sheets");
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
// Load environment variables from .env.local
const result = dotenv.config({ path: (0, path_1.resolve)(__dirname, '../.env.local') });
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
async function migrateData() {
    // Connect to MongoDB
    const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();
        const invoicesCollection = db.collection('invoices');
        // Get all data from Google Sheets
        console.log('Fetching data from Google Sheets...');
        const data = await (0, google_sheets_1.getSheetData)('Sheet1!A2:Z'); // Skip header row
        if (!data) {
            throw new Error('No data found in Google Sheets');
        }
        // Get column indices for mapping
        const headerRow = (await (0, google_sheets_1.getSheetData)('Sheet1!1:1'))?.[0];
        if (!headerRow) {
            throw new Error('Could not find headers in spreadsheet');
        }
        // Create a mapping of column indices
        const columnMap = {
            client: headerRow.findIndex((h) => h.toLowerCase().trim() === 'client'),
            episodeTitle: headerRow.findIndex((h) => h.toLowerCase().trim() === 'episode title'),
            type: headerRow.findIndex((h) => h.toLowerCase().trim() === 'type'),
            earnedAfterFees: headerRow.findIndex((h) => h.toLowerCase().trim() === '$ after fee'),
            invoicedAmount: headerRow.findIndex((h) => h.toLowerCase().trim() === '$ invoiced'),
            billedMinutes: headerRow.findIndex((h) => h.toLowerCase().trim() === 'billed minutes'),
            lengthHours: headerRow.findIndex((h) => h.toLowerCase().trim() === 'episode length hours'),
            lengthMinutes: headerRow.findIndex((h) => h.toLowerCase().trim() === 'episode length minutes'),
            lengthSeconds: headerRow.findIndex((h) => h.toLowerCase().trim() === 'episode length seconds'),
            paymentMethod: headerRow.findIndex((h) => h.toLowerCase().trim() === 'payment method'),
            editingHours: headerRow.findIndex((h) => h.toLowerCase().trim() === 'hours spent editing'),
            editingMinutes: headerRow.findIndex((h) => h.toLowerCase().trim() === 'minutes spent editing'),
            editingSeconds: headerRow.findIndex((h) => h.toLowerCase().trim() === 'seconds spent editing'),
            billableHours: headerRow.findIndex((h) => h.toLowerCase().trim() === 'billable hours'),
            runningHourlyTotal: headerRow.findIndex((h) => h.toLowerCase().trim() === 'running hourly total'),
            ratePerMinute: headerRow.findIndex((h) => h.toLowerCase().trim() === 'rate per minute'),
            dateInvoiced: headerRow.findIndex((h) => h.toLowerCase().trim() === 'date invoiced'),
            datePaid: headerRow.findIndex((h) => h.toLowerCase().trim() === 'date paid'),
            note: headerRow.findIndex((h) => h.toLowerCase().trim() === 'note'),
        };
        // Transform and insert data
        const documents = data.map((row) => ({
            client: row[columnMap.client] || '',
            episodeTitle: row[columnMap.episodeTitle] || '',
            type: row[columnMap.type] || '',
            earnedAfterFees: parseFloat(row[columnMap.earnedAfterFees]) || 0,
            invoicedAmount: parseFloat(row[columnMap.invoicedAmount]) || 0,
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
        }));
        if (documents.length > 0) {
            console.log(`Inserting ${documents.length} documents into MongoDB...`);
            const result = await invoicesCollection.insertMany(documents);
            console.log(`Successfully inserted ${result.insertedCount} documents`);
        }
        else {
            console.log('No documents to insert');
        }
    }
    catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
    finally {
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
