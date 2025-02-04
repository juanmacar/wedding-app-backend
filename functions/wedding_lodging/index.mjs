import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';
import { initializeDatabase } from '/opt/nodejs/utils/dbInit.js';
import LodgingReservation from '/opt/nodejs/models/LodgingReservation.js';
import LodgingAvailability from '/opt/nodejs/models/LodgingAvailability.js';

console.log('Loading function');
export const handler = async (event) => {
    // Set CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };

    try {
        // Handle OPTIONS request (CORS preflight)
        if (event.requestContext?.http?.method === 'OPTIONS') {
            return {
                statusCode: 204,
                headers,
                body: ''
            };
        }

        // Get MongoDB URI from environment variable
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Connect to database
        await connectToDatabase(uri);
        await initializeDatabase();
        console.log('Connected to database and initialized');
        const httpMethod = event.requestContext?.http?.method

        if (httpMethod === 'GET') {
            const invitationId = event.queryStringParameters?.invitationId;
            
            if (!invitationId) {
                const availability = await LodgingAvailability.findOne({}); // I bring the only document
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(availability)
                };
            }

            const lodgingReservation = await LodgingReservation.findByInvitationId(invitationId);
            
            if (!lodgingReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Lodging Reservation not found with invitation ID ' + invitationId })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(lodgingReservation)
            };
        }

        // Handle POST request (Create new lodging reservation)
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

            // Check if lodging reservation already exists
            const existingLodgingReservation = await LodgingReservation.findByInvitationId(invitationId);
            if (existingLodgingReservation) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Lodging Reservation with this invitationId already exists' })
                };
            }

            // Create new lodging reservation
            const lodgingReservation = new LodgingReservation(body);
            await lodgingReservation.save();

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(lodgingReservation)
            };
        }

        // Handle PUT request (Update lodging reservation)
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

            const lodgingReservation = await LodgingReservation.findByInvitationId(invitationId);
            if (!lodgingReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Lodging Reservation not found with invitation ID ' + invitationId })
                };
            }

            // Update existing lodging reservation
            lodgingReservation.set(body);
            await lodgingReservation.save();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(lodgingReservation)
            };
        }

        // Handle DELETE request (Delete lodging reservation)
        if (httpMethod === 'DELETE') {
            const invitationId = event.queryStringParameters?.invitationId;
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            const lodgingReservation = await LodgingReservation.findByInvitationId(invitationId);
            if (!lodgingReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Lodging Reservation not found with invitation ID ' + invitationId })
                };
            }

            await lodgingReservation.deleteOne();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Lodging Reservation deleted with invitation ID ' + invitationId })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    } finally {
        await closeConnection();
    }
};