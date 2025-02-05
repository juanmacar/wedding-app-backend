import { connectToDatabase, closeConnection } from '/opt/nodejs/utils/db.js';
import Guest from '/opt/nodejs/models/Guest.js';

export const handler = async (event) => {
    console.log('Full event:', JSON.stringify(event, null, 2));
    
    // Set CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Or your specific frontend URL in production
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };

    try {
        // Handle OPTIONS request (CORS preflight)
        if (event.requestContext?.http?.method === 'OPTIONS') {
            console.log('Handling OPTIONS request');
            return {
                statusCode: 204, // No content needed for OPTIONS
                headers,
                body: ''
            };
        }

        // Get MongoDB URI from environment variable
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'MONGODB_URI environment variable is not set' })
            };
        }

        // Connect to database
        await connectToDatabase(uri);

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

            // Remove invitationId from update data
            const { invitationId: _, ...updateFields } = body;

            // Prepare update operation
            const updateOperation = { $set: {} };

            // First, get the current document to check for null fields
            const currentGuest = await Guest.findOne({ invitationId });
            if (!currentGuest) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Guest not found' })
                };
            }

            // Helper function to process nested objects and arrays
            const processObject = (obj, parentKey = '', currentObj = null) => {
                Object.entries(obj).forEach(([key, value]) => {
                    const fullKey = parentKey ? `${parentKey}.${key}` : key;
                    
                    if (value === null) {
                        // Handle null values directly
                        updateOperation.$set[fullKey] = null;
                    } else if (typeof value === 'object') {
                        // Get current value for this path
                        const current = currentObj ? 
                            parentKey ? currentObj[parentKey]?.[key] : currentObj[key]
                            : null;
                            
                        // If current value is null, set the entire object/array at once
                        if (current === null) {
                            updateOperation.$set[fullKey] = value;
                        } else {
                            // For arrays, process each element
                            if (Array.isArray(value)) {
                                value.forEach((item, index) => {
                                    if (typeof item === 'object' && item !== null) {
                                        processObject(item, `${fullKey}.${index}`, currentObj);
                                    } else {
                                        updateOperation.$set[`${fullKey}.${index}`] = item;
                                    }
                                });
                            } else {
                                // For objects, recursively process nested fields
                                processObject(value, fullKey, currentObj);
                            }
                        }
                    } else {
                        // Handle primitive values directly
                        updateOperation.$set[fullKey] = value;
                    }
                });
            };

            // Process all update fields
            processObject(updateFields, '', currentGuest);

            console.log('Request body:', JSON.stringify(body, null, 2));
            console.log('Update fields:', JSON.stringify(updateFields, null, 2));
            console.log('Current document:', JSON.stringify(currentGuest, null, 2));
            console.log('Update operation:', JSON.stringify(updateOperation, null, 2));

            // Find and update the guest
            const updatedGuest = await Guest.findOneAndUpdate(
                { invitationId },
                updateOperation,
                { new: true, runValidators: false }
            );

            if (!updatedGuest) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Guest not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedGuest)
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
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    } finally {
        await closeConnection();
    }
};
