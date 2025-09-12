# Room API Documentation

## Overview
The Room API allows users to create, join, and manage poker rooms within tournaments. Each room can have 2-8 members and includes password protection.

## Base URL
```
/api/rooms
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Room
**POST** `/api/rooms/create`

Create a new room for a tournament.

**Request Body:**
```json
{
  "tournamentId": 1,
  "roomPassword": "secret123",
  "maxMembers": 8,
  "minMembers": 2
}
```

**Response:**
```json
{
  "message": "Room created successfully",
  "room": {
    "id": 1,
    "tournamentId": 1,
    "roomMembers": [123],
    "roomState": "waiting",
    "createdDate": "2024-12-01T10:00:00.000Z",
    "maxMembers": 8,
    "minMembers": 2
  }
}
```

### 2. Get Tournament Rooms
**GET** `/api/rooms/tournament/:tournamentId`

Get all rooms for a specific tournament.

**Response:**
```json
{
  "rooms": [
    {
      "id": 1,
      "tournamentId": 1,
      "roomMembers": [123, 456],
      "roomPassword": "secret123",
      "roomState": "waiting",
      "createdDate": "2024-12-01T10:00:00.000Z",
      "maxMembers": 8,
      "minMembers": 2,
      "Tournament": {
        "name": "Weekly Championship",
        "status": "registering"
      },
      "creator": {
        "id": 123,
        "username": "pokerpro",
        "avatar": "avatar.jpg"
      }
    }
  ]
}
```

### 3. Get Room Details
**GET** `/api/rooms/:roomId`

Get detailed information about a specific room.

**Response:**
```json
{
  "room": {
    "id": 1,
    "tournamentId": 1,
    "roomMembers": [123, 456],
    "roomPassword": "secret123",
    "roomState": "waiting",
    "createdDate": "2024-12-01T10:00:00.000Z",
    "maxMembers": 8,
    "minMembers": 2,
    "Tournament": {
      "name": "Weekly Championship",
      "status": "registering",
      "entryFee": "100.00",
      "currency": "USDT"
    },
    "creator": {
      "id": 123,
      "username": "pokerpro",
      "avatar": "avatar.jpg"
    }
  }
}
```

### 4. Join Room
**POST** `/api/rooms/:roomId/join`

Join an existing room using the room password.

**Request Body:**
```json
{
  "password": "secret123"
}
```

**Response:**
```json
{
  "message": "Successfully joined room",
  "room": {
    "id": 1,
    "roomMembers": [123, 456, 789],
    "roomState": "waiting"
  }
}
```

### 5. Leave Room
**POST** `/api/rooms/:roomId/leave`

Leave a room. If the creator leaves, ownership transfers to another member.

**Response:**
```json
{
  "message": "Successfully left room",
  "room": {
    "id": 1,
    "roomMembers": [456, 789],
    "roomState": "waiting"
  }
}
```

### 6. Update Room State
**PUT** `/api/rooms/:roomId/state`

Update the room state (only room creator can do this).

**Request Body:**
```json
{
  "roomState": "playing"
}
```

**Valid State Transitions:**
- `waiting` → `playing`, `cancelled`
- `playing` → `completed`, `cancelled`
- `completed` → (no transitions)
- `cancelled` → (no transitions)

**Response:**
```json
{
  "message": "Room state updated successfully",
  "room": {
    "id": 1,
    "roomState": "playing"
  }
}
```

### 7. Delete Room
**DELETE** `/api/rooms/:roomId`

Delete a room (only room creator can do this).

**Response:**
```json
{
  "message": "Room deleted successfully"
}
```

## Room States

- **waiting**: Room is accepting new members
- **playing**: Game is in progress, no new members can join
- **completed**: Game has finished
- **cancelled**: Room was cancelled

## Error Responses

### 400 Bad Request
```json
{
  "message": "Room must have at least 2 members"
}
```

### 401 Unauthorized
```json
{
  "message": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Only room creator can change room state"
}
```

### 404 Not Found
```json
{
  "message": "Room not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Database Schema

The rooms table includes:
- `id`: Unique identifier
- `tournamentId`: Reference to tournament
- `roomMembers`: JSON array of user IDs
- `roomPassword`: Room access password
- `roomState`: Current room state
- `createdDate`: When room was created
- `createdBy`: User who created the room
- `maxMembers`: Maximum allowed members (default: 8)
- `minMembers`: Minimum required members (default: 2)

## Usage Examples

### Frontend Integration

```typescript
// Create a room
const createRoom = async (tournamentId: number, password: string) => {
  const response = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tournamentId,
      roomPassword: password
    })
  });
  return response.json();
};

// Join a room
const joinRoom = async (roomId: number, password: string) => {
  const response = await fetch(`/api/rooms/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ password })
  });
  return response.json();
};
```
