import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

const testRSVP = async () => {
  try {
    // Test GET request with invitationId
    const response = await fetch(`${BASE_URL}/rsvp?invitationId=1234`);
    const data = await response.json();
    console.log('RSVP Response:', data);
  } catch (error) {
    console.error('Error testing RSVP endpoint:', error);
  }
};

const testServer = async () => {
  console.log('Testing server endpoints...');
  await testRSVP();
  console.log('Test completed.');
};

testServer();
