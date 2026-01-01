# Authentication API Documentation

## Overview

The authentication system uses JWT (JSON Web Tokens) with bcrypt password hashing. Tokens expire after 7 days by default.

## Environment Variables Required

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
```

---

## Endpoints

### 1. Register New User

**POST** `/api/auth/register`

Creates a new user account with hashed password.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `name`: 2-100 characters, required
- `email`: Valid email format, unique, required
- `password`: Minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-28T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Error Responses:**

_400 - Validation Error:_

```json
{
  "success": false,
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

_409 - User Already Exists:_

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

### 2. Login User

**POST** `/api/auth/login`

Authenticates user and returns JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `email`: Valid email format, required
- `password`: Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-28T10:30:00.000Z",
      "lastLogin": "2025-10-28T12:45:00.000Z",
      "profile": {
        "preferences": {
          "theme": "dark",
          "notifications": true
        }
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Error Responses:**

_400 - Validation Error:_

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

_401 - Invalid Credentials:_

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

_403 - Account Deactivated:_

```json
{
  "success": false,
  "message": "Account is deactivated. Please contact support."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

### 3. Verify Token

**POST** `/api/auth/verify`

Verifies JWT token and returns user information.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-28T10:30:00.000Z",
      "profile": {
        "preferences": {
          "theme": "dark",
          "notifications": true
        }
      }
    }
  }
}
```

**Error Responses:**

_401 - No Token:_

```json
{
  "success": false,
  "message": "No token provided"
}
```

_401 - Invalid Token:_

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

_404 - User Not Found:_

```json
{
  "success": false,
  "message": "User not found"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Test Endpoint

**GET** `/api/auth/test`

Tests if auth routes are operational.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Auth routes are working",
  "endpoints": {
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login",
    "verify": "POST /api/auth/verify"
  }
}
```

---

## Authentication Middleware

### Using Protected Routes

Import and use the `authenticate` middleware:

```javascript
const { authenticate } = require("./middleware");

// Protected route example
router.get("/profile", authenticate, (req, res) => {
  // req.user contains the authenticated user
  // req.userId contains the user's ID
  res.json({
    user: req.user,
  });
});
```

### Optional Authentication

For routes that work with or without auth:

```javascript
const { optionalAuthenticate } = require("./middleware");

router.get("/posts", optionalAuthenticate, (req, res) => {
  // req.user exists if token was provided and valid
  // req.user is undefined if no token or invalid token
  const isAuthenticated = !!req.user;
  // Return different data based on auth status
});
```

---

## JWT Token Structure

**Payload:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": 1698500000,
  "exp": 1699104800
}
```

**Header Format:**

```
Authorization: Bearer <token>
```

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Valid Examples:**

- `SecurePass123`
- `MyPassword1`
- `Test1234Pass`

**Invalid Examples:**

- `password` (no uppercase or number)
- `PASSWORD123` (no lowercase)
- `Pass123` (too short)

---

## Security Features

1. **Password Hashing**: Uses bcrypt with configurable salt rounds (default: 10)
2. **Email Normalization**: Converts emails to lowercase
3. **Token Expiration**: Configurable expiration time (default: 7 days)
4. **Account Status**: Checks if user account is active
5. **Input Validation**: Comprehensive validation using express-validator
6. **Last Login Tracking**: Updates on each successful login

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

**HTTP Status Codes:**

- `200` - Success (Login, Verify)
- `201` - Created (Register)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid credentials, invalid/expired token)
- `403` - Forbidden (Account deactivated)
- `404` - Not Found (User not found)
- `409` - Conflict (Email already exists)
- `500` - Internal Server Error

---

## Testing with JavaScript/Fetch

**Register:**

```javascript
const response = await fetch("http://localhost:5000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass123",
  }),
});
const data = await response.json();
```

**Login:**

```javascript
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123",
  }),
});
const data = await response.json();
const token = data.data.token;
```

**Authenticated Request:**

```javascript
const response = await fetch("http://localhost:5000/api/auth/verify", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
```

---

## Best Practices

1. **Store tokens securely** in httpOnly cookies or secure storage
2. **Include token in Authorization header** for all protected requests
3. **Handle token expiration** gracefully with refresh logic
4. **Never log or expose** JWT_SECRET in production
5. **Use HTTPS** in production to prevent token interception
6. **Implement rate limiting** for auth endpoints
7. **Add CAPTCHA** for registration to prevent automated abuse

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add CAPTCHA for registration
- [ ] Set up monitoring for failed login attempts
- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Configure CORS properly
- [ ] Set appropriate token expiration times
