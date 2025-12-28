# Live Attendance System - Backend

A complete backend system with WebSocket-based live attendance tracking, built with Node.js, Express, MongoDB, and JWT authentication.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Zod** - Schema validation
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **ws** - WebSocket library

## Features

- ✅ User authentication (signup, login, me)
- ✅ Role-based access control (teacher & student)
- ✅ Class management CRUD operations
- ✅ WebSocket-based live attendance
- ✅ Attendance persistence to MongoDB
- ✅ Real-time attendance updates
- ✅ Session management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote instance)

## Installation

1. **Clone the repository** (if applicable)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/live-attendance
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   PORT=3000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the server**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## Project Structure

```
live-attendance-backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── Class.js             # Class model
│   └── Attendance.js        # Attendance model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── class.js             # Class management routes
│   ├── students.js          # Student routes
│   └── attendance.js        # Attendance routes
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── validate.js          # Zod validation middleware
├── validators/
│   └── schemas.js           # Zod validation schemas
├── websocket/
│   └── handler.js           # WebSocket event handlers
├── .env                     # Environment variables
├── .env.example             # Environment variables template
├── server.js                # Main server file
└── package.json             # Dependencies
```

## API Documentation

### Response Format

All API responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Authentication

Send JWT token in the Authorization header:
```
Authorization: <JWT_TOKEN>
```

---

## HTTP API Endpoints

### 1. POST /auth/signup

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
}
```

**Error Responses:**
- 400: Email already exists
- 400: Invalid request schema

---

### 2. POST /auth/login

Login to get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- 400: Invalid email or password
- 400: Invalid request schema

---

### 3. GET /auth/me

Get current user information.

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
}
```

**Error Responses:**
- 401: Unauthorized, token missing or invalid
- 404: User not found

---

### 4. POST /class

Create a new class (Teacher only).

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Request Body:**
```json
{
  "className": "Mathematics 101"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "className": "Mathematics 101",
    "teacherId": "507f1f77bcf86cd799439011",
    "studentIds": []
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, teacher access required
- 400: Invalid request schema

---

### 5. POST /class/:id/add-student

Add a student to a class (Teacher only, must own the class).

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439013"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "className": "Mathematics 101",
    "teacherId": "507f1f77bcf86cd799439011",
    "studentIds": ["507f1f77bcf86cd799439013"]
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, not class teacher
- 404: Class not found
- 404: Student not found

---

### 6. GET /class/:id

Get class details with populated student information.

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "className": "Mathematics 101",
    "teacherId": "507f1f77bcf86cd799439011",
    "students": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ]
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, not authorized to view this class
- 404: Class not found

---

### 7. GET /students

Get all students (Teacher only).

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, teacher access required

---

### 8. GET /class/:id/my-attendance

Get student's attendance for a specific class (Student only).

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Success Response (200) - Attendance Persisted:**
```json
{
  "success": true,
  "data": {
    "classId": "507f1f77bcf86cd799439012",
    "status": "present"
  }
}
```

**Success Response (200) - Not Persisted Yet:**
```json
{
  "success": true,
  "data": {
    "classId": "507f1f77bcf86cd799439012",
    "status": null
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, not enrolled in this class
- 404: Class not found

---

### 9. POST /attendance/start

Start a new attendance session (Teacher only, must own the class).

**Headers:**
```
Authorization: <JWT_TOKEN>
```

**Request Body:**
```json
{
  "classId": "507f1f77bcf86cd799439012"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classId": "507f1f77bcf86cd799439012",
    "startedAt": "2025-12-28T14:30:00.000Z"
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden, not class teacher
- 404: Class not found

---

## WebSocket API

### Connection

Connect to WebSocket with JWT token:

```
ws://localhost:3000/ws?token=<JWT_TOKEN>
```

### Message Format

All WebSocket messages use this format:

```json
{
  "event": "EVENT_NAME",
  "data": { ... }
}
```

---

### WebSocket Events

#### 1. ATTENDANCE_MARKED

**Direction:** Teacher → Server → Broadcast to ALL

**Teacher Sends:**
```json
{
  "event": "ATTENDANCE_MARKED",
  "data": {
    "studentId": "507f1f77bcf86cd799439013",
    "status": "present"
  }
}
```

**Server Broadcasts:**
```json
{
  "event": "ATTENDANCE_MARKED",
  "data": {
    "studentId": "507f1f77bcf86cd799439013",
    "status": "present"
  }
}
```

---

#### 2. TODAY_SUMMARY

**Direction:** Teacher → Server → Broadcast to ALL

**Teacher Sends:**
```json
{
  "event": "TODAY_SUMMARY"
}
```

**Server Broadcasts:**
```json
{
  "event": "TODAY_SUMMARY",
  "data": {
    "present": 18,
    "absent": 4,
    "total": 22
  }
}
```

---

#### 3. MY_ATTENDANCE

**Direction:** Student → Server → Response to THAT student only (unicast)

**Student Sends:**
```json
{
  "event": "MY_ATTENDANCE"
}
```

**Server Responds (to student only):**
```json
{
  "event": "MY_ATTENDANCE",
  "data": {
    "status": "present"
  }
}
```

**If not marked yet:**
```json
{
  "event": "MY_ATTENDANCE",
  "data": {
    "status": "not yet updated"
  }
}
```

---

#### 4. DONE

**Direction:** Teacher → Server → Persist to DB → Broadcast to ALL

**Teacher Sends:**
```json
{
  "event": "DONE"
}
```

**Server Broadcasts:**
```json
{
  "event": "DONE",
  "data": {
    "message": "Attendance persisted",
    "present": 18,
    "absent": 4,
    "total": 22
  }
}
```

---

### WebSocket Error Handling

**Error Message Format:**
```json
{
  "event": "ERROR",
  "data": {
    "message": "Error description"
  }
}
```

**Common Errors:**
- Unauthorized or invalid token
- Forbidden, teacher event only
- Forbidden, student event only
- No active attendance session

---

## Testing the API

### Using cURL

**1. Signup a teacher:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teacher John",
    "email": "teacher@test.com",
    "password": "password123",
    "role": "teacher"
  }'
```

**2. Signup a student:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Student Jane",
    "email": "student@test.com",
    "password": "password123",
    "role": "student"
  }'
```

**3. Login as teacher:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123"
  }'
```

**4. Create a class (use token from login):**
```bash
curl -X POST http://localhost:3000/class \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -d '{
    "className": "Mathematics 101"
  }'
```

### Using Postman

1. Import the endpoints into Postman
2. Set up environment variables for `baseUrl` and `token`
3. Test each endpoint sequentially

### Testing WebSocket

You can use a WebSocket client like:
- **Postman** (supports WebSocket)
- **wscat** (command-line tool)
- **Browser console** (using WebSocket API)

**Example using browser console:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=YOUR_JWT_TOKEN');

ws.onopen = () => {
  console.log('Connected');
  
  // Send a message
  ws.send(JSON.stringify({
    event: 'MY_ATTENDANCE'
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "teacher" | "student",
  createdAt: Date,
  updatedAt: Date
}
```

### Class Collection
```javascript
{
  _id: ObjectId,
  className: String,
  teacherId: ObjectId (ref: User),
  studentIds: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: Class),
  studentId: ObjectId (ref: User),
  status: "present" | "absent",
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Codes

- **400** - Bad Request (validation error, duplicate email, invalid credentials)
- **401** - Unauthorized (missing or invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **500** - Internal Server Error

---

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong, random value
2. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 10
3. **Token Expiration**: JWT tokens expire after 7 days
4. **Environment Variables**: Never commit `.env` file to version control
5. **CORS**: Configure CORS properly for production

---

## Development Tips

1. **Auto-reload**: Use `npm run dev` for development with nodemon
2. **MongoDB GUI**: Use MongoDB Compass to view database contents
3. **WebSocket Testing**: Use browser DevTools or Postman for WebSocket testing
4. **Logging**: Add console.log statements for debugging

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity

### JWT Token Invalid
- Check if token is being sent in Authorization header
- Verify `JWT_SECRET` matches between signup and login
- Check token expiration

### WebSocket Connection Failed
- Ensure server is running
- Check WebSocket URL format
- Verify JWT token is valid

---

## License

ISC

---

## Author

Built as part of the Live Attendance System project.
