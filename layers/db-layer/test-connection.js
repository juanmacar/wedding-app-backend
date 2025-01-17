require('dotenv').config();
const { connectToDatabase, closeConnection } = require('./nodejs/utils/db');

// Get MongoDB URI from environment variable
if (!process.env.MONGODB_URI) {
    console.error('Please set MONGODB_URI in your .env file');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        const db = await connectToDatabase(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB!');

        // Create rsvps collection
        console.log('Creating rsvps collection...');
        const rsvpsCollection = db.collection('rsvps');
        
        // Sample RSVP data
        const testRsvps = [
            {
                name: 'Juan Pérez',
                email: 'juan.perez@example.com',
                attending: true,
                guests: 2,
                dietaryRestrictions: 'No restrictions',
                songRequests: ['Bailando - Enrique Iglesias'],
                additionalNotes: 'Looking forward to the wedding!',
                createdAt: new Date()
            },
            {
                name: 'María García',
                email: 'maria.garcia@example.com',
                attending: true,
                guests: 1,
                dietaryRestrictions: 'Vegetarian',
                songRequests: ['Vivir Mi Vida - Marc Anthony'],
                additionalNotes: 'I am vegetarian',
                createdAt: new Date()
            },
            {
                name: 'Carlos Rodríguez',
                email: 'carlos.rodriguez@example.com',
                attending: false,
                guests: 0,
                dietaryRestrictions: 'None',
                songRequests: [],
                additionalNotes: 'Sorry, I cannot attend. Best wishes!',
                createdAt: new Date()
            }
        ];
        
        // Insert test documents
        console.log('Inserting test RSVPs...');
        const result = await rsvpsCollection.insertMany(testRsvps);
        console.log(`Successfully inserted ${result.insertedCount} RSVPs`);

        // Verify the documents were inserted
        const count = await rsvpsCollection.countDocuments();
        console.log('Number of RSVPs in database:', count);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

        // Show all RSVPs
        console.log('\nCurrent RSVPs:');
        const allRsvps = await rsvpsCollection.find({}).toArray();
        allRsvps.forEach(rsvp => {
            console.log(`- ${rsvp.name} (${rsvp.attending ? 'Attending' : 'Not attending'})`);
        });

        console.log('\nDatabase setup completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closeConnection();
        console.log('Connection closed.');
    }
}

testConnection();
