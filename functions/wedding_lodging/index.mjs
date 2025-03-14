import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';
import { initializeDatabase } from '/opt/nodejs/utils/dbInit.js';
import LodgingReservation from '/opt/nodejs/models/LodgingReservation.js';
import LodgingAvailability from '/opt/nodejs/models/LodgingAvailability.js';
import { updateReservationAndAvailability, createReservationAndUpdateAvailability, deleteReservationAndUpdateAvailability } from '/opt/nodejs/services/lodgingReservationTransactions.js';

console.log('Loading function');
const coupleId = '0001';

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
        
        // Add debug logging
        console.log('LodgingReservation model:', LodgingReservation);
        console.log('Available methods:', Object.keys(LodgingReservation));
        console.log('Schema methods:', Object.keys(LodgingReservation.schema.methods));
        console.log('Schema statics:', Object.keys(LodgingReservation.schema.statics));
        
        const httpMethod = event.requestContext?.http?.method

        if (httpMethod === 'GET') {
            const invitationId = event.pathParameters?.invitationId;
            console.log('Getting lodging reservation with invitation ID:', invitationId);
            
            if (!invitationId) {
                const availability = await LodgingAvailability.findOne({coupleId: coupleId});
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(availability)
                };
            }

            const lodgingReservation = await LodgingReservation.findByInvitationId(invitationId);
            console.log('Found lodging reservation:', lodgingReservation);
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
            const invitationId = event.pathParameters.invitationId
            body.invitationId = invitationId
            console.log('Body:', body);
            
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
            //Check if this couple offers lodging
            const lodgingExists = await LodgingAvailability.findOne({ coupleId: coupleId });
            if (!lodgingExists) {
                return {
                    statusCode: 404,  // Using 404 for "not found"
                    headers,
                    body: JSON.stringify({ error: 'Lodging not found for this couple' })
                };
            }

            // Create new lodging reservation
            const requiredSpots = body.adults + body.children;
            
            try {
                const result = await createReservationAndUpdateAvailability(body, coupleId, requiredSpots);
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify(result.newReservation)
                };
            } catch (error) {
                return {
                    statusCode: error.statusCode || 500,
                    headers,
                    body: JSON.stringify({
                        message: error.message
                    })
                };
            }
        }

        // Handle PUT request (Update lodging reservation)
        if (httpMethod === 'PUT') {
            const body = JSON.parse(event.body);
            const invitationId = event.pathParameters.invitationId
            
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

            //Check if this couple offers lodging
            const lodgingExists = await LodgingAvailability.findOne({ coupleId: coupleId });
            if (!lodgingExists) {
                return {
                    statusCode: 404,  // Using 404 for "not found"
                    headers,
                    body: JSON.stringify({ error: 'Lodging not found for this couple' })
                };
            }

            // Update existing lodging reservation
            const NewRequiredSpots = body.adults + body.children;
            const previousSpotsRequired = lodgingReservation.adults + lodgingReservation.children;
            const spotsDiff = NewRequiredSpots - previousSpotsRequired;

            try {
                const result = await updateReservationAndAvailability(invitationId, body, coupleId, spotsDiff);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result.updatedReservation)
                };
            } catch (error) {
                return {
                    statusCode: error.statusCode || 500,
                    headers,
                    body: JSON.stringify({
                        message: error.message
                    })
                };
            }
        }

        // Handle DELETE request (Delete lodging reservation)
        if (httpMethod === 'DELETE') {
            const invitationId = event.pathParameters.invitationId
            
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

            try {
                const result = await deleteReservationAndUpdateAvailability(invitationId, coupleId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        message: 'Lodging Reservation deleted with invitation ID ' + invitationId,
                        releasedSpots: result.releasedSpots 
                    })
                };
            } catch (error) {
                const statusCode = error.statusCode || 500;
                return {
                    statusCode,
                    headers,
                    body: JSON.stringify({
                        message: error.message,
                        error: error.stack
                    })
                };
            }
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