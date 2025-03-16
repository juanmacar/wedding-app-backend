# Wedding Invitation App Backend

A Node.js Express API built to manage wedding invitations. This API allows you to create, retrieve, and update guest RSVPs for a wedding event, confirm if they'll use the lodging provided, and manage transportation reservations.

## Architecture

- **Backend**: Node.js with Express
- **Database**: MongoDB Atlas
- **Authentication**: None (currently)

## Running the Application

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` based on the .env.example file:

## Database Schemas

### User Schema
```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVenue: {
    type: Boolean,
    default: false
  },
  weddings: [{
    type: ObjectId,
    ref: 'Wedding'
  }],
  timestamps: true
}
```

### Wedding Schema
```javascript
{
  weddingDate: {
    type: Date,
    required: false
  },
  weddingName: {
    type: String,
    required: true,
    trim: true
  },
  users: [{
    type: ObjectId,
    ref: 'User',
    required: true
  }],
  venue: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  settings: {
    type: Mixed,
    default: {}
  },
  timestamps: true
}
```

### Guest Schema
```javascript
{
  invitationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  wedding: {
    type: ObjectId,
    ref: 'Wedding',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'couple', 'family']
  },
  mainGuest: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    attending: {
      type: Boolean,
      default: null
    }
  },
  hasCompanion: {
    type: Boolean,
    required: true,
    default: false
  },
  companion: {
    name: {
      type: String,
      trim: true,
      default: null
    },
    attending: {
      type: Boolean,
      default: null
    }
  },
  hasChildren: {
    type: Boolean,
    required: true,
    default: false
  },
  children: [{
    name: {
      type: String,
      trim: true
    },
    attending: {
      type: Boolean,
      default: null
    }
  }],
  dietaryRestrictionsInGroup: {
    type: String,
    default: null,
    trim: true
  },
  songRequest: {
    type: String,
    default: null,
    trim: true
  },
  additionalNotes: {
    type: String,
    default: null,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastModified: {
    type: Date,
    default: null
  }
}
```

### Lodging Reservation Schema
```javascript
{
  invitationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  guests: {
    type: Array,
    required: true
  },
  adults: {
    type: Number,
    required: false
  },
  children: {
    type: Number,
    required: false
  }
}
```

### Transportation Reservation Schema
```javascript
{
  invitationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  guests: {
    type: Array,
    required: true
  },
  adults: {
    type: Number,
    required: false
  },
  children: {
    type: Number,
    required: false
  }
}
```

### Lodging Availability Schema
```javascript
{
  coupleId: {
    type: String,
    required: true
  },
  total_spots: {
    type: Number,
    required: true
  },
  taken_spots: {
    type: Number,
    required: true
  }
}
```

### Transportation Availability Schema
```javascript
{
  coupleId: {
    type: String,
    required: true
  },
  total_spots: {
    type: Number,
    required: true
  },
  taken_spots: {
    type: Number,
    required: true
  }
}
```

## Testing

Use the provided test script to verify database connectivity and some basic CRUD operations:

```bash
npm run test:rsvp
```

# Wedding RSVP API

The main API for managing guest RSVPs. This API allows you to create, retrieve, and update guest RSVPs for a wedding event.
## API Endpoints

The API is accessible through the base URL: `http://localhost:3001/api/rsvp` (or your deployed Render URL)

## Available Methods

### GET /rsvp

Retrieves guest information using their invitation ID.

**Query Parameters:**
- `invitationId` (required): The unique identifier for the guest

**Sample Request:**
```
GET /rsvp/INV001
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

### POST /rsvp

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

### PUT /rsvp

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

# Wedding Lodging API

A complementary API to manage lodging reservations for wedding guests. This API allows you to check lodging availability and make reservations.

## API Endpoints

The API is accessible through the base URL: `https://[your-api-gateway-url]/lodging`

## Available Methods

### GET /lodging
Retrieves general lodging availability information.

**Sample Request:**
```
GET /lodging
```

**Success Response (200):**
```json
{
    "coupleId": "0001",
    "total_spots": 70,
    "taken_spots": 10
}
```
### GET /lodging/{invitationId}

Retrieves lodging availability information or a specific reservation.

**Path Parameters:**
- `invitationId` (optional): The invitation ID to get a specific reservation. If not provided (using base endpoint), returns lodging availability information.

**Success Response (200):**
```json
{
    "invitationId": "INV001",
    "guests": ["John Doe", "Jane Doe"],
    "adults": 2,
    "children": 1
}
```

### POST /lodging/{invitationId}

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

### PUT /lodging/{invitationId}

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

### DELETE /lodging/{invitationId}

Deletes an existing lodging reservation and updates the available spots count.

**Path Parameters:**
- `invitationId` (required): The invitation ID of the reservation to delete

**Success Response (200):**
```json
{
    "message": "Lodging Reservation deleted with invitation ID INV001"
}
```

# Wedding Transportation API

The API for managing guest transportation reservations and checking transportation availability.

## API Endpoints

The API is accessible through the base URL: `https://[your-api-gateway-url]/transportation`

## Available Methods

### GET /transportation
Retrieves general transportation availability information.

**Sample Request:**
```
GET /transportation
```

**Success Response (200):**
```json
{
    "coupleId": "0001",
    "total_spots": 70,
    "taken_spots": 10
}
```

### GET /transportation/{invitationId}
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

### POST /transportation/{invitationId}
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
### PUT /transportation/{invitationId}

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

### DELETE /transportation/{invitationId}

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
3. Create a `.env` based on the .env.example file:


## Testing

Use the provided test script to verify database connectivity and some basic CRUD operations:

```bash
npm run test:rsvp
```

## Database Schemas

### Guest Schema

The guest schema includes fields for managing:
- Main guest information
- Companion details (optional)
- Children information (optional)
- Dietary restrictions
- Song requests
- Additional notes
- Timestamps (created and modified)

### Lodging Reservation Schema

The lodging reservation schema includes fields for managing:
- Guest names
- Number of adults and children
- Timestamps (created and modified)

### Transportation Reservation Schema

The transportation reservation schema includes fields for managing:
- Guest names
- Number of adults and children
- Timestamps (created and modified)

See `models/Guest.js` for the complete schema definition.

# Authentication API

The Authentication API allows users to register and log in to manage their wedding details.

## API Endpoints

The API is accessible through the base URL: `http://localhost:3001/api/auth` (or your deployed Render URL)

## Available Methods

### POST /api/auth/signup

Registers a new user and creates or joins a wedding.

**Request Body:**
```json
{
  "email": "couple@example.com",
  "password": "securepassword123",
  "weddingId": "60d21b4667d0d8992e610c85",  // Optional: to join an existing wedding
  "weddingName": "John & Jane's Wedding"    // Optional: used if creating a new wedding
}
```

**Required Fields:**
- `email` (string): Valid email address
- `password` (string): User password

**Optional Fields:**
- `weddingId` (string): ID of an existing wedding to join
- `weddingName` (string): Name for a new wedding if not joining an existing one

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "60d21b4667d0d8992e610c86",
    "email": "couple@example.com",
    "isAdmin": false,
    "isVenue": false,
    "createdAt": "2023-06-22T15:30:45.123Z",
    "weddings": [
      {
        "_id": "60d21b4667d0d8992e610c87",
        "weddingName": "John & Jane's Wedding",
        "users": ["60d21b4667d0d8992e610c86"]
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `409 Conflict`: User already exists
- `500 Internal Server Error`: Server error

### POST /api/auth/login

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "couple@example.com",
  "password": "securepassword123"
}
```

**Required Fields:**
- `email` (string): User's email address
- `password` (string): User's password

**Success Response (200):**
```json
{
  "_id": "60d21b4667d0d8992e610c86",
  "email": "couple@example.com",
  "isAdmin": false,
  "isVenue": false,
  "weddings": [
    {
      "_id": "60d21b4667d0d8992e610c87",
      "weddingName": "John & Jane's Wedding",
      "users": ["60d21b4667d0d8992e610c86"]
    }
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid email or password
- `500 Internal Server Error`: Server error

# Guests API

The Guests API allows wedding organizers to manage their guest list.

## API Endpoints

The API is accessible through the base URL: `http://localhost:3001/api/guests` (or your deployed Render URL)

## Available Methods

### GET /api/guests/:weddingId

Retrieves all guests for a specific wedding.

**Path Parameters:**
- `weddingId` (required): The ID of the wedding

**Headers:**
- `Authorization`: Bearer [JWT token]

**Success Response (200):**
```json
[
  {
    "_id": "60d21b4667d0d8992e610c88",
    "invitationId": "INV001",
    "wedding": "60d21b4667d0d8992e610c87",
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
        "name": "Child Doe",
        "attending": true
      }
    ],
    "dietaryRestrictionsInGroup": "No nuts",
    "songRequest": "Dancing Queen",
    "additionalNotes": "Looking forward to it!",
    "createdAt": "2023-06-22T15:35:45.123Z",
    "lastModified": "2023-06-22T15:35:45.123Z"
  }
]
```

**Error Responses:**
- `400 Bad Request`: Missing wedding ID
- `403 Forbidden`: Not authorized to view guests for this wedding
- `404 Not Found`: Wedding not found
- `500 Internal Server Error`: Server error
