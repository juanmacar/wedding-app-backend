// Test file for RSVP update functionality
const RSVP_API_URL = "https://enpq096kji.execute-api.us-east-1.amazonaws.com/default/wedding_rsvp"
const LODGING_API_URL = "https://oovzh5owug.execute-api.us-east-1.amazonaws.com/default/wedding_lodging"
const invitationId = 'INV001'; // Replace with a valid invitation ID from your database


async function testUpdateRSVP() {
    
    const updateData = {
        invitationId,
        mainGuest: {
            attending: true
        },
        companion: {
            attending: true
        }
    };

    try {
        console.log('Sending update request with data:', JSON.stringify(updateData, null, 2));
        
        const response = await fetch(RSVP_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const responseData = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ Test passed: Successfully updated RSVP');
        } else {
            console.log('❌ Test failed: Failed to update RSVP');
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}
async function testGetLodgingAvailability() {
    try {
        const response = await fetch(LODGING_API_URL);
        const responseData = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        if (response.ok) {
            console.log('✅ Test passed: Successfully retrieved lodging availability');
        } else {
            console.log('❌ Test failed: Failed to retrieve lodging availability');
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}
async function testGetReservation() {
    try {
        const response = await fetch(LODGING_API_URL+'/'+invitationId);
        const responseData = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        if (response.ok) {
            console.log('✅ Test passed: Successfully retrieved reservation');
        } else {
            console.log('❌ Test failed: Failed to retrieve reservation');
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}