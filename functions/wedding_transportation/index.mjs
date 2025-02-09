import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';
import { initializeDatabase } from '/opt/nodejs/utils/dbInit.js';
import TransportationReservation from '/opt/nodejs/models/TransportationReservation.js';
import TransportationAvailability from '/opt/nodejs/models/TransportationAvailability.js';
import { updateReservationAndAvailability, createReservationAndUpdateAvailability } from '/opt/nodejs/services/transportationReservationTransactions.js';

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
        console.log('TransportationReservation model:', TransportationReservation);
        console.log('Available methods:', Object.keys(TransportationReservation));
        console.log('Schema methods:', Object.keys(TransportationReservation.schema.methods));
        console.log('Schema statics:', Object.keys(TransportationReservation.schema.statics));
        
        const httpMethod = event.requestContext?.http?.method

        if (httpMethod === 'GET') {
            const invitationId = event.pathParameters?.invitationId;
            console.log('Getting transportation reservation with invitation ID:', invitationId);
            
            if (!invitationId) {
                const availability = await TransportationAvailability.findOne({coupleId: coupleId});
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(availability)
                };
            }

            const transportationReservation = await TransportationReservation.findByInvitationId(invitationId);
            console.log('Found transportation reservation:', transportationReservation);
            if (!transportationReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Transportation Reservation not found with invitation ID ' + invitationId })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(transportationReservation)
            };
        }

        // Handle POST request (Create new transportation reservation)
        if (httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const invitationId = event.pathParameters.invitationId
            body.invitationId = invitationId
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            // Check if transportation reservation already exists
            const existingTransportationReservation = await TransportationReservation.findByInvitationId(invitationId);
            if (existingTransportationReservation) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Transportation Reservation with this invitationId already exists' })
                };
            }
            //Check if this couple offers transportation
            const transportationExists = await TransportationAvailability.findOne({ coupleId: coupleId });
            if (!transportationExists) {
                return {
                    statusCode: 404,  // Using 404 for "not found"
                    headers,
                    body: JSON.stringify({ error: 'Transportation not found for this couple' })
                };
            }

            // Create new transportation reservation
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

        // Handle PUT request (Update transportation reservation)
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

            const transportationReservation = await TransportationReservation.findByInvitationId(invitationId);
            if (!transportationReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Transportation Reservation not found with invitation ID ' + invitationId })
                };
            }

            //Check if this couple offers transportation
            const transportationExists = await TransportationAvailability.findOne({ coupleId: coupleId });
            if (!transportationExists) {
                return {
                    statusCode: 404,  // Using 404 for "not found"
                    headers,
                    body: JSON.stringify({ error: 'Transportation not found for this couple' })
                };
            }

            // Update existing transportation reservation
            const NewRequiredSpots = body.adults + body.children;
            const previousSpotsRequired = transportationReservation.adults + transportationReservation.children;
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

        // Handle DELETE request (Delete transportation reservation)
        if (httpMethod === 'DELETE') {
            const invitationId = event.pathParameters.invitationId
            
            if (!invitationId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'invitationId is required' })
                };
            }

            const transportationReservation = await TransportationReservation.findByInvitationId(invitationId);
            if (!transportationReservation) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Transportation Reservation not found with invitation ID ' + invitationId })
                };
            }
            const releasedSpots = transportationReservation.adults + transportationReservation.children;
            try {
                await TransportationAvailability.findOneAndUpdate(
                    { coupleId: coupleId },
                    { $inc: { taken_spots: -releasedSpots } },
                    { new: true } // This returns the updated document
                );
            } catch (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        message: "An error occurred while updating the count of taken spots",
                        error: error.message
                    })
                };
            }
            try {
                await transportationReservation.deleteOne();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Transportation Reservation deleted with invitation ID ' + invitationId })
            };
            } catch (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        message: "An error occurred while deleting the transportation reservation",
                        error: error.message
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