"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = getAuthToken;
exports.getSheetData = getSheetData;
exports.updateSheetData = updateSheetData;
exports.appendSheetData = appendSheetData;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
// These will come from your service account JSON
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
async function getAuthToken() {
    const auth = new google_auth_library_1.JWT({
        email: GOOGLE_CLIENT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: SCOPES,
    });
    return auth;
}
// Add this function to get column indices
async function getColumnIndices() {
    const headers = await getSheetData('Sheet1!1:1');
    console.log('Sheet headers:', headers?.[0]);
    if (!headers?.[0])
        throw new Error('Could not find headers in spreadsheet');
    const headerRow = headers[0];
    const findColumn = (name) => {
        const index = headerRow.findIndex((header) => header.toLowerCase().trim() === name.toLowerCase().trim());
        if (index === -1)
            throw new Error(`Could not find column: ${name}`);
        return index;
    };
    return {
        client: findColumn('Client'),
        episodeTitle: findColumn('Episode title'),
        type: findColumn('Type'),
        earnedAfterFees: findColumn('$ after fee'),
        invoicedAmount: findColumn('$ invoiced'),
        billedMinutes: findColumn('Billed minutes'),
        lengthHours: findColumn('Episode length hours'),
        lengthMinutes: findColumn('Episode length minutes'),
        lengthSeconds: findColumn('Episode length seconds'),
        paymentMethod: findColumn('Payment method'),
        editingHours: findColumn('Hours spent editing'),
        editingMinutes: findColumn('Minutes spent editing'),
        editingSeconds: findColumn('Seconds spent editing'),
        billableHours: findColumn('Billable hours'),
        runningHourlyTotal: findColumn('Running Hourly Total'),
        ratePerMinute: findColumn('Rate per minute'),
        dateInvoiced: findColumn('Date invoiced'),
        datePaid: findColumn('Date paid'),
        note: findColumn('Note')
    };
}
async function getSheetData(range) {
    try {
        const auth = await getAuthToken();
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range,
        });
        return response.data.values;
    }
    catch (error) {
        console.error('Error reading from Google Sheet:', error);
        throw error;
    }
}
// Update function signatures
async function updateSheetData(rowIndex, values) {
    try {
        const columns = await getColumnIndices();
        const auth = await getAuthToken();
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        // Create an array with the correct length and put values in the right positions
        const rowData = new Array(Math.max(...Object.values(columns)) + 1).fill('');
        Object.entries(values).forEach(([key, value]) => {
            const columnIndex = columns[key];
            if (columnIndex !== undefined) {
                rowData[columnIndex] = value;
            }
        });
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `Sheet1!A${rowIndex}:${String.fromCharCode(65 + rowData.length)}${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error updating Google Sheet:', error);
        throw error;
    }
}
async function appendSheetData(values) {
    try {
        const columns = await getColumnIndices();
        const auth = await getAuthToken();
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        // Create an array with the correct length and put values in the right positions
        const rowData = new Array(Math.max(...Object.values(columns)) + 1).fill('');
        Object.entries(values).forEach(([key, value]) => {
            const columnIndex = columns[key];
            if (columnIndex !== undefined) {
                rowData[columnIndex] = value;
            }
        });
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Sheet1!A:Z',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error appending to Google Sheet:', error);
        throw error;
    }
}
