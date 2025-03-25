import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createInvitationsFromGuestData } from '../utils/batchCreateInvitations.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Process an Excel file and create invitations
 * @param {string} filePath - Path to the Excel file
 * @param {string} weddingId - MongoDB ObjectId of the wedding
 * @param {string} sheetName - Optional name of the sheet to process (defaults to first sheet)
 */
async function processGuestsExcel(filePath, weddingId, sheetName = null) {
  if (!weddingId || !mongoose.Types.ObjectId.isValid(weddingId)) {
    console.error('Invalid wedding ID');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the sheet to process
    const sheet = sheetName
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      console.error(`Sheet ${sheetName || 'first sheet'} not found in workbook`);
      process.exit(1);
    }

    // Convert sheet to JSON
    const records = xlsx.utils.sheet_to_json(sheet);

    if (!records || records.length === 0) {
      console.error('No data found in the Excel sheet');
      process.exit(1);
    }

    // Check if required columns exist
    const firstRecord = records[0];
    const requiredColumns = ['Nombre', 'Tipo', 'Grupo'];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRecord));

    if (missingColumns.length > 0) {
      console.error(`Missing required columns: ${missingColumns.join(', ')}`);
      console.error('Available columns:', Object.keys(firstRecord).join(', '));
      process.exit(1);
    }

    // Map Excel records to the format expected by createInvitationsFromGuestData
    const guestData = records.map((record) => ({
      guestName: record.Nombre,
      guestType: record.Tipo ? record.Tipo.toLowerCase() : 'adulto',
      group: parseInt(record.Grupo, 10),
      phone: record.Celular || null
    }));

    console.log(`Processing ${guestData.length} guests...`);

    // Create invitations
    const invitations = await createInvitationsFromGuestData(weddingId, guestData);

    console.log(`Successfully created ${invitations.length} invitations`);

    // Print a summary of the invitations created
    invitations.forEach((invitation, index) => {
      console.log(`\nInvitation ${index + 1}:`);
      console.log(`  Type: ${invitation.type}`);
      console.log(`  Main Guest: ${invitation.mainGuest.name}`);

      if (invitation.hasCompanion && invitation.companion.name) {
        console.log(`  Companion: ${invitation.companion.name}`);
      }

      if (invitation.hasChildren && invitation.children.length > 0) {
        console.log(`  Children: ${invitation.children.map((child) => child.name).join(', ')}`);
      }

      console.log(`  Phone: ${invitation.phone || 'None'}`);
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node importGuestsFromExcel.js <excel-file-path> <wedding-id> [sheet-name]');
  process.exit(1);
}

const filePath = process.argv[2];
const weddingId = process.argv[3];
const sheetName = process.argv.length > 4 ? process.argv[4] : null;

// Run the script
processGuestsExcel(filePath, weddingId, sheetName);
