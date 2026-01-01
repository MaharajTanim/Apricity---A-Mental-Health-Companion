# DiaryCard Component Documentation

## Overview

The DiaryCard component displays individual diary entries with title, date, first 120 characters of content, emotion badges, and Edit/Delete action buttons. It includes an embedded delete confirmation dialog and integrates with EditNoteModal for editing functionality.

## Components Created

### 1. DiaryCard Component (`/src/components/DiaryCard.jsx`)

**Purpose:** Display diary entry with action buttons.

**Features:**

- ✅ Title display
- ✅ Date display (formatted)
- ✅ Content truncated to first 120 characters
- ✅ Emotion badge (if ML analyzed)
- ✅ AI analyzed badge
- ✅ Edit button (opens EditNoteModal)
- ✅ Delete button (shows confirmation dialog)
- ✅ Delete confirmation modal
- ✅ Loading state during deletion
- ✅ Hover effects

**Props:**

```javascript
{
  diary: {              // Diary object
    id: string,
    title: string,
    content: string,
    date: string,
    emotionSummary: {
      topEmotion: string,
      confidence: number
    },
    aiAnalyzed: boolean
  },
  onEdit: function,     // Called when Edit button clicked (receives diary object)
  onDelete: function,   // Called when Delete confirmed (receives diary id)
  formatDate: function  // Formats date string for display
}
```

**State:**

- `showDeleteConfirm`: Controls delete confirmation dialog visibility
- `isDeleting`: Loading state during deletion

**Key Functions:**

- `truncateContent()`: Truncates content to 120 chars with "..."
- `handleEdit()`: Calls `onEdit` with diary object
- `handleDeleteClick()`: Shows confirmation dialog
- `handleCancelDelete()`: Hides confirmation dialog
- `handleConfirmDelete()`: Calls `onDelete` and handles loading state

### 2. EditNoteModal Component (`/src/components/EditNoteModal.jsx`)

**Purpose:** Modal for editing existing diary entries.

**Features:**

- ✅ Pre-filled form with diary data
- ✅ Title input (1-200 chars)
- ✅ Date picker (editable, cannot be future)
- ✅ Content textarea (1-10,000 chars)
- ✅ Character counters
- ✅ Client-side validation
- ✅ Loading state during submission
- ✅ Error handling (field + API errors)
- ✅ Auto-close on success

**Props:**

```javascript
{
  isOpen: boolean,        // Controls modal visibility
  onClose: function,      // Called when modal should close
  onSuccess: function,    // Called when note is successfully updated
  diary: object           // Diary object to edit
}
```

**API Integration:**

- **Endpoint**: `PUT /api/diary/:id`
- **Headers**: `Authorization: Bearer <token>` (automatically added)
- **Request Body**:

```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "date": "2025-10-28T00:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Diary entry updated successfully",
  "data": {
    "diary": {
      /* updated diary object */
    }
  }
}
```

### 3. DiaryCard Styling (`/src/styles/DiaryCard.css`)

**Key Styles:**

- Card layout with hover effects
- Action buttons (Edit: blue, Delete: red)
- Confirmation dialog styling
- Emotion and AI badges
- Responsive design (mobile-friendly)
- Loading spinner animation
- Danger button styling

## Integration in HomeDashboard

**Updated HomeDashboard.jsx:**

- Added `EditNoteModal` import
- Added `DiaryCard` import
- Added state: `isEditModalOpen`, `editingDiary`
- Added `handleEditNote()`: Opens edit modal with diary data
- Added `handleNoteUpdated()`: Refreshes list after update
- Added `handleDeleteNote()`: Calls DELETE API and refreshes list
- Replaced inline note card with `<DiaryCard />` component

## Data Flow

### Edit Flow

1. User clicks "Edit" button on DiaryCard
2. `handleEditNote(diary)` sets `editingDiary` and opens modal
3. EditNoteModal renders with pre-filled form
4. User edits and submits
5. PUT request to `/api/diary/:id`
6. On success: modal closes, `handleNoteUpdated()` refreshes list
7. Updated note appears in grid

### Delete Flow

1. User clicks "Delete" button on DiaryCard
2. Confirmation dialog shows
3. User clicks "Delete" in dialog
4. `handleDeleteNote(id)` called
5. DELETE request to `/api/diary/:id`
6. On success: `fetchDiaries()` refreshes list
7. Note removed from grid

## API Endpoints

### PUT /api/diary/:id (Update)

**Request:**

```json
PUT /api/diary/507f1f77bcf86cd799439011
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated Title",
  "content": "Updated content...",
  "date": "2025-10-28T00:00:00.000Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Diary entry updated successfully",
  "data": {
    "diary": {
      "id": "507f1f77bcf86cd799439011",
      "title": "Updated Title",
      "content": "Updated content...",
      "snippet": "Updated content...",
      "date": "2025-10-28T00:00:00.000Z",
      "emotionSummary": {
        /* if available */
      },
      "aiAnalyzed": true,
      "updatedAt": "2025-10-28T13:00:00.000Z"
    }
  }
}
```

### DELETE /api/diary/:id (Delete)

**Request:**

```json
DELETE /api/diary/507f1f77bcf86cd799439011
Headers: Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Diary entry and associated emotion data deleted successfully"
}
```

**Error Responses:**

- **404**: Diary not found
- **403**: Access denied (not owner)
- **401**: Unauthorized (token invalid)

## Component Features

### DiaryCard

**Visual Elements:**

- Title (h4, truncated if too long)
- Date (formatted: "Oct 28, 2025")
- Content (first 120 chars + "...")
- Emotion badge (yellow gradient)
- AI badge (purple gradient)
- Edit button (blue, pen icon)
- Delete button (red, trash icon)

**Interactions:**

- Hover: Card elevates, border color changes
- Edit click: Opens EditNoteModal
- Delete click: Shows confirmation dialog
- Cancel: Closes confirmation dialog
- Confirm delete: Deletes note with loading state

### EditNoteModal

**Visual Elements:**

- Modal overlay (semi-transparent)
- Modal content (white card)
- Header: "Edit Note"
- Form fields: title, date, content
- Character counters
- Cancel/Update buttons

**Interactions:**

- Backdrop click: Closes modal
- Cancel button: Closes modal
- Update button: Validates and submits
- Escape key: Closes modal
- Form disabled during submission

### Delete Confirmation Dialog

**Visual Elements:**

- Warning icon (⚠️)
- Header: "Delete Note?"
- Message: Shows note title
- Cancel/Delete buttons

**Interactions:**

- Backdrop click: Cancels deletion
- Cancel button: Closes dialog
- Delete button: Confirms deletion with loading

## Validation

### Edit Form Validation

Same as NoteModal:

- **Title**: Required, 1-200 characters
- **Date**: Required, cannot be future
- **Content**: Required, 1-10,000 characters

## Error Handling

### Edit Errors

- Field-level errors below inputs
- API error banner at top of modal
- Network errors: "Cannot connect to server"
- Validation errors from backend

### Delete Errors

- Alert dialog with error message
- Network errors: "Cannot connect to server"
- 403/404 errors: Specific error messages

## Styling Highlights

### DiaryCard

- White background with border
- Hover: Blue border, elevation, translateY
- Action buttons: Outlined style
- Edit: Blue theme
- Delete: Red theme
- Responsive: Full-width buttons on mobile

### Confirmation Dialog

- Centered modal
- Warning icon and message
- Danger button styling
- Slide-up animation
- Mobile: Stacked buttons

### EditNoteModal

- Same styling as NoteModal
- Title: "Edit Note" instead of "Create"
- Button: "Update Note" instead of "Save"

## Usage Example

### In HomeDashboard

```javascript
import DiaryCard from "../components/DiaryCard";
import EditNoteModal from "../components/EditNoteModal";

function HomeDashboard() {
  const [diaries, setDiaries] = useState([]);
  const [editingDiary, setEditingDiary] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditNote = (diary) => {
    setEditingDiary(diary);
    setIsEditModalOpen(true);
  };

  const handleDeleteNote = async (diaryId) => {
    await api.delete(`/api/diary/${diaryId}`);
    fetchDiaries(); // Refresh list
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="notes-grid">
        {diaries.map((diary) => (
          <DiaryCard
            key={diary.id}
            diary={diary}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            formatDate={formatDate}
          />
        ))}
      </div>

      <EditNoteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchDiaries()}
        diary={editingDiary}
      />
    </>
  );
}
```

## Responsive Design

### Desktop (> 640px)

- Side-by-side Edit/Delete buttons
- Card hover effects
- Confirmation dialog: 450px max width

### Mobile (< 640px)

- Stacked Edit/Delete buttons (full width)
- Smaller padding
- Confirmation dialog: 90% width
- Stacked confirmation buttons

## Security

- ✅ JWT authentication required
- ✅ Backend validates ownership
- ✅ Client-side validation + server validation
- ✅ Confirmation required for delete
- ✅ Content length limits

## Testing Checklist

### DiaryCard Tests

- [ ] Card displays title, date, content (120 chars)
- [ ] Emotion badge shows if available
- [ ] AI badge shows if analyzed
- [ ] Edit button opens EditNoteModal
- [ ] Delete button shows confirmation
- [ ] Cancel delete closes dialog
- [ ] Confirm delete removes note
- [ ] Loading state during deletion
- [ ] Error handling for delete failures

### EditNoteModal Tests

- [ ] Modal opens with pre-filled data
- [ ] Form shows correct diary content
- [ ] Title, date, content editable
- [ ] Validation works (empty, too long, future date)
- [ ] Character counters update
- [ ] Submit button disabled during loading
- [ ] Success: modal closes, list refreshes
- [ ] Error: displays error message
- [ ] Cancel closes modal without changes

### Delete Confirmation Tests

- [ ] Dialog shows with note title
- [ ] Backdrop click cancels
- [ ] Cancel button closes dialog
- [ ] Delete button confirms deletion
- [ ] Loading state during delete
- [ ] Success: note removed from list
- [ ] Error: shows error message

## Performance

- ✅ Content truncation (no full content rendered)
- ✅ Conditional rendering (badges only if data exists)
- ✅ Event handler memoization
- ✅ Efficient re-renders
- ✅ CSS animations (hardware-accelerated)

## Accessibility

- ✅ Button labels and titles
- ✅ ARIA labels on close buttons
- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ Error role on error banners
- ✅ Semantic HTML structure

## Future Enhancements

### DiaryCard

- [ ] Click card to view full note
- [ ] Share button
- [ ] Favorite/pin functionality
- [ ] Tag display
- [ ] Mood indicator

### EditNoteModal

- [ ] Auto-save draft
- [ ] Undo/redo
- [ ] Rich text editor
- [ ] Image attachments
- [ ] Version history

### Delete

- [ ] Soft delete (trash/archive)
- [ ] Bulk delete
- [ ] Undo delete (toast with undo)
- [ ] Delete animation

## Related Files

- `/src/components/DiaryCard.jsx` - Diary card component
- `/src/components/EditNoteModal.jsx` - Edit modal
- `/src/styles/DiaryCard.css` - Card and dialog styling
- `/src/pages/HomeDashboard.jsx` - Dashboard integration
- `/backend/src/routes/diary.js` - Backend API routes

## Summary

The DiaryCard component provides a complete diary entry display with:

- ✅ Title, date, and content preview (120 chars)
- ✅ Edit functionality with pre-filled modal
- ✅ Delete functionality with confirmation
- ✅ Emotion and AI badges
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

All components are fully integrated with the HomeDashboard and ready for testing!
