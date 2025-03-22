import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
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
 * Process a CSV file and create invitations
 * @param {string} filePath - Path to the CSV file
 * @param {string} weddingId - MongoDB ObjectId of the wedding
 */
async function processGuestsCsv(filePath, weddingId) {
  if (!weddingId || !mongoose.Types.ObjectId.isValid(weddingId)) {
    console.error('Invalid wedding ID');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Parse CSV file
  parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ',',
  }, async (err, records) => {
    if (err) {
      console.error('Error parsing CSV:', err);
      process.exit(1);
    }

    try {
      // Map CSV records to the format expected by createInvitationsFromGuestData
      const guestData = records.map((record) => ({
        guestName: record.Nombre,
        guestType: record.Tipo.toLowerCase(),
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
      console.error('Error creating invitations:', error);
    } finally {
      // Close MongoDB connection
      mongoose.connection.close();
    }
  });
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node importGuestsFromCsv.js <csv-file-path> <wedding-id>');
  process.exit(1);
}

const filePath = process.argv[2];
const weddingId = process.argv[3];

// Run the script
processGuestsCsv(filePath, weddingId);
