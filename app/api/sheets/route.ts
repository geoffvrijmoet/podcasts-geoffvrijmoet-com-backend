import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, appendSheetData } from '@/lib/google-sheets';
import { auth } from '@clerk/nextjs/server';

// Update type to match our spreadsheet columns
type Episode = {
  client: string;
  episodeTitle: string;
  type: string;
  earnedAfterFees: number;
  invoicedAmount: number;
  billedMinutes: number;
  lengthHours: number;
  lengthMinutes: number;
  lengthSeconds: number;
  paymentMethod: string;
  editingHours: number;
  editingMinutes: number;
  editingSeconds: number;
  billableHours: number;
  runningHourlyTotal: number;
  ratePerMinute: number;
  dateInvoiced: string;
  datePaid: string;
  note: string;
};

export async function GET() {
  try {
    const { userId }: { userId: string | null } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all episodes data (A2:Z to include all possible columns)
    const data = await getSheetData('Sheet1!A2:Z');
    
    // Transform the raw data into structured episodes using column indices
    const episodes = data?.map((row: (string | number | boolean)[]) => ({
      client: row[0]?.toString() || '',
      episodeTitle: row[1]?.toString() || '',
      type: row[2]?.toString() || '',
      earnedAfterFees: Number(row[3]) || 0,
      invoicedAmount: Number(row[4]) || 0,
      billedMinutes: Number(row[5]) || 0,
      lengthHours: Number(row[6]) || 0,
      lengthMinutes: Number(row[7]) || 0,
      lengthSeconds: Number(row[8]) || 0,
      paymentMethod: row[9]?.toString() || '',
      editingHours: Number(row[10]) || 0,
      editingMinutes: Number(row[11]) || 0,
      editingSeconds: Number(row[12]) || 0,
      billableHours: Number(row[13]) || 0,
      runningHourlyTotal: Number(row[14]) || 0,
      ratePerMinute: Number(row[15]) || 0,
      dateInvoiced: row[16]?.toString() || '',
      datePaid: row[17]?.toString() || '',
      note: row[18]?.toString() || ''
    })) || [];

    return NextResponse.json({ data: episodes });
  } catch (error) {
    console.error('Sheets API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId }: { userId: string | null } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { episode } = body as { episode: Episode };

    // Validate required fields
    if (!episode.client || !episode.episodeTitle) {
      return NextResponse.json(
        { error: 'Client name and episode title are required' },
        { status: 400 }
      );
    }

    // Append new episode using column-based approach
    await appendSheetData(episode);

    // Get updated data
    const updatedData = await getSheetData('Sheet1!A2:Z');
    
    return NextResponse.json({ 
      message: 'Episode added successfully',
      data: updatedData 
    });
  } catch (error) {
    console.error('Sheets API Error:', error);
    return NextResponse.json({ error: 'Failed to add episode' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId }: { userId: string | null } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { rowIndex, episode } = body as { rowIndex: number; episode: Episode };

    if (rowIndex < 0) {
      return NextResponse.json({ error: 'Valid row index required' }, { status: 400 });
    }

    // Update episode using column-based approach
    await updateSheetData(rowIndex + 2, episode); // +2 for header row and 0-based index

    // Get updated data
    const updatedData = await getSheetData('Sheet1!A2:Z');
    
    return NextResponse.json({ 
      message: 'Episode updated successfully',
      data: updatedData 
    });
  } catch (error) {
    console.error('Sheets API Error:', error);
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId }: { userId: string | null } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { rowIndex } = body as { rowIndex: number };

    if (!rowIndex || rowIndex < 2) { // Ensure we don't delete the header row
      return NextResponse.json({ error: 'Invalid row index' }, { status: 400 });
    }

    // Delete the row from the sheet
    const sheets = google.sheets({ version: 'v4', auth: await getAuthToken() });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      }
    });

    // Get updated data
    const updatedData = await getSheetData('Sheet1!A2:Z');
    
    return NextResponse.json({ 
      message: 'Episode deleted successfully',
      data: updatedData 
    });
  } catch (error) {
    console.error('Sheets API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    );
  }
} 