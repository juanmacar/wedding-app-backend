# Wedding Invitation App API

A serverless API built with AWS Lambda and MongoDB to manage wedding invitations. This API allows you to create, retrieve, and update guest RSVPs for a wedding event, confirm if they'll use the lodging provided, and manage transportation reservations.

## Architecture

- **Backend**: AWS Lambda (Node.js)
- **Database**: MongoDB Atlas
- **API Gateway**: AWS HTTP API
- **Authentication**: None (currently)

# Wedding RSVP API

The main API for managing guest RSVPs. This API allows you to create, retrieve, and update guest RSVPs for a wedding event.
## API Endpoints

The API is accessible through the base URL: `https://[your-api-gateway-url]/rsvp`

### Available Methods

#### GET /rsvp

Retrieves guest information using their invitation ID.

**Query Parameters:**
- `invitationId` (required): The unique identifier for the guest

**Sample Request:**
```
GET /wedding_rsvp?invitationId=INV001
```

**Sample Response:**
```json
{
    "invitationId": "INV001",
    "type": "family",
    "mainGuest": {
        "name": "John Doe",
        "phone": "1234567890",
        "attending": true
    },
    "hasCompanion": true,
    "companion": {
        "name": "Jane Doe",
        "attending": true
    },
    "hasChildren": true,
    "children": [
        {
            "name": "Child 1",
            "attending": true
        }
    ],
    "dietaryRestrictionsInGroup": "No nuts",
    "songRequest": "Dancing Queen",
    "additionalNotes": "Looking forward to it!"
}
```

#### POST /rsvp

Creates a new guest RSVP entry.

**Request Body:**
```json
{
    "invitationId": "INV002",
    "type": "couple",
    "mainGuest": {
        "name": "Bob Smith",
        "phone": "9876543210",
        "attending": true
    },
    "hasCompanion": true,
    "companion": {
        "name": "Alice Smith",
        "attending": true
    },
    "hasChildren": false,
    "dietaryRestrictionsInGroup": "Vegetarian",
    "songRequest": "Sweet Caroline",
    "additionalNotes": "Can't wait!"
}
```

**Required Fields:**
- `invitationId` (string): Must be unique
- `type` (string): One of ['single', 'couple', 'family']
- `mainGuest.name` (string)
- `mainGuest.phone` (string)
- `hasCompanion` (boolean)
- `hasChildren` (boolean)

**Optional Fields:**
- `mainGuest.attending` (boolean, defaults to null)
- `companion` (object, required if hasCompanion is true)
  - `name` (string)
  - `attending` (boolean, defaults to null)
- `children` (array of objects, required if hasChildren is true)
  - `name` (string)
  - `attending` (boolean, defaults to null)
- `dietaryRestrictionsInGroup` (string)
- `songRequest` (string)
- `additionalNotes` (string)

#### PUT /rsvp

Updates an existing guest RSVP. Uses the same schema as POST but requires an existing invitationId.

**Sample Request Body:**
```json
{
    "invitationId": "INV001",
    "mainGuest": {
        "attending": true
    },
    "companion": {
        "attending": false
    }
}
```

## Wedding Lodging endpoint

A complementary API to manage lodging reservations for wedding guests. This API allows you to check lodging availability and make reservations.

## API Endpoints

The API is accessible through the base URL: `https://[your-api-gateway-url]/lodging`

### Available Methods

#### GET /lodging
#### GET /lodging/{invitationId}

Retrieves lodging availability information or a specific reservation.

**Path Parameters:**
- `invitationId` (optional): The invitation ID to get a specific reservation. If not provided (using base endpoint), returns lodging availability information.

**Sample Response (without invitationId):**
```json
{
    "coupleId": "0001",
    "total_spots": 70,
    "taken_spots": 10,
}
```

**Sample Response (with invitationId):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

#### POST /lodging/{invitationId}

Creates a new lodging reservation.

**Path Parameters:**
- `invitationId` (required): The invitation ID for the new reservation

**Request Body:**
```json
{
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

**Success Response (201):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

#### PUT /lodging/{invitationId}

Updates an existing lodging reservation. The endpoint will also update the available spots count.

**Path Parameters:**
- `invitationId` (required): The invitation ID of the reservation to update

**Request Body:** Same schema as POST

**Success Response (200):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

#### DELETE /lodging/{invitationId}

Deletes an existing lodging reservation and updates the available spots count.

**Path Parameters:**
- `invitationId` (required): The invitation ID of the reservation to delete

**Success Response (200):**
```json
{
    "message": "Lodging Reservation deleted with invitation ID INV001"
}
```

## Wedding Transportation endpoint

The API for managing guest transportation reservations and checking transportation availability.

#### Base URL
`https://[your-api-gateway-url]/transportation`

#### Available Methods

##### GET /transportation
Retrieves general transportation availability information.

**Sample Request:**
```
GET /transportation

**Success Response (200):**
```json
{
    "coupleId": "0001",
    "availableSeats": 50,
    "totalCapacity": 100
}
```

##### GET /transportation/{invitationId}
Retrieves transportation reservation information for a specific guest.

**Path Parameters:**
- `invitationId` (required): The unique identifier for the guest

**Sample Request:**
```
GET /transportation/INV001
```

**Success Response (200):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

##### POST /transportation/{invitationId}
Creates a new transportation reservation for a guest.

**Path Parameters:**
- `invitationId` (required): The unique identifier for the guest

**Request Body:**
```json
{
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

**Success Response (201):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```
##### PUT /transportation/{invitationId}

Updates an existing transportation reservation. The endpoint will also update the available spots count.

**Path Parameters:**
- `invitationId` (required): The invitation ID of the reservation to update

**Request Body:** Same schema as POST

**Success Response (200):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

##### DELETE /transportation/{invitationId}

Deletes an existing transportation reservation and updates the available spots count.

**Path Parameters:**
- `invitationId` (required): The invitation ID of the reservation to delete

**Success Response (200):**
```json
{
    "message": "Lodging Reservation deleted with invitation ID INV001"
}
```

## Error Responses

The API returns appropriate HTTP status codes:

- `200`: Success (GET, PUT)
- `201`: Created (POST - successful creation)
- `400`: Bad Request (missing or invalid invitationId)
- `404`: Not Found (guest,lodging or transportation reservation not found or not available for this users)
- `409`: Conflict (reservation exists or not enough spots)
- `405`: Method Not Allowed
- `500`: Server Error (database operations errors or unexpected errors)

All error responses include a message and optional error details:
```json
{
    "message": "Error description",
    "error": "Optional detailed error message"
}
```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI="your-mongodb-connection-string"
   ```
4. Deploy to AWS Lambda using your preferred method (SAM, Serverless Framework, or manual upload)

## Testing

Use the provided test script to verify database connectivity and CRUD operations:

```bash
cd layers/db-layer/nodejs
node test.mjs
```

## Database Schema

The guest schema includes fields for managing:
- Main guest information
- Companion details (optional)
- Children information (optional)
- Dietary restrictions
- Song requests
- Additional notes
- Timestamps (created and modified)

See `layers/db-layer/nodejs/models/Guest.js` for the complete schema definition.
