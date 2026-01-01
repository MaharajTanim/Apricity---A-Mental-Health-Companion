# Database Models Documentation

## Overview

Apricity uses MongoDB with Mongoose ODM for data persistence. All models use timestamps and appropriate indexes for optimal query performance.

## Models

### 1. User Model (`models/User.js`)

**Purpose**: Represents user accounts in the system.

**Schema**:

```javascript
{
  name: String (required, 2-100 chars),
  email: String (required, unique, lowercase),
  passwordHash: String (required, not returned by default),
  createdAt: Date (auto-generated, immutable),
  lastLogin: Date,
  isActive: Boolean (default: true),
  profile: {
    avatar: String,
    bio: String (max 500 chars),
    preferences: {
      theme: String (enum: 'light', 'dark', 'auto'),
      notifications: Boolean
    }
  }
}
```

**Indexes**:

- `email` (unique)
- `createdAt` (descending)
- `isActive`

**Virtuals**:

- `diaries` - references all user's diary entries
- `emotions` - references all user's emotion records

**Methods**:

- `toJSON()` - removes passwordHash from output
- `findByEmail(email)` - static method to find user by email

**Usage Example**:

```javascript
const User = require("./models/User");

// Create new user
const user = new User({
  name: "John Doe",
  email: "john@example.com",
  passwordHash: hashedPassword,
});
await user.save();

// Find by email
const user = await User.findByEmail("john@example.com");
```

---

### 2. Diary Model (`models/Diary.js`)

**Purpose**: Represents journal entries created by users.

**Schema**:

```javascript
{
  user: ObjectId (ref: User, required, indexed),
  title: String (required, 1-200 chars),
  content: String (required, 1-10000 chars),
  date: Date (required, default: now, indexed),
  mood: String (enum: 'very_bad', 'bad', 'neutral', 'good', 'very_good'),
  tags: [String] (lowercase),
  isPrivate: Boolean (default: true),
  aiAnalyzed: Boolean (default: false),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

**Indexes**:

- `{ user: 1, date: -1 }` (compound)
- `{ user: 1, createdAt: -1 }` (compound)
- `{ user: 1, tags: 1 }` (compound)
- `date` (descending)

**Virtuals**:

- `emotion` - references associated emotion analysis

**Methods**:

- `getExcerpt(length)` - returns truncated content
- `findByUser(userId, options)` - static method to find user's diaries
- `findByDateRange(userId, startDate, endDate)` - static method for date queries
- `searchByText(userId, searchText)` - static method for text search

**Usage Example**:

```javascript
const Diary = require("./models/Diary");

// Create new diary entry
const diary = new Diary({
  user: userId,
  title: "My Day",
  content: "Today was challenging but I learned a lot...",
  date: new Date(),
  mood: "good",
  tags: ["work", "growth"],
});
await diary.save();

// Find user's diaries
const diaries = await Diary.findByUser(userId, { limit: 10 });

// Search by date range
const diaries = await Diary.findByDateRange(
  userId,
  new Date("2025-01-01"),
  new Date("2025-12-31")
);
```

---

### 3. Emotion Model (`models/Emotion.js`)

**Purpose**: Stores emotion detection results from ML analysis.

**Schema**:

```javascript
{
  user: ObjectId (ref: User, required, indexed),
  date: Date (required, default: now, indexed),
  scores: {
    // 28 GoEmotions labels, each 0-1
    joy: Number,
    sadness: Number,
    anger: Number,
    fear: Number,
    surprise: Number,
    disgust: Number,
    neutral: Number,
    // ... and 21 more emotions
  },
  topLabel: String (required, enum of 28 emotions, indexed),
  detectedEmotions: [String] (array of detected emotion labels),
  confidence: Number (required, 0-1),
  diary: ObjectId (ref: Diary, optional, indexed),
  sourceText: String (max 5000 chars),
  modelVersion: String (default: '1.0.0'),
  processingTime: Number (milliseconds),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

**Emotion Labels** (28 from GoEmotions):

- **Positive**: admiration, amusement, approval, caring, desire, excitement, gratitude, joy, love, optimism, pride, relief
- **Negative**: anger, annoyance, disappointment, disapproval, disgust, embarrassment, fear, grief, nervousness, remorse, sadness
- **Ambiguous**: confusion, curiosity, realization, surprise
- **Neutral**: neutral

**Indexes**:

- `{ user: 1, date: -1 }` (compound)
- `{ user: 1, createdAt: -1 }` (compound)
- `{ user: 1, topLabel: 1 }` (compound)
- `{ user: 1, diary: 1 }` (compound)
- `date` (descending)
- `diary` (sparse)

**Methods**:

- `getTopEmotions(limit)` - returns top N emotions by score
- `getEmotionCategory()` - returns 'positive', 'negative', 'ambiguous', or 'neutral'
- `findByUser(userId, options)` - static method to find user's emotions
- `findByDateRange(userId, startDate, endDate)` - static method for date queries
- `getEmotionStats(userId, startDate, endDate)` - static method for aggregated stats
- `findByDiary(diaryId)` - static method to find emotion for a diary entry

**Usage Example**:

```javascript
const Emotion = require("./models/Emotion");

// Create emotion record
const emotion = new Emotion({
  user: userId,
  date: new Date(),
  scores: {
    joy: 0.85,
    excitement: 0.72,
    optimism: 0.65,
    neutral: 0.12,
  },
  topLabel: "joy",
  detectedEmotions: ["joy", "excitement", "optimism"],
  confidence: 0.85,
  diary: diaryId,
  sourceText: "I feel great today!",
  modelVersion: "1.0.0",
  processingTime: 125,
});
await emotion.save();

// Get emotion statistics
const stats = await Emotion.getEmotionStats(
  userId,
  new Date("2025-01-01"),
  new Date("2025-12-31")
);
// Returns: { total, byCategory, topEmotions, averageConfidence }

// Get top emotions for a record
const topEmotions = emotion.getTopEmotions(3);
// Returns: [{ emotion: 'joy', score: 0.85 }, ...]
```

---

## Database Connection (`db.js`)

**Functions**:

- `connectDB()` - Connects to MongoDB using MONGODB_URI from env
- `disconnectDB()` - Closes MongoDB connection
- `isConnected()` - Returns connection status (boolean)

**Usage**:

```javascript
const { connectDB, isConnected } = require("./db");

// Connect
await connectDB();

// Check status
if (isConnected()) {
  console.log("Database connected");
}
```

---

## Relationships

```
User (1) ─────< (Many) Diary
  │                      │
  │                      │
  └────< (Many) Emotion (Many) >───┘
                         │
                         └─> (Optional) Diary
```

- One User has many Diaries
- One User has many Emotions
- One Diary may have one Emotion (optional)
- Each Emotion belongs to one User
- Each Emotion may reference one Diary (optional)

---

## Environment Variables

Required in `.env`:

```
MONGODB_URI=mongodb://localhost:27017/apricity
```

---

## Best Practices

1. **Always populate references** when querying related data:

   ```javascript
   await Diary.findById(id).populate("user");
   await Emotion.findById(id).populate("user diary");
   ```

2. **Use static methods** for common queries:

   ```javascript
   const diaries = await Diary.findByUser(userId);
   const stats = await Emotion.getEmotionStats(userId);
   ```

3. **Handle validation errors**:

   ```javascript
   try {
     await diary.save();
   } catch (error) {
     if (error.name === "ValidationError") {
       // Handle validation errors
     }
   }
   ```

4. **Use transactions** for multi-document operations:
   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     await Diary.create([diaryData], { session });
     await Emotion.create([emotionData], { session });
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
     throw error;
   } finally {
     session.endSession();
   }
   ```
