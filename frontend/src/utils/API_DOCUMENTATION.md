# API Utilities Documentation

## Overview

The Apricity frontend uses a centralized Axios instance for all API requests. This provides consistent configuration, automatic authentication, and robust error handling across the application.

## Configuration

### Environment Variables

The API base URL is configured via environment variables (`.env` file):

```env
VITE_API_URL=http://localhost:5000
```

**Default:** `http://localhost:5000` (if not specified)

### Instance Settings

- **Base URL**: From `VITE_API_URL` environment variable
- **Timeout**: 15 seconds
- **Headers**: `Content-Type: application/json`
- **Credentials**: Not included by default

## Usage

### Basic Import

```javascript
import api from "../utils/api";
```

### Making Requests

#### GET Request

```javascript
const response = await api.get("/api/diary");
const response = await api.get("/api/diary/123");
const response = await api.get("/api/emotion/log?range=weekly");
```

#### POST Request

```javascript
const response = await api.post("/api/auth/login", {
  email: "user@example.com",
  password: "password123",
});
```

#### PUT Request

```javascript
const response = await api.put("/api/diary/123", {
  title: "Updated Title",
  content: "Updated content",
});
```

#### DELETE Request

```javascript
const response = await api.delete("/api/diary/123");
```

## Interceptors

### Request Interceptor

**Automatically handles:**

- Retrieves JWT token from `localStorage`
- Attaches `Authorization: Bearer <token>` header to all requests
- Logs requests in development mode

**Example Flow:**

```
User Request → Get token from localStorage → Attach to headers → Send request
```

### Response Interceptor

**Automatically handles:**

#### Success (2xx)

- Returns response data
- Logs successful requests in development

#### 401 Unauthorized

- Clears token and user data from localStorage
- Redirects to `/auth` page
- Prevents infinite redirect loops

#### 403 Forbidden

- Logs warning about access denied
- Error is still thrown for component handling

#### 404 Not Found

- Logs warning about missing resource
- Error is still thrown for component handling

#### 422/400 Validation Error

- Logs validation errors
- Error is still thrown with validation details

#### 429 Too Many Requests

- Logs rate limit warning

#### 500/502/503/504 Server Errors

- Logs server error details

#### Network Errors

- Adds user-friendly error message
- Indicates connection issues

## Helper Functions

### `isNetworkError(error)`

Checks if the error is a network/connection error.

```javascript
import api, { isNetworkError } from "../utils/api";

try {
  await api.get("/api/diary");
} catch (error) {
  if (isNetworkError(error)) {
    console.log("Connection problem!");
  }
}
```

### `isAuthError(error)`

Checks if the error is an authentication error (401).

```javascript
import api, { isAuthError } from "../utils/api";

try {
  await api.get("/api/user/profile");
} catch (error) {
  if (isAuthError(error)) {
    console.log("Please login again");
  }
}
```

### `isValidationError(error)`

Checks if the error is a validation error (400/422).

```javascript
import api, { isValidationError } from "../utils/api";

try {
  await api.post("/api/diary", data);
} catch (error) {
  if (isValidationError(error)) {
    console.log("Form validation failed");
  }
}
```

### `getErrorMessage(error)`

Extracts user-friendly error message from error object.

```javascript
import api, { getErrorMessage } from "../utils/api";

try {
  await api.post("/api/diary", data);
} catch (error) {
  const message = getErrorMessage(error);
  setApiError(message); // Display to user
}
```

### `getValidationErrors(error)`

Extracts validation error array from error object.

```javascript
import api, { getValidationErrors } from "../utils/api";

try {
  await api.post("/api/diary", data);
} catch (error) {
  const validationErrors = getValidationErrors(error);
  // Returns: [{ field: "title", message: "Title is required" }]

  const errors = {};
  validationErrors.forEach((err) => {
    errors[err.field] = err.message;
  });
  setErrors(errors);
}
```

## Error Handling Patterns

### Basic Error Handling

```javascript
try {
  const response = await api.get("/api/diary");
  if (response.data.success) {
    setData(response.data.data);
  }
} catch (error) {
  console.error("Error fetching data:", error);
  setApiError("Failed to load data");
}
```

### Comprehensive Error Handling

```javascript
import api, {
  isNetworkError,
  isValidationError,
  getErrorMessage,
  getValidationErrors,
} from "../utils/api";

try {
  const response = await api.post("/api/diary", formData);
  if (response.data.success) {
    // Handle success
  }
} catch (error) {
  if (isNetworkError(error)) {
    setApiError("Cannot connect to server. Please check your connection.");
  } else if (isValidationError(error)) {
    const validationErrors = getValidationErrors(error);
    // Map to form errors
    const formErrors = {};
    validationErrors.forEach((err) => {
      formErrors[err.field] = err.message;
    });
    setErrors(formErrors);
  } else {
    const message = getErrorMessage(error);
    setApiError(message);
  }
}
```

### With Loading States

```javascript
const [isLoading, setIsLoading] = useState(false);
const [apiError, setApiError] = useState("");

const fetchData = async () => {
  setIsLoading(true);
  setApiError("");

  try {
    const response = await api.get("/api/diary");
    if (response.data.success) {
      setData(response.data.data);
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.response) {
      setApiError(error.response.data.message || "Failed to load data");
    } else {
      setApiError("Cannot connect to server");
    }
  } finally {
    setIsLoading(false);
  }
};
```

## Development vs Production

### Development Mode

- All requests/responses logged to console
- Detailed error information
- Uses `console.log`, `console.warn`, `console.error`

### Production Mode

- Minimal console logging
- User-friendly error messages
- Security-focused (no sensitive data in logs)

## Authentication Flow

1. User logs in via `/api/auth/login`
2. Backend returns JWT token
3. Token stored in `localStorage` via `setAuth(token, user)`
4. All subsequent requests automatically include token
5. If token expires (401), user is redirected to `/auth`

## Common Scenarios

### Protected API Call

```javascript
// Token is automatically attached by interceptor
const response = await api.get("/api/user/profile");
```

### Handle Token Expiration

```javascript
// 401 errors automatically:
// 1. Clear localStorage
// 2. Redirect to /auth
// Component just needs to handle the error
try {
  const response = await api.get("/api/diary");
} catch (error) {
  // User will already be redirected if 401
  setApiError("An error occurred");
}
```

### Multiple Requests

```javascript
try {
  const [diaries, emotions, profile] = await Promise.all([
    api.get("/api/diary"),
    api.get("/api/emotion/log?range=weekly"),
    api.get("/api/user/profile"),
  ]);

  // All requests have auth token attached automatically
} catch (error) {
  // Handle errors
}
```

## Best Practices

1. **Always use try-catch** with async/await
2. **Check response.data.success** for backend success flag
3. **Use helper functions** for error checking
4. **Display user-friendly errors** instead of technical messages
5. **Handle loading states** for better UX
6. **Clear errors** when retrying or when user types
7. **Don't manually add Authorization header** (interceptor handles it)

## Troubleshooting

### Token not being sent

- Check that token exists in localStorage
- Check browser console for request logs (dev mode)
- Verify interceptor is running

### CORS errors

- Check backend CORS configuration
- Verify `VITE_API_URL` is correct
- Check network tab in browser DevTools

### 401 redirects not working

- Check that pathname check is correct
- Verify localStorage is being cleared
- Check browser console for warnings

### Request timing out

- Default timeout is 15 seconds
- Check backend server is running
- Check network connection
- Adjust timeout if needed for slow operations
