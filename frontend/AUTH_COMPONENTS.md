# Authentication Components Documentation

## Overview

The Login and Register components provide a complete authentication flow for the Apricity Mental Health Companion frontend. They handle user input, client-side validation, API communication, JWT token storage, and automatic redirection.

## Components

### 1. Login Component (`/src/components/Login.jsx`)

**Purpose:** Handles user sign-in with email and password.

**Features:**

- Email and password input fields
- Real-time client-side validation
- Error display for field-level and API errors
- Loading state with disabled form during submission
- Stores JWT token in localStorage on success
- Redirects to `/home` after successful login

**Validation Rules:**

- Email: Required, must be valid email format
- Password: Required, minimum 6 characters

**API Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response:**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### 2. Register Component (`/src/components/Register.jsx`)

**Purpose:** Handles new user registration with name, email, and password.

**Features:**

- Name, email, password, and confirm password fields
- Comprehensive client-side validation
- Password confirmation matching
- Error display for field-level and API errors
- Loading state with disabled form during submission
- Stores JWT token in localStorage on success
- Redirects to `/home` after successful registration

**Validation Rules:**

- Name: Required, 2-50 characters
- Email: Required, valid email format
- Password: Required, 6-100 characters
- Confirm Password: Must match password

**API Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response:**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### 3. AuthPage (`/src/pages/AuthPage.jsx`)

**Purpose:** Container page that provides tabbed interface for Login and Register.

**Features:**

- Tab navigation between Sign In and Register
- Responsive design
- Styled with AuthPage.css

## Utility Files

### 1. API Utility (`/src/utils/api.js`)

**Purpose:** Axios instance with interceptors for authentication.

**Features:**

- Automatic token injection in request headers
- Automatic redirect to `/auth` on 401 Unauthorized
- Base URL configuration from environment variables
- 10-second request timeout

**Usage:**

```javascript
import api from "../utils/api";

// Make authenticated request
const response = await api.get("/api/user/profile");
```

### 2. Auth Utility (`/src/utils/auth.js`)

**Purpose:** Helper functions for managing authentication state.

**Functions:**

- `getToken()` - Retrieve JWT token from localStorage
- `getUser()` - Retrieve user object from localStorage
- `isAuthenticated()` - Check if user is logged in
- `setAuth(token, user)` - Store authentication data
- `clearAuth()` - Remove authentication data
- `logout()` - Logout and redirect to auth page
- `getAuthHeader()` - Get Authorization header object

**Usage:**

```javascript
import { isAuthenticated, logout } from "../utils/auth";

if (!isAuthenticated()) {
  // Redirect to auth page
}

// Logout user
logout();
```

## Styling

**CSS File:** `/src/styles/AuthPage.css`

**Key Styles:**

- Responsive design (mobile-friendly)
- Tab navigation with active state indicator
- Form input styling with focus states
- Error states for invalid inputs
- Loading spinner animation
- Error banner for API errors

**Color Scheme:**

- Primary: Blue (#3b82f6)
- Error: Red (#ef4444)
- Gray shades for backgrounds and borders

## Usage Example

### Basic Implementation

The AuthPage is already integrated into the app routing:

```javascript
// In App.jsx
<Route path="/auth" element={<AuthPage />} />
```

### Accessing Authentication State

```javascript
import { isAuthenticated, getUser, logout } from "./utils/auth";

function ProtectedComponent() {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" />;
  }

  const user = getUser();

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```javascript
import api from "./utils/api";

async function fetchUserData() {
  try {
    const response = await api.get("/api/user/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}
```

## Error Handling

### Client-Side Errors

Client-side validation errors are displayed inline below each form field:

- Empty fields: "Field is required"
- Invalid email: "Please enter a valid email address"
- Short password: "Password must be at least 6 characters"
- Password mismatch: "Passwords do not match"

### Server-Side Errors

Server errors are displayed in an error banner at the top of the form:

- **401 Unauthorized**: "Invalid email or password"
- **409 Conflict**: "This email is already registered"
- **500 Server Error**: API error message or generic error
- **Network Error**: "Cannot connect to server. Please try again later."

## Environment Configuration

Set the API URL in your `.env` file:

```bash
REACT_APP_API_URL=http://localhost:5000
```

If not set, defaults to `http://localhost:5000`.

## localStorage Storage

After successful authentication, the following items are stored:

1. **token** - JWT token for API authentication
2. **user** - User object (id, name, email) as JSON string

## Security Considerations

1. **Token Storage**: JWT stored in localStorage (accessible to JavaScript)
2. **HTTPS**: Use HTTPS in production to prevent token interception
3. **Token Expiration**: API utility automatically handles 401 responses
4. **Password Requirements**: Minimum 6 characters (configurable)
5. **Client Validation**: Reduces unnecessary API calls
6. **Server Validation**: Always validate on backend as well

## Testing

### Manual Testing Steps

1. **Register Flow:**

   - Navigate to `/auth`
   - Click "Register" tab
   - Fill in all fields with valid data
   - Submit form
   - Should redirect to `/home`
   - Check localStorage for token and user

2. **Login Flow:**

   - Navigate to `/auth`
   - Click "Sign In" tab
   - Enter registered credentials
   - Submit form
   - Should redirect to `/home`
   - Check localStorage for token and user

3. **Validation Testing:**

   - Leave fields empty
   - Enter invalid email
   - Enter short password
   - Enter mismatched passwords (Register)
   - Verify error messages appear

4. **Error Handling:**
   - Try logging in with wrong credentials
   - Try registering with existing email
   - Verify error banners appear

### Backend Requirements

Ensure your backend has these endpoints:

**POST /api/auth/register**

- Accepts: { name, email, password }
- Returns: { token, user }

**POST /api/auth/login**

- Accepts: { email, password }
- Returns: { token, user }

## Troubleshooting

### "Cannot connect to server"

1. Check if backend is running
2. Verify REACT_APP_API_URL in .env
3. Check CORS configuration on backend

### "Invalid email or password"

1. Verify credentials are correct
2. Check backend logs for errors
3. Ensure user exists in database

### Token not persisting

1. Check browser console for localStorage errors
2. Verify token is in response
3. Check if localStorage is disabled in browser

### Redirect not working

1. Verify react-router-dom is installed
2. Check navigation import: `import { useNavigate } from "react-router-dom"`
3. Ensure /home route exists in App.jsx

## Future Enhancements

Potential improvements to consider:

1. **Password Strength Indicator**: Visual feedback on password strength
2. **Email Verification**: Send verification email after registration
3. **Forgot Password**: Password reset flow
4. **Social Login**: OAuth integration (Google, Facebook)
5. **Remember Me**: Longer session option
6. **Two-Factor Authentication**: Enhanced security
7. **Loading States**: Skeleton screens instead of disabled forms
8. **Success Messages**: Toast notifications for successful actions
9. **Input Masks**: Format phone numbers, etc.
10. **Accessibility**: Enhanced ARIA labels and keyboard navigation

## Related Files

- `/src/components/Login.jsx` - Login component
- `/src/components/Register.jsx` - Register component
- `/src/pages/AuthPage.jsx` - Auth page container
- `/src/styles/AuthPage.css` - Auth styling
- `/src/utils/api.js` - API axios instance
- `/src/utils/auth.js` - Auth helper functions
- `/backend/src/routes/auth.js` - Backend auth routes
- `/frontend/.env.example` - Environment variables template
