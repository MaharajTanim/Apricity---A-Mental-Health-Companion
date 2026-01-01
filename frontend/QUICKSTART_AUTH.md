# Quick Start Guide - Authentication Components

## What Was Created

✅ **Login Component** (`src/components/Login.jsx`)

- Email/password form with validation
- Error handling and loading states
- Auto-redirect to /home on success

✅ **Register Component** (`src/components/Register.jsx`)

- Name/email/password/confirm form
- Comprehensive validation
- Duplicate email detection

✅ **AuthPage** (`src/pages/AuthPage.jsx`)

- Tabbed interface (Sign In / Register)
- Already integrated into app routing

✅ **Styling** (`src/styles/AuthPage.css`)

- Responsive design
- Modern UI with animations
- Error states and loading indicators

✅ **Utilities**

- `src/utils/api.js` - Axios with auto token injection
- `src/utils/auth.js` - Auth helper functions

## How to Test

### 1. Start the Backend

```bash
cd backend
npm start
# Should run on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
# Should run on http://localhost:5173
```

### 3. Navigate to Auth Page

Open browser: `http://localhost:5173/auth`

### 4. Test Registration

1. Click "Register" tab
2. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   - Confirm: password123
3. Click "Create Account"
4. Should redirect to `/home`
5. Check browser console → Application → Local Storage
   - Should see `token` and `user` stored

### 5. Test Login

1. Navigate back to `/auth`
2. Click "Sign In" tab
3. Enter credentials from registration
4. Click "Sign In"
5. Should redirect to `/home`

## Validation Examples

### Client-Side Validation

**Login:**

- Empty email → "Email is required"
- Invalid email → "Please enter a valid email address"
- Short password → "Password must be at least 6 characters"

**Register:**

- Empty name → "Name is required"
- Name too short → "Name must be at least 2 characters"
- Password mismatch → "Passwords do not match"

### Server-Side Errors

- Wrong credentials → "Invalid email or password"
- Duplicate email → "This email is already registered"
- Server down → "Cannot connect to server"

## Using Authentication in Other Components

### Check if user is logged in

```javascript
import { isAuthenticated, getUser } from "../utils/auth";

function MyComponent() {
  const isLoggedIn = isAuthenticated();
  const user = getUser();

  if (!isLoggedIn) {
    return <Navigate to="/auth" />;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

### Make authenticated API calls

```javascript
import api from "../utils/api";

async function fetchData() {
  try {
    // Token automatically added to headers
    const response = await api.get("/api/user/profile");
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
```

### Logout user

```javascript
import { logout } from "../utils/auth";

function LogoutButton() {
  return <button onClick={logout}>Logout</button>;
}
```

## Environment Setup

Make sure `.env` file exists in `/frontend`:

```bash
REACT_APP_API_URL=http://localhost:5000
```

## Backend Requirements

Your backend must have these endpoints:

### POST /api/auth/register

```javascript
// Request
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/login

```javascript
// Request
{
  "email": "john@example.com",
  "password": "password123"
}

// Response (same as register)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Troubleshooting

### Error: "Cannot connect to server"

- Check backend is running
- Verify REACT_APP_API_URL in .env
- Check backend CORS settings

### Token not saving

- Check browser console for errors
- Verify response contains `token` field
- Check localStorage is enabled

### Not redirecting after login

- Check react-router-dom is installed
- Verify `/home` route exists in App.jsx
- Check browser console for navigation errors

## Next Steps

1. **Create Protected Routes**: Wrap routes that require authentication
2. **Add Logout Button**: In navbar or profile menu
3. **Create Profile Page**: Display and edit user info
4. **Add Token Refresh**: Implement refresh token logic
5. **Add Forgot Password**: Password reset flow

## Files Created

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.jsx          ← Login form
│   │   └── Register.jsx       ← Registration form
│   ├── pages/
│   │   └── AuthPage.jsx       ← Updated with tabs
│   ├── styles/
│   │   └── AuthPage.css       ← Auth styling
│   └── utils/
│       ├── api.js             ← Axios instance
│       └── auth.js            ← Auth helpers
└── AUTH_COMPONENTS.md         ← Full documentation
```

## Key Features

✨ **Client-Side Validation**: Instant feedback on form errors
✨ **Loading States**: Disabled forms during submission
✨ **Error Display**: Field-level and banner errors
✨ **Token Management**: Automatic storage and injection
✨ **Auto Redirect**: Navigate to /home on success
✨ **Responsive Design**: Works on mobile and desktop
✨ **Accessibility**: Proper labels and ARIA attributes

## Need Help?

See `AUTH_COMPONENTS.md` for detailed documentation.
