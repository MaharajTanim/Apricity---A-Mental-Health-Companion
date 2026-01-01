# Home Component & Note Modal Documentation

## Overview

The Home component (HomeDashboard) displays the main dashboard with the Apricity logo, recent diary entries, and a "Create Note" button that opens a modal for creating new diary entries. The NoteModal component handles note creation with title, date, and content fields, automatically posting to the backend API with JWT authentication.

## Components Created

### 1. NoteModal Component (`/src/components/NoteModal.jsx`)

**Purpose:** Modal dialog for creating new diary entries.

**Features:**

- ✅ Title input field (1-200 characters)
- ✅ Date field (auto-set to today, editable, cannot be future date)
- ✅ Content textarea (1-10,000 characters)
- ✅ Character count displays for title and content
- ✅ Client-side validation with error messages
- ✅ Loading state during submission
- ✅ Error banner for API errors
- ✅ Backdrop click to close
- ✅ Escape key to close
- ✅ Form reset on modal open
- ✅ Disabled form during submission

**Props:**

```javascript
{
  isOpen: boolean,        // Controls modal visibility
  onClose: function,      // Called when modal should close
  onSuccess: function     // Called when note is successfully created (receives diary object)
}
```

**Validation Rules:**

- **Title**: Required, 1-200 characters
- **Date**: Required, cannot be in the future
- **Content**: Required, 1-10,000 characters

**API Integration:**

- **Endpoint**: `POST /api/diary`
- **Headers**: `Authorization: Bearer <token>` (automatically added by api.js)
- **Request Body**:

```json
{
  "title": "My Note Title",
  "content": "Note content here...",
  "date": "2025-10-28T00:00:00.000Z"
}
```

**Response Handling:**

- Success (201): Closes modal, calls `onSuccess` with created diary object
- Validation errors (400): Displays field-level errors below inputs
- Server errors (500): Displays error banner at top of form
- Network errors: Displays connection error message

### 2. HomeDashboard Component (`/src/pages/HomeDashboard.jsx`)

**Purpose:** Main dashboard displaying Apricity branding, recent notes, and quick actions.

**Features:**

- ✅ Large Apricity logo (🌅) with branding
- ✅ "Create Note" button that opens modal
- ✅ Welcome message with user's name
- ✅ Recent notes list (5 most recent)
- ✅ Loading state while fetching notes
- ✅ Empty state when no notes exist
- ✅ Note cards with title, date, snippet, emotion badges
- ✅ AI analysis indicator
- ✅ Refresh button for note list
- ✅ Quick action cards (Chat, Insights, Goals)
- ✅ Responsive design

**State Management:**

```javascript
const [isModalOpen, setIsModalOpen] = useState(false);
const [diaries, setDiaries] = useState([]);
const [isLoadingDiaries, setIsLoadingDiaries] = useState(true);
```

**Key Functions:**

- `fetchDiaries()`: Fetches recent diaries from API
- `handleOpenModal()`: Opens note creation modal
- `handleCloseModal()`: Closes modal
- `handleNoteCreated()`: Refreshes diary list after successful creation
- `formatDate()`: Formats ISO date to readable format

**API Integration:**

- **Endpoint**: `GET /api/diary?limit=5&sort=-date`
- **Headers**: `Authorization: Bearer <token>` (automatically added)
- **Response**: Array of diary objects with emotion summaries

### 3. Styling Files

**NoteModal.css** (`/src/styles/NoteModal.css`)

- Modal overlay with fade-in animation
- Modal content with slide-up animation
- Responsive design (mobile-friendly bottom sheet)
- Character counters for title and content
- Error states for invalid inputs
- Loading spinner animation
- Accessible focus states

**HomeDashboard.css** (`/src/styles/HomeDashboard.css`)

- Dashboard header with logo and button
- Welcome card with gradient background
- Notes grid layout (responsive)
- Note cards with hover effects
- Emotion badges with gradients
- AI analysis badge
- Quick action cards
- Loading and empty states
- Mobile-responsive breakpoints

## Usage Example

### Basic Implementation

The HomeDashboard is already integrated into the app routing via ProtectedRoute:

```javascript
// In App.jsx
<Route
  path="/home"
  element={
    <ProtectedRoute>
      <HomeDashboard />
    </ProtectedRoute>
  }
/>
```

### Using NoteModal in Other Components

```javascript
import { useState } from "react";
import NoteModal from "../components/NoteModal";

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNoteCreated = (newDiary) => {
    console.log("Created:", newDiary);
    // Refresh your list or show success message
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Create Note</button>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleNoteCreated}
      />
    </div>
  );
}
```

## Data Flow

### Creating a Note

1. User clicks "Create Note" button
2. `handleOpenModal()` sets `isModalOpen` to `true`
3. NoteModal renders with empty form
4. User fills in title, date (default today), and content
5. Client-side validation on submit
6. POST request to `/api/diary` with Authorization header
7. Backend creates diary entry and triggers ML analysis
8. On success:
   - Modal closes
   - `onSuccess` callback fires with new diary object
   - `fetchDiaries()` refreshes the diary list
9. New note appears in Recent Notes section

### Fetching Notes

1. Component mounts
2. `useEffect` calls `fetchDiaries()`
3. GET request to `/api/diary?limit=5&sort=-date`
4. Backend returns array of diary objects
5. State updates with `setDiaries(diaries)`
6. Notes render in grid layout
7. Each note shows:
   - Title
   - Date (formatted)
   - Content snippet (first 200 chars)
   - Emotion badge (if ML analysis complete)
   - AI analyzed badge (if applicable)

## Backend API Requirements

### POST /api/diary

**Request:**

```json
{
  "title": "String (1-200 chars)",
  "content": "String (1-10,000 chars)",
  "date": "ISO 8601 date string"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Diary entry created successfully. Emotion analysis in progress.",
  "data": {
    "diary": {
      "id": "mongodb-id",
      "title": "My Note Title",
      "content": "Full content...",
      "snippet": "Content preview...",
      "date": "2025-10-28T00:00:00.000Z",
      "mood": "neutral",
      "tags": [],
      "isPrivate": true,
      "aiAnalyzed": false,
      "createdAt": "2025-10-28T12:00:00.000Z",
      "updatedAt": "2025-10-28T12:00:00.000Z"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### GET /api/diary

**Request:**

- Query params: `limit=5`, `sort=-date`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "diaries": [
      {
        "id": "mongodb-id",
        "title": "My Note",
        "snippet": "Preview text...",
        "date": "2025-10-28T00:00:00.000Z",
        "aiAnalyzed": true,
        "emotionSummary": {
          "topEmotion": "joy",
          "detectedEmotions": ["joy", "optimism", "gratitude"],
          "confidence": 0.85,
          "category": "positive"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 10,
      "pages": 2,
      "hasMore": true
    }
  }
}
```

## Features Breakdown

### Modal Features

✅ **Form Fields:**

- Title input with character counter (200 max)
- Date picker (default: today, max: today)
- Content textarea with character counter (10,000 max)

✅ **Validation:**

- Required field validation
- Length validation (min/max characters)
- Future date prevention
- Real-time error clearing

✅ **UX:**

- Auto-focus on title field
- Character counters update live
- Loading state disables form
- Error messages below fields
- Error banner for API errors
- Backdrop click closes modal
- Cancel button closes modal

✅ **API Integration:**

- Automatic JWT token injection
- Field-level error handling
- Success callback with created diary
- Network error detection

### Dashboard Features

✅ **Header:**

- Large Apricity logo (🌅)
- Gradient text branding
- Create Note button (prominent)

✅ **Welcome Section:**

- Personalized greeting with user's name
- Gradient background card
- Motivational message

✅ **Recent Notes:**

- Grid layout (responsive)
- Shows 5 most recent notes
- Loading state with spinner
- Empty state with CTA
- Refresh button

✅ **Note Cards:**

- Title and date header
- Content snippet (3 lines max)
- Emotion badge (if analyzed)
- AI badge (if ML complete)
- Hover effects
- Click to view (future enhancement)

✅ **Quick Actions:**

- Chat Support card
- Emotion Insights card
- Set Goals card
- Hover effects
- Click handlers (future enhancement)

## Client-Side Validation

### Title Validation

```javascript
if (!formData.title.trim()) {
  errors.title = "Title is required";
} else if (formData.title.trim().length > 200) {
  errors.title = "Title must be less than 200 characters";
}
```

### Date Validation

```javascript
if (!formData.date) {
  errors.date = "Date is required";
} else {
  const selectedDate = new Date(formData.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (selectedDate > today) {
    errors.date = "Date cannot be in the future";
  }
}
```

### Content Validation

```javascript
if (!formData.content.trim()) {
  errors.content = "Content is required";
} else if (formData.content.trim().length > 10000) {
  errors.content = "Content must be less than 10,000 characters";
}
```

## Error Handling

### Client-Side Errors

Field-level errors appear below each input:

- Empty fields: "Field is required"
- Title too long: "Title must be less than 200 characters"
- Future date: "Date cannot be in the future"
- Content too long: "Content must be less than 10,000 characters"

### Server-Side Errors

Error banner appears at top of modal:

- **400 Validation Error**: Field-level errors from backend
- **401 Unauthorized**: Token expired (auto-redirect by api.js)
- **500 Server Error**: "Failed to create diary entry"
- **Network Error**: "Cannot connect to server"

## Styling Highlights

### Modal Styling

- Overlay: Semi-transparent black backdrop
- Content: White rounded card
- Animations: Fade-in overlay, slide-up content
- Responsive: Bottom sheet on mobile
- Scrollable: Content area if too tall
- Focus: Blue outline on active elements

### Dashboard Styling

- Logo: Gradient text effect (blue to purple)
- Welcome Card: Gradient background (purple)
- Note Cards: White with border, hover effects
- Emotion Badge: Yellow gradient
- AI Badge: Purple gradient
- Empty State: Dashed border, centered content

## Responsive Design

### Desktop (> 768px)

- Full header with logo left, button right
- Notes grid: 3-4 columns
- Quick actions: 3 columns
- Modal: Centered, 600px max width

### Tablet (768px - 480px)

- Header stacks vertically
- Notes grid: 2 columns
- Quick actions: 2 columns
- Modal: Full width with margins

### Mobile (< 480px)

- Header stacks with full-width button
- Notes grid: 1 column
- Quick actions: 1 column
- Modal: Bottom sheet, 95vh max height

## Testing Checklist

### NoteModal Tests

- [ ] Modal opens when button clicked
- [ ] Modal closes on backdrop click
- [ ] Modal closes on Cancel button
- [ ] Form resets when modal opens
- [ ] Title validation: empty, too long
- [ ] Date validation: empty, future date
- [ ] Content validation: empty, too long
- [ ] Character counters update correctly
- [ ] Submit button disabled during loading
- [ ] Form disabled during submission
- [ ] Success: modal closes, list refreshes
- [ ] Error: displays error banner
- [ ] Network error: shows connection message

### HomeDashboard Tests

- [ ] Logo displays correctly
- [ ] Create Note button opens modal
- [ ] Welcome message shows user's name
- [ ] Loading state displays initially
- [ ] Empty state shows when no notes
- [ ] Notes render in grid
- [ ] Note cards show correct data
- [ ] Date formats correctly
- [ ] Emotion badges display
- [ ] AI badges display when applicable
- [ ] Refresh button updates list
- [ ] Quick action cards render

## Security Considerations

1. **JWT Authentication**: Token automatically added to requests by api.js
2. **Input Validation**: Client-side validation + backend validation
3. **XSS Prevention**: React escapes content automatically
4. **Content Length Limits**: Prevents excessive data
5. **Date Validation**: Prevents future dates
6. **Authorization**: Backend verifies token on all requests

## Performance Optimizations

1. **Lazy Loading**: Modal only renders when open
2. **Limited Queries**: Fetches only 5 most recent notes
3. **Debouncing**: Character counters don't cause re-renders
4. **CSS Animations**: Hardware-accelerated transforms
5. **Form Reset**: Only resets when modal opens, not on close

## Future Enhancements

### NoteModal

- [ ] Auto-save draft to localStorage
- [ ] Rich text editor for content
- [ ] Image/attachment uploads
- [ ] Mood selector dropdown
- [ ] Tags input field
- [ ] Privacy toggle (public/private)
- [ ] Markdown support
- [ ] Word count display

### HomeDashboard

- [ ] Click note card to view full note
- [ ] Edit note functionality
- [ ] Delete note with confirmation
- [ ] Filter notes by emotion
- [ ] Search notes
- [ ] Sort options (date, emotion, title)
- [ ] Pagination for more notes
- [ ] Emotion chart/graph
- [ ] Streak counter
- [ ] Motivational quotes

## Related Files

- `/src/components/NoteModal.jsx` - Note creation modal
- `/src/pages/HomeDashboard.jsx` - Main dashboard page
- `/src/styles/NoteModal.css` - Modal styling
- `/src/styles/HomeDashboard.css` - Dashboard styling
- `/src/utils/api.js` - API axios instance (auto token injection)
- `/src/utils/auth.js` - Auth helpers (getUser, etc.)
- `/backend/src/routes/diary.js` - Backend diary routes
- `/backend/src/models/Diary.js` - Diary model schema

## Environment Configuration

Ensure your `.env` file has:

```bash
REACT_APP_API_URL=http://localhost:5000
```

Backend `.env` should have:

```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apricity
JWT_SECRET=your-secret-key
ML_SERVICE_URL=http://localhost:8000
```

## Troubleshooting

### Modal not opening

- Check `isModalOpen` state
- Verify button onClick handler
- Check console for errors

### Form not submitting

- Check validation errors
- Verify API URL in .env
- Check backend is running
- Check JWT token exists in localStorage

### Notes not loading

- Check backend is running
- Verify MongoDB is running
- Check console for API errors
- Verify token is valid

### Authorization errors

- Token expired - login again
- Token invalid - clear localStorage
- Backend auth middleware issue

## Summary

The Home component provides a complete dashboard experience with:

- ✅ Prominent Apricity branding
- ✅ Easy note creation via modal
- ✅ Recent notes display with emotion analysis
- ✅ JWT-authenticated API calls
- ✅ Responsive design
- ✅ Loading and empty states
- ✅ Error handling
- ✅ Modern, clean UI

All components are ready for testing and can be extended with additional features as needed.
