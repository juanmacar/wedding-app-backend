import { connectToDatabase, closeConnection } from './utils/db.js';
import Guest from './models/Guest.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the root directory path
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..', '..');

// Load .env from the root directory
dotenv.config({ path: join(rootDir, '.env') });

async function test() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Connecting to database...');
        await connectToDatabase(uri);
        
        // Create a test guest
        console.log('Creating test guest...');
        const testGuest = new Guest({
            invitationId: 'test123',
            type: 'family',
            mainGuest: {
                name: 'John Doe',
                phone: '1234567890',
                attending: true
            },
            hasCompanion: true,
            companion: {
                name: 'Jane Doe',
                attending: true
            },
            hasChildren: true,
            children: [
                { name: 'Child 1', attending: true },
                { name: 'Child 2', attending: false }
            ],
            confirmed: true
        });

        // Save the test guest
        await testGuest.save();
        console.log('Test guest saved successfully');

        // Test finding a guest
        console.log('\nTesting findByInvitationId...');
        const foundGuest = await Guest.findByInvitationId('test123');
        console.log('Found guest:', foundGuest);

        // Test isComplete method
        console.log('\nTesting isComplete method...');
        console.log('Is guest complete?', foundGuest.isComplete());

        // Test getTotalConfirmedAttendees
        console.log('\nTesting getTotalConfirmedAttendees...');
        const totalAttendees = await Guest.getTotalConfirmedAttendees();
        console.log('Total confirmed attendees:', totalAttendees);

        // List all guests
        console.log('\nListing all guests...');
        const guests = await Guest.find({});
        console.log('All guests in database:');
        guests.forEach(guest => {
            console.log(`ID: ${guest.invitationId}, Name: ${guest.mainGuest.name}`);
        });

        // Specifically look for INV001
        console.log('\nLooking specifically for INV001...');
        const specificGuest = await Guest.findOne({ invitationId: 'INV001' });
        console.log(specificGuest);

        // Clean up - delete test guest
        console.log('\nCleaning up...');
        await Guest.deleteOne({ invitationId: 'test123' });
        console.log('Test guest deleted');

        await closeConnection();
    } catch (error) {
        console.error('Test failed:', error);
        await closeConnection();
        console.error(error.stack);
    }
}

// Run the test
test();
