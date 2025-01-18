import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';
import Guest from '/opt/nodejs/models/Guest.js';

export const handler = async (event) => {
    console.log('Full event:', JSON.stringify(event, null, 2));
    
    try {
        // Get MongoDB URI from environment variable
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Connect to database
        await connectToDatabase(uri);

        // Set CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        };

        const httpMethod = event.requestContext?.http?.method;
        console.log('HTTP Method:', httpMethod);

        // Handle GET request
        if (httpMethod === 'GET') {
            const invitationId = event.queryStringParameters?.invitationId;
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            const guest = await Guest.findByInvitationId(invitationId);
            
            if (!guest) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Guest not found with ID ' + invitationId })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(guest)
            };
        }
        
        // Handle POST request (Create new guest)
        if (httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const invitationId = body.invitationId;
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            // Check if guest already exists
            const existingGuest = await Guest.findByInvitationId(invitationId);
            if (existingGuest) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Guest with this invitationId already exists' })
                };
            }

            // Create new guest
            const guest = new Guest(body);
            await guest.save();

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(guest)
            };
        }

        // Handle PUT request (Update existing guest)
        if (httpMethod === 'PUT') {
            const body = JSON.parse(event.body);
            const invitationId = body.invitationId;
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            // Find existing guest
            const guest = await Guest.findByInvitationId(invitationId);
            if (!guest) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Guest not found' })
                };
            }

            // Update guest with new data
            Object.assign(guest, body);
            await guest.save();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(guest)
            };
        }

        // Handle unsupported HTTP methods
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    } finally {
        await closeConnection();
    }
};
