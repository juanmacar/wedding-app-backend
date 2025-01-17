import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';

export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Get MongoDB URI from environment variable
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Parse the request body
        const body = event.body ? JSON.parse(event.body) : null;
        if (!body) {
            throw new Error('Request body is empty');
        }

        // Connect to database
        const db = await connectToDatabase(uri);
        const collection = db.collection('rsvps');

        // Save RSVP data
        await collection.insertOne(body);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'RSVP received successfully',
                data: body
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error processing RSVP',
                error: error.message
            })
        };
    } finally {
        // Close the database connection
        await closeConnection();
    }
};
