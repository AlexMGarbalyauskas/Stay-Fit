# Stay-Fit Project - Complete Technical Documentation

**Project Name:** Stay-Fit  
**Type:** Full-Stack Web Application (React + Node.js + SQLite)  
**Purpose:** A social fitness tracking platform with real-time messaging, workout scheduling, and community features.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Dependencies & Libraries](#dependencies--libraries)
5. [Backend Documentation](#backend-documentation)
6. [Frontend Documentation](#frontend-documentation)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Key Features Explained](#key-features-explained)

---

## Project Overview

**Stay-Fit** is a social fitness platform that allows users to:
- Create and share workout posts with media (images/videos)
- Connect with friends and send encrypted messages
- Schedule workouts and set reminders
- Track posting streaks on a calendar timeline
- Receive real-time notifications
- Manage privacy settings
- Support multiple languages and timezones

**Architecture:**
- **Frontend:** React 19 SPA with React Router v7
- **Backend:** Node.js/Express server with Socket.IO for real-time features
- **Database:** SQLite3 with migration-based schema versioning
- **Authentication:** JWT (JSON Web Tokens) with Google OAuth support
- **Real-time Communication:** Socket.IO bidirectional websockets
- **Encryption:** AES-GCM client-side encryption for messages

---

## Technology Stack

### Backend Stack
| Layer | Technologies |
|-------|--------------|
| **Server** | Express.js 5.2, Node.js |
| **Real-time** | Socket.IO 4.8 |
| **Database** | SQLite3 5.1 |
| **Authentication** | JWT (jsonwebtoken 9.0), Passport.js 0.7, Google OAuth |
| **Security** | bcrypt/bcryptjs, helmet, CORS |
| **File Upload** | multer 2.0 |
| **Email** | Nodemailer, Resend, SendGrid |
| **Environment** | dotenv 17.2 |
| **Testing** | Jest, Supertest |

### Frontend Stack
| Layer | Technologies |
|-------|--------------|
| **Framework** | React 19, React Router DOM 7.10 |
| **HTTP Client** | Axios 1.13 |
| **Real-time** | Socket.IO Client 4.8 |
| **UI/Styling** | Tailwind CSS 3.4, lucide-react icons |
| **State Management** | React Context API |
| **Date Handling** | dayjs 1.11 |
| **Components** | emoji-picker-react, QR Code (qrcode.react) |
| **OAuth** | @react-oauth/google 0.12 |
| **Utilities** | Web Crypto API (built-in) |
| **Testing** | React Testing Library, Jest |

---

## Project Structure

```
stay-fit/
├── backend/
│   ├── server.js                 # Main entry point, Express & Socket.IO setup
│   ├── db.js                     # SQLite database connection
│   ├── run-migration.js          # Database migration runner
│   ├── package.json              # Backend dependencies
│   ├── config/                   # Configuration modules
│   │   ├── cors.js               # CORS middleware setup
│   │   ├── googleAuth.js         # Google OAuth strategy config
│   │   ├── jwt.js                # JWT utilities
│   │   └── passport.js           # Passport authentication config
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js               # JWT authentication middleware
│   │   └── logger.js             # Request logging middleware
│   ├── routes/                   # API endpoint definitions
│   │   ├── authRoutes.js         # Auth endpoints (register, login, logout)
│   │   ├── googleAuth.js         # Google OAuth endpoints
│   │   ├── meRoutes.js           # User profile management
│   │   ├── userRoutes.js         # Public user data endpoints
│   │   ├── friendsRoutes.js      # Friend/friend request endpoints
│   │   ├── messagesRoutes.js     # Messaging endpoints
│   │   ├── notificationsRoutes.js# Notification endpoints
│   │   ├── postsRoutes.js        # Post CRUD endpoints
│   │   ├── workoutSchedulesRoutes.js # Workout schedule endpoints
│   │   └── aiRoutes.js           # AI helper endpoints
│   ├── migrations/               # Database schema migrations (SQL)
│   │   ├── init.sql              # Initial schema
│   │   ├── comments.sql          # Comments table & constraints
│   │   ├── likes_and_saves.sql   # Likes/saves tables
│   │   ├── notifications.sql     # Notifications system
│   │   ├── messages.sql          # Messages table with encryption
│   │   ├── encrypted_messages.sql# Message encryption columns
│   │   ├── posts.sql             # Posts table with media support
│   │   ├── user_timezone.sql     # Timezone tracking
│   │   └── [others].sql          # Additional schema updates
│   ├── utils/                    # Helper utilities
│   │   ├── email.js              # Email sending with provider fallback
│   │   └── timezone.js           # Location → IANA timezone mapping
│   └── uploads/                  # File storage (local)
│       ├── media/                # Post media files
│       ├── profile_pics/         # User profile pictures
│       └── videos/               # Video uploads
│
├── frontend/
│   ├── src/
│   │   ├── index.js              # React DOM render entry
│   │   ├── App.js                # Main app component with routing
│   │   ├── App.css               # Global app styles
│   │   ├── index.css             # Global CSS
│   │   ├── api.js                # Axios HTTP client & helper functions
│   │   ├── reportWebVitals.js    # Performance monitoring
│   │   ├── components/           # Reusable React components
│   │   │   ├── Header.js         # Top navigation header
│   │   │   ├── Navbar.js         # Bottom navigation bar
│   │   │   ├── ProfileHeader.js  # User profile header
│   │   │   ├── CommentsModal.js  # Comments popup modal
│   │   │   ├── EmojiPickerModal.js # Emoji reaction picker
│   │   │   ├── ConfirmModal.js   # Delete/confirm dialog
│   │   │   └── DebugOverlay.js   # Development debug overlay
│   │   ├── pages/                # Full-page components (routes)
│   │   │   ├── Home.js           # Feed with posts
│   │   │   ├── Login.js          # User login page
│   │   │   ├── Register.js       # User registration page
│   │   │   ├── Profile.js        # User profile & settings
│   │   │   ├── Post.js           # Create/upload posts (camera/media)
│   │   │   ├── ChatPage.js       # Real-time messaging UI
│   │   │   ├── Friends.js        # Friend list & requests
│   │   │   ├── FindFriends.js    # Search/discover users
│   │   │   ├── Notifications.js  # Notifications panel
│   │   │   ├── Calendar.js       # Workout timeline & streaks
│   │   │   ├── SavedPosts.js     # Bookmarked posts
│   │   │   ├── UserProfile.js    # View other user profiles
│   │   │   ├── UserFriends.js    # View user's friends
│   │   │   ├── UserDetails.js    # User profile details
│   │   │   ├── Settings.js       # User settings hub
│   │   │   ├── Privacy.js        # Privacy configuration
│   │   │   ├── StatsSettings.js  # Statistics & tracking
│   │   │   ├── AboutSettings.js  # About & bio settings
│   │   │   ├── OtherSettings.js  # Misc settings
│   │   │   ├── AuthRequired.js   # Auth guard component
│   │   │   ├── VerifyEmail.js    # Email verification page
│   │   │   ├── VerifyEmailToken.js # Email token verification
│   │   │   ├── ShareApp.js       # Share app/referral page
│   │   │   ├── PublicShare.js    # Public post share links
│   │   │   ├── Tutorials.js      # In-app tutorials
│   │   │   ├── Terms.js          # Terms of service
│   │   │   ├── SocialLogin.js    # OAuth login options
│   │   │   ├── PostComments.js   # Nested comments view
│   │   │   └── AIHelper.js       # AI assistant page
│   │   ├── context/              # React Context state management
│   │   │   ├── LanguageContext.js# Multi-language support
│   │   │   └── WorkoutReminderContext.js # Reminder notifications
│   │   └── utils/                # Helper functions & utilities
│   │       ├── api.js            # HTTP client & endpoints (exported)
│   │       ├── socket.js         # Socket.IO client setup
│   │       ├── crypto.js         # AES-GCM encryption/decryption
│   │       ├── logger.js         # Client-side logging
│   │       ├── translations.js   # Multi-language strings
│   │       ├── workoutReminders.js # Reminder logic
│   │       ├── streak.js         # Streak calculation helpers
│   │       ├── crypto.test.js    # Encryption unit tests
│   │   ├── public/               # Static files
│   │   │   ├── index.html        # HTML entry point
│   │   │   ├── manifest.json     # PWA manifest
│   │   │   ├── robots.txt        # SEO robots file
│   │   │   ├── service-worker.js # Service worker (offline)
│   │   │   └── _redirects        # Netlify routing rules
│   │   └── build/                # Production build output
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── package.json              # Frontend dependencies
│   └── README.md                 # Frontend readme
│
├── generate_tech_report.py       # Python script for report generation
├── README.md                     # Project readme
├── PROJECT_TECHNICAL_NOTES.md    # Technical notes
└── CHAT_SECURITY.md              # Security documentation

```

---

## Dependencies & Libraries

### Backend Dependencies (package.json)

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",                    // Password hashing (industry standard)
    "bcryptjs": "^3.0.3",                  // Alternative bcrypt implementation
    "cookie-session": "^2.1.1",            // Session management via cookies
    "cors": "^2.8.5",                      // Cross-Origin Resource Sharing middleware
    "dotenv": "^17.2.3",                   // Environment variable loading
    "express": "^5.2.1",                   // Web server framework
    "express-session": "^1.18.2",          // Session storage for Express
    "get-video-duration": "^3.0.0",        // Extract video duration metadata
    "helmet": "^8.1.0",                    // HTTP headers security middleware
    "jsonwebtoken": "^9.0.3",              // JWT token generation & verification
    "multer": "^2.0.2",                    // File upload middleware
    "nodemailer": "^7.0.13",               // SMTP email sending (fallback provider)
    "passport": "^0.7.0",                  // Authentication middleware
    "passport-google-oauth20": "^2.0.0",   // Google OAuth 2.0 strategy
    "resend": "^4.0.0",                    // Email API (primary provider)
    "@sendgrid/mail": "^8.0.0",            // SendGrid email API (secondary provider)
    "socket.io": "^4.8.1",                 // Real-time bidirectional communication
    "sqlite3": "^5.1.7"                    // SQLite database driver
  },
  "devDependencies": {
    "jest": "^29.7.0",                     // Testing framework
    "supertest": "^7.1.1"                  // HTTP assertion library for tests
  }
}
```

### Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "@react-oauth/google": "^0.12.2",     // Google OAuth button component
    "@testing-library/dom": "^10.4.1",    // DOM testing utilities
    "@testing-library/jest-dom": "^6.9.1",// Jest matchers for DOM
    "@testing-library/react": "^16.3.0",  // React component testing
    "@testing-library/user-event": "^13.5.0", // User interaction simulation
    "axios": "^1.13.2",                    // HTTP client with interceptors
    "dayjs": "^1.11.19",                   // Date/time manipulation (lightweight)
    "emoji-picker-react": "^4.16.1",       // Emoji reaction selector
    "lucide-react": "^0.561.0",            // SVG icon library
    "qrcode.react": "^4.2.0",              // QR code generator
    "react": "^19.2.1",                    // React framework
    "react-dom": "^19.2.1",                // React DOM rendering
    "react-icons": "^5.5.0",               // Alternative icon library
    "react-router-dom": "^7.10.1",         // Client-side routing
    "react-scripts": "5.0.1",              // Create React App build tools
    "socket.io-client": "^4.8.1",          // Client for real-time messaging
    "web-vitals": "^2.1.4"                 // Performance metrics reporting
  },
  "devDependencies": {
    "tailwindcss": "^3.4.18"               // Utility-first CSS framework
  }
}
```

---

## Backend Documentation

### 1. Server Setup (server.js)

**Purpose:** Main Express server setup, middleware configuration, routes, and Socket.IO initialization.

**Key Functions:**
- Express middleware setup (CORS, JSON parsing, static files)
- API route registration
- Socket.IO connection with JWT authentication
- Real-time message and notification handling
- Graceful shutdown logic

**Middleware Chain:**
```javascript
app.use(cors());                                    // CORS headers
app.use(express.json());                           // Parse JSON body
app.use(express.urlencoded({ extended: true }));   // Parse URL-encoded body
app.use('/uploads', express.static(...));          // Serve static files
```

**Routes Registered:**
```
GET  /                              Health check
POST /api/auth/register             User registration
POST /api/auth/login                User login
POST /api/auth/logout               User logout
GET  /api/auth/verify               JWT verification
POST /api/auth/google/callback      Google OAuth callback
GET  /api/me                        Get current user profile
PUT  /api/me                        Update user profile
POST /api/me/profile-picture        Upload profile picture
PUT  /api/me/password               Change password
DELETE /api/me/delete               Delete account
[More routes in each route file...]
```

**Socket.IO Authentication:**
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.user = decoded;  // Attach user to socket
  next();
});
```

**Socket.IO Events:**
- `send_message` - Receive and broadcast messages
- `message:deleted` - Notify deletion of message
- `message:reaction` - Emoji reactions on messages
- `typing` - Typing indicator
- `notification:created` - Push real-time notifications
- `disconnect` - User disconnects

---

### 2. Database Module (db.js)

**Purpose:** SQLite3 database connection and query wrapper.

**Main Functions:**
- `db.get(sql, params, callback)` - Fetch single row
- `db.all(sql, params, callback)` - Fetch multiple rows
- `db.run(sql, params, callback)` - Execute INSERT/UPDATE/DELETE
- `db.exec(sql, callback)` - Execute raw SQL

**Usage Example:**
```javascript
const db = require('./db');
db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
  if (err) console.error(err);
  else console.log(row);
});
```

---

### 3. Configuration Modules

#### 3.1 CORS Configuration (config/cors.js)
**Purpose:** Define allowed origins for cross-origin requests.

**Allowed Origins:**
- `http://localhost:3000` (development)
- `http://192.168.0.16:3000` (local network)
- `https://stay-fit-1.onrender.com` (production)
- `https://stay-fit-2.onrender.com` (production)

**Credentials:** Enabled (allows cookies/auth headers)

#### 3.2 Google OAuth Configuration (config/googleAuth.js)
**Purpose:** Passport.js Google OAuth strategy setup.

**Strategy Variables:**
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_CALLBACK_URL` - Redirect URI after OAuth

#### 3.3 JWT Configuration (config/jwt.js)
**Purpose:** JWT token signing and verification utilities.

**Functions:**
- `signToken(userId)` - Generate JWT token
- `verifyToken(token)` - Verify & decode token
- `JWT_SECRET` - Secret key from environment

#### 3.4 Passport Configuration (config/passport.js)
**Purpose:** Passport.js strategy definitions for authentication.

**Strategies:**
- Local strategy (username/password)
- Google OAuth strategy
- JWT strategy

---

### 4. Middleware

#### 4.1 Authentication Middleware (middleware/auth.js)

**Purpose:** Protect routes that require authentication.

**Function Signature:**
```javascript
const auth = (req, res, next) => {
  // Extract JWT from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Usage:**
```javascript
router.get('/protected', auth, (req, res) => {
  // req.user.id is now available
  res.json({ userId: req.user.id });
});
```

#### 4.2 Logger Middleware (middleware/logger.js)

**Purpose:** Log HTTP requests (method, path, timestamp).

**Implementation:** Logs request start and response completion.

---

### 5. Utility Functions

#### 5.1 Email Utility (utils/email.js)

**Purpose:** Send emails with multi-provider fallback strategy.

**Main Function:**
```javascript
async function sendEmail(email, subject, html, text) {
  // Tries providers in order:
  // 1. Resend API
  // 2. SendGrid API
  // 3. Nodemailer SMTP (fallback)
  // Returns: { success, provider, error }
}
```

**Supported Email Types:**
- Welcome email (on registration)
- Email verification link
- Password reset link
- Notification emails
- Workout reminders

**Provider Queue System:**
- Retries failed providers
- Logs provider usage statistics
- Graceful fallback on API failures

#### 5.2 Timezone Utility (utils/timezone.js)

**Purpose:** Map user location to IANA timezone string.

**Main Functions:**
```javascript
function getTimezoneFromLocation(location) {
  // Input: 'Dublin', 'London', 'New York', etc.
  // Output: 'Europe/Dublin', 'Europe/London', 'America/New_York'
  // Fallback: 'UTC' if not found
}

function getTimezoneDisplay(timezone) {
  // Converts 'Europe/Dublin' → 'GMT+0:00 (Europe/Dublin)'
}
```

**Location Mappings:** 
- 150+ cities/countries to timezones
- Supports partial matching
- Case-insensitive lookup

---

### 6. API Routes

All route files follow this pattern:
```javascript
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/route/endpoint
router.get('/:id', auth, (req, res) => {
  // Implementation
});

module.exports = router;
```

#### 6.1 Authentication Routes (routes/authRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user (email, username, password) |
| POST | `/login` | No | Login and receive JWT token |
| POST | `/logout` | Yes | Logout and invalidate token |
| GET | `/verify` | Yes | Verify JWT token validity |
| POST | `/email-verification` | No | Request email verification link |
| POST | `/verify-email-token` | No | Verify email with token |
| POST | `/refresh-token` | Yes | Refresh expired JWT |

#### 6.2 Google OAuth Routes (routes/googleAuth.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth` | Redirect to Google login |
| GET | `/callback` | OAuth callback (redirected by Google) |
| GET | `/success` | Verification after OAuth success |

#### 6.3 User Profile Routes (routes/meRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get current user profile |
| PUT | `/` | Yes | Update profile (bio, location, nickname, privacy, timezone) |
| POST | `/profile-picture` | Yes | Upload profile picture (multipart/form-data) |
| POST | `/update` | Yes | Legacy update endpoint |
| PUT | `/password` | Yes | Change password |
| DELETE | `/delete` | Yes | Delete account (with password verification) |

#### 6.4 User Routes (routes/userRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:userId` | No | Get public user profile |
| GET | `/:userId/posts` | No | Get user's posts |
| GET | `/:userId/posts/:postId` | No | Get specific post |
| GET | `/search/:username` | Yes | Search users by username |

#### 6.5 Friend Routes (routes/friendsRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get list of friends |
| GET | `/requests` | Yes | Get friend requests |
| POST | `/request/:userId` | Yes | Send friend request |
| POST | `/accept/:userId` | Yes | Accept friend request |
| POST | `/reject/:userId` | Yes | Reject friend request |
| POST | `/remove/:userId` | Yes | Remove friend |

#### 6.6 Message Routes (routes/messagesRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/with/:userId` | Yes | Get message history with user |
| POST | `/send` | Yes | Send message (text, image, GIF) |
| DELETE | `/:messageId` | Yes | Delete message (soft-delete) |
| PUT | `/:messageId/reaction` | Yes | Add/update emoji reaction |
| GET | `/:messageId/reactions` | Yes | Get all reactions on message |

**Message Object Structure:**
```javascript
{
  id: 1,
  sender_id: 5,
  receiver_id: 10,
  content: "Hello!",           // For text messages
  message_type: "text",        // text, image, gif, video
  media_url: null,             // S3/CDN URL if media
  encrypted: true,             // Is message encrypted?
  encrypted_content: "...",    // AES-GCM ciphertext
  iv: "...",                   // Initialization vector
  is_deleted: 0,               // Soft-delete flag
  created_at: "2026-05-11T10:30:00Z",
  updated_at: "2026-05-11T10:30:00Z"
}
```

#### 6.7 Post Routes (routes/postsRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get feed posts (pagination) |
| GET | `/mine` | Yes | Get user's own posts |
| GET | `/mine/export` | Yes | Export posts for calendar (date-based) |
| GET | `/:postId` | Yes | Get specific post |
| POST | `/` | Yes | Create new post (multipart/form-data) |
| PUT | `/:postId` | Yes | Edit post |
| DELETE | `/:postId` | Yes | Delete post |
| POST | `/:postId/like` | Yes | Like post |
| DELETE | `/:postId/like` | Yes | Unlike post |
| POST | `/:postId/save` | Yes | Save/bookmark post |
| DELETE | `/:postId/save` | Yes | Unsave post |
| POST | `/:postId/comments` | Yes | Add comment |
| DELETE | `/:postId/comments/:commentId` | Yes | Delete comment |
| POST | `/:postId/comments/:commentId/like` | Yes | Like comment |
| POST | `/:postId/comments/:commentId/reactions` | Yes | React to comment |

**Post Object Structure:**
```javascript
{
  id: 1,
  user_id: 5,
  caption: "Great workout today!",
  media_url: "/uploads/media/post_5_1620000000.mp4",
  media_type: "video",          // image, video, or null
  likes_count: 42,
  comments_count: 8,
  saves_count: 15,
  created_at: "2026-05-11T10:00:00Z",
  updated_at: "2026-05-11T10:00:00Z",
  user: {
    id: 5,
    username: "johndoe",
    profile_picture: "/uploads/profile_pics/user_5_1620000000.jpg"
  }
}
```

#### 6.8 Notification Routes (routes/notificationsRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get all notifications (paginated) |
| GET | `/unread-count` | Yes | Get unread notification count |
| PUT | `/:notificationId/read` | Yes | Mark notification as read |
| PUT | `/mark-all-read` | Yes | Mark all notifications as read |
| DELETE | `/:notificationId` | Yes | Delete notification |

**Notification Types:**
- `like` - Someone liked your post
- `comment` - Someone commented on your post
- `friend_request` - Friend request received
- `friend_accepted` - Friend request accepted
- `message` - New direct message
- `workout_reminder` - Scheduled workout reminder

**Notification Object:**
```javascript
{
  id: 1,
  user_id: 10,
  type: "like",
  related_user_id: 5,           // Who triggered it
  related_post_id: 42,
  message: "johndoe liked your post",
  is_read: false,
  created_at: "2026-05-11T10:30:00Z"
}
```

#### 6.9 Workout Schedule Routes (routes/workoutSchedulesRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's workout schedules |
| POST | `/` | Yes | Create workout schedule |
| PUT | `/:scheduleId` | Yes | Update schedule |
| DELETE | `/:scheduleId` | Yes | Delete schedule |
| POST | `/invite/:friendId` | Yes | Send workout invite to friend |
| GET | `/invites/received` | Yes | Get received invites |

**Schedule Object:**
```javascript
{
  id: 1,
  user_id: 5,
  title: "Morning Run",
  day_of_week: "Monday",        // 0-6 (Sunday-Saturday)
  time: "07:00",                // HH:MM format
  timezone: "Europe/Dublin",
  reminder_enabled: true,
  reminder_minutes_before: 15,
  participants: [{ id: 10, username: "janedoe" }]
}
```

#### 6.10 AI Helper Routes (routes/aiRoutes.js)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | Yes | Send message to AI assistant |
| GET | `/suggestions` | Yes | Get AI workout suggestions |

---

### 7. Database Schema

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  profile_picture TEXT,
  nickname TEXT,
  privacy TEXT DEFAULT 'friends',    -- 'public', 'friends', 'private'
  timezone TEXT DEFAULT 'UTC',
  notifications_enabled BOOLEAN DEFAULT 1,
  google_id TEXT UNIQUE,             -- For OAuth
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**posts**
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  caption TEXT,
  media_url TEXT,
  media_type TEXT,                  -- 'image', 'video', or NULL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**messages**
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text',  -- 'text', 'image', 'gif', 'video'
  media_url TEXT,
  encrypted BOOLEAN DEFAULT 0,
  encrypted_content TEXT,
  iv TEXT,                           -- Initialization vector for AES
  is_deleted INTEGER DEFAULT 0,      -- Soft-delete flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

**comments**
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER,         -- For nested replies
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);
```

**likes**
```sql
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

**saves**
```sql
CREATE TABLE saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

**friends**
```sql
CREATE TABLE friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (friend_id) REFERENCES users(id)
);
```

**friend_requests**
```sql
CREATE TABLE friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',     -- 'pending', 'accepted', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

**notifications**
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,                -- 'like', 'comment', 'friend_request', etc.
  related_user_id INTEGER,
  related_post_id INTEGER,
  message TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_user_id) REFERENCES users(id),
  FOREIGN KEY (related_post_id) REFERENCES posts(id)
);
```

**workout_schedules**
```sql
CREATE TABLE workout_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  day_of_week INTEGER,               -- 0-6 (Sunday-Saturday)
  time TEXT,                         -- HH:MM format
  timezone TEXT,
  reminder_enabled BOOLEAN DEFAULT 1,
  reminder_minutes_before INTEGER DEFAULT 15,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**message_reactions**
```sql
CREATE TABLE message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id),
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**comment_likes**
```sql
CREATE TABLE comment_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Frontend Documentation

### 1. HTTP Client (api.js)

**Purpose:** Centralized Axios instance with JWT interceptor and exported helper functions.

**Axios Setup:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: API_URL });

// Request interceptor: Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Exported Helper Functions:**

```javascript
// Authentication
export async function register(username, email, password)
export async function login(email, password)
export async function verifyEmail(token)
export async function googleLogin(token)

// User Profile
export async function getMe()
export async function updateProfile(updates)  // { bio, location, nickname }
export async function uploadProfilePicture(file)
export async function changePassword(currentPassword, newPassword)
export async function deleteAccount(password)

// Posts
export async function createPost(formData)     // FormData with file & caption
export async function getMyPosts()
export async function getPosts(page)
export async function getPost(postId)
export async function updatePost(postId, caption)
export async function deletePost(postId)
export async function toggleLike(postId)
export async function toggleSave(postId)

// Comments
export async function addComment(postId, content)
export async function deleteComment(postId, commentId)
export async function likeComment(postId, commentId)

// Messages
export async function getMessages(userId)
export async function sendMessage(receiverId, content, type, mediaUrl)

// Friends
export async function getFriends()
export async function getFreindRequests()       // [note: typo in original]
export async function sendFriendRequest(userId)
export async function acceptFriendRequest(userId)
export async function rejectFriendRequest(userId)
export async function removeFriend(userId)

// Notifications
export async function getNotifications()
export async function markNotificationAsRead(notificationId)
export async function markAllNotificationsAsRead()

// Workout Schedules
export async function createWorkoutSchedule(title, day, time, timezone)
export async function getWorkoutSchedules()
export async function updateWorkoutSchedule(scheduleId, updates)
export async function deleteWorkoutSchedule(scheduleId)

// Search
export async function searchUsers(query)
```

**Usage Example:**
```javascript
import { createPost, getPosts } from '../api';

const posts = await getPosts(1);  // Fetch page 1
await createPost(formData);       // Create new post
```

---

### 2. Socket.IO Client (utils/socket.js)

**Purpose:** Real-time WebSocket connection setup for messaging and notifications.

**Configuration:**
```javascript
const socket = io(BACKEND_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

**Exported Events:**

**Emit (send to server):**
```javascript
socket.emit('send_message', {
  receiverId: 10,
  content: 'Hello!',
  messageType: 'text',
  encrypted: true,
  encrypted_content: '...',
  iv: '...'
});

socket.emit('message:reaction', { messageId: 5, emoji: '👍' });
socket.emit('typing', { receiverId: 10 });
```

**Listen (receive from server):**
```javascript
socket.on('receive_message', (message) => { /* ... */ });
socket.on('message:deleted', (messageId) => { /* ... */ });
socket.on('notification:created', (notification) => { /* ... */ });
socket.on('user:typing', (userId) => { /* ... */ });
socket.on('connect_error', (error) => { /* handle error */ });
```

---

### 3. Encryption Utilities (utils/crypto.js)

**Purpose:** Client-side AES-GCM encryption for messages.

**Functions:**

```javascript
// Generate encryption key from password
export async function deriveKey(password)
  // Returns: CryptoKey for AES-GCM

// Encrypt plaintext message
export async function encryptMessage(message, key)
  // Returns: { ciphertext, iv }
  // ciphertext: Base64-encoded encrypted data
  // iv: Base64-encoded initialization vector

// Decrypt ciphertext message
export async function decryptMessage(ciphertext, iv, key)
  // Returns: Decrypted plaintext message

// Encryption settings
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256  // bits
const TAG_LENGTH = 128  // bits
```

**Usage:**
```javascript
import { deriveKey, encryptMessage, decryptMessage } from '../utils/crypto';

const key = await deriveKey(sharedPassword);
const { ciphertext, iv } = await encryptMessage('Secret', key);
const decrypted = await decryptMessage(ciphertext, iv, key);
```

---

### 4. React Context API

#### 4.1 Language Context (context/LanguageContext.js)

**Purpose:** Multi-language support across the app.

**Provider Setup:**
```javascript
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook for usage
export function useLanguage() {
  return useContext(LanguageContext);
}
```

**Supported Languages:**
- English ('en')
- Spanish ('es')
- French ('fr')
- [Add more in translations.js]

**Usage:**
```javascript
const { t } = useLanguage();
<h1>{t('welcome')}</h1>  // Translates 'welcome' key
```

#### 4.2 Workout Reminder Context (context/WorkoutReminderContext.js)

**Purpose:** Global workout reminder notifications.

**Functions:**
- Schedule reminder for workout time
- Cancel pending reminders
- Show notification when time arrives

---

### 5. Utility Functions

#### 5.1 Streak Calculation (utils/streak.js)

**Functions:**

```javascript
function toDateKey(date)
  // Input: Date object
  // Output: 'YYYY-MM-DD' string

function buildPostDateSet(posts)
  // Input: Array of post objects
  // Output: Set of 'YYYY-MM-DD' keys (when posts were created)

function calculateCurrentStreak(dateKeys, anchorDate = today)
  // Input: Set of date keys, optional anchor date
  // Output: { current: 5, longest: 12, streak_started: '2026-05-01' }
  // Logic: Walk backward from today, count consecutive posting days

function countPostingDaysInWindow(dateKeys, startDate, endDate)
  // Input: Set of dates, start date, end date
  // Output: Number of posting days in that window
```

**Usage:**
```javascript
import { buildPostDateSet, calculateCurrentStreak } from '../utils/streak';

const dateSet = buildPostDateSet(userPosts);
const streak = calculateCurrentStreak(dateSet);
console.log(`Current streak: ${streak.current} days`);
```

---

### 6. Pages/Components Overview

#### 6.1 Authentication Pages

**Login.js**
- Email + Password login
- Google OAuth button
- Link to register
- Error handling

**Register.js**
- Username, Email, Password, Confirm Password
- Form validation
- Email verification request after signup
- Terms & conditions agreement

**VerifyEmail.js**
- Display message to check email
- Resend verification link button

**VerifyEmailToken.js**
- Accept verification token from email link
- Mark email as verified
- Redirect to login/home

**SocialLogin.js**
- Display OAuth provider options (Google, etc.)
- Handle OAuth callbacks

#### 6.2 Home & Feed Pages

**Home.js**
- Display feed of posts from friends
- Infinite scroll / pagination
- Like/save/comment buttons
- Post actions menu (edit, delete)

**Post.js** (Create)
- Media selection (upload image/video OR camera)
- MediaRecorder for recording
- Canvas capture for photo
- Fireworks celebration animation on successful post
- Caption input

**PostComments.js**
- View all comments on a post
- Nested comments/replies
- Comment deletion
- Like comments

#### 6.3 Chat & Messaging

**ChatPage.js**
- List of recent conversations
- Real-time message view
- Message deduplication (prevent duplicates)
- Soft-delete message display
- Encryption/decryption of messages
- Typing indicator
- Emoji reactions on messages

#### 6.4 User Profile Pages

**Profile.js**
- Display user's own profile
- Edit bio, location, nickname
- Upload profile picture
- Show user's posts
- Show saved posts tab
- Privacy settings access

**UserProfile.js**
- Display another user's profile (public view)
- View their posts
- Add/remove friend
- Send message button

**UserFriends.js**
- View a user's friend list

**UserDetails.js**
- Detailed user information card

#### 6.5 Social Pages

**Friends.js**
- List of friends
- Remove friend option
- Friend search

**FindFriends.js**
- Search/discover users
- Send friend requests
- View pending requests

**FriendRequests.js**
- Incoming friend requests
- Accept/reject buttons

#### 6.6 Calendar & Timeline

**Calendar.js**
- Month calendar grid
- Highlight days with posts (streak)
- Show current streak counter
- Invite friends to workouts
- Manage workout plans in localStorage

#### 6.7 Notifications & Settings

**Notifications.js**
- Display all notifications
- Mark as read
- Delete notifications
- Filter by type

**Settings.js** (Hub)
- Navigate to other settings pages

**Profile/Settings Sub-pages:**
- **Privacy.js** - Privacy level (public/friends/private)
- **StatsSettings.js** - Statistics & tracking preferences
- **AboutSettings.js** - Bio and personal info
- **OtherSettings.js** - Misc settings

#### 6.8 Other Pages

**SavedPosts.js**
- Display user's bookmarked posts

**ShareApp.js**
- Generate QR code for app referral
- Share app link

**PublicShare.js**
- Public post share links
- View post without login (limited)

**Tutorials.js**
- In-app user guides

**Terms.js**
- Terms of service document

**AIHelper.js**
- Chat with AI assistant
- Get workout suggestions

#### 6.9 Auth Guard

**AuthRequired.js**
- Route guard component
- Redirects unauthenticated users to login

---

### 7. Reusable Components

**Header.js**
- Top navigation bar
- Search functionality
- Language switcher
- Notifications bell

**Navbar.js**
- Bottom navigation tabs
- Home, Friends, Chat, Calendar, Profile, Settings
- Active tab highlighting

**ProfileHeader.js**
- User avatar, username, stats
- Follow/message buttons

**CommentsModal.js**
- Modal for viewing/adding comments

**EmojiPickerModal.js**
- Emoji picker for reactions

**ConfirmModal.js**
- Delete/confirmation dialog

**DebugOverlay.js** (Dev only)
- Display debug info in development

---

### 8. Translations (utils/translations.js)

**Structure:**
```javascript
export const translations = {
  en: {
    welcome: 'Welcome to Stay-Fit',
    login: 'Login',
    register: 'Register',
    // ... hundreds more keys
  },
  es: {
    welcome: 'Bienvenido a Stay-Fit',
    login: 'Iniciar sesión',
    // ... Spanish translations
  },
  // ... other languages
};
```

**Usage:**
```javascript
function t(key) {
  return translations[language][key] || key;
}
```

---

### 9. Styling

**Tailwind CSS** (tailwind.config.js)
- Utility-first CSS framework
- Custom theme colors (if defined)
- Responsive design utilities

**CSS Files:**
- `App.css` - Global app styles
- `index.css` - Global resets
- Component-specific CSS (inline or imported)

---

## API Endpoints (Complete Reference)

### Authentication
```
POST   /api/auth/register                    Register new user
POST   /api/auth/login                       Login (returns JWT)
POST   /api/auth/logout                      Logout
GET    /api/auth/verify                      Verify token
POST   /api/auth/email-verification          Request verification link
POST   /api/auth/verify-email-token          Verify with token
POST   /api/auth/google/callback             Google OAuth callback
GET    /api/auth/google/auth                 Google OAuth initiate
GET    /api/auth/google/success              OAuth success verification
```

### User Profile
```
GET    /api/me                               Get current user
PUT    /api/me                               Update profile fields
POST   /api/me/profile-picture               Upload profile picture
PUT    /api/me/password                      Change password
DELETE /api/me/delete                        Delete account
GET    /api/users/:userId                    Get user profile
GET    /api/users/:userId/posts              Get user posts
GET    /api/users/search/:query              Search users
```

### Friends
```
GET    /api/friends/                         Get friends list
GET    /api/friends/requests                 Get friend requests
POST   /api/friends/request/:userId          Send request
POST   /api/friends/accept/:userId           Accept request
POST   /api/friends/reject/:userId           Reject request
POST   /api/friends/remove/:userId           Remove friend
```

### Messages
```
GET    /api/messages/with/:userId            Get message history
POST   /api/messages/send                    Send message
DELETE /api/messages/:messageId              Delete message (soft)
PUT    /api/messages/:messageId/reaction     React to message
GET    /api/messages/:messageId/reactions    Get reactions
```

### Posts
```
GET    /api/posts/                           Get feed posts
GET    /api/posts/mine                       Get user's posts
GET    /api/posts/mine/export                Export for calendar
GET    /api/posts/:postId                    Get post details
POST   /api/posts/                           Create post
PUT    /api/posts/:postId                    Edit post
DELETE /api/posts/:postId                    Delete post
POST   /api/posts/:postId/like               Like post
DELETE /api/posts/:postId/like               Unlike post
POST   /api/posts/:postId/save               Save post
DELETE /api/posts/:postId/save               Unsave post
```

### Comments
```
POST   /api/posts/:postId/comments           Add comment
DELETE /api/posts/:postId/comments/:commentId Delete comment
POST   /api/posts/:postId/comments/:commentId/like Like comment
POST   /api/posts/:postId/comments/:commentId/reactions React to comment
```

### Notifications
```
GET    /api/notifications/                   Get all notifications
GET    /api/notifications/unread-count       Get unread count
PUT    /api/notifications/:id/read           Mark as read
PUT    /api/notifications/mark-all-read      Mark all read
DELETE /api/notifications/:id                Delete notification
```

### Workout Schedules
```
GET    /api/workout-schedules/               Get user schedules
POST   /api/workout-schedules/               Create schedule
PUT    /api/workout-schedules/:id            Update schedule
DELETE /api/workout-schedules/:id            Delete schedule
POST   /api/workout-schedules/invite/:userId Send invite
GET    /api/workout-schedules/invites/received Get invites
```

### AI Assistant
```
POST   /api/ai/chat                          Chat with AI
GET    /api/ai/suggestions                   Get suggestions
```

---

## Key Features Explained

### 1. Real-Time Messaging

**Flow:**
1. Frontend encrypts message using AES-GCM
2. Axios sends encrypted message to backend
3. Backend saves to database
4. Socket.IO emits `receive_message` to receiver (real-time)
5. Frontend receives socket event and decrypts message
6. Frontend deduplicates (checks if message ID already exists)
7. Message displayed in chat UI
8. When user deletes: backend sets `is_deleted=1` and emits `message:deleted`
9. Frontend preserves deletion flag across navigation

**Encryption:**
- Algorithm: AES-GCM (256-bit key)
- Derives key from shared password
- Includes IV (Initialization Vector) for each message
- Base64-encoded for JSON transmission

### 2. Post Creation with Media

**Flow:**
1. User selects media (upload file OR camera capture)
2. If camera: MediaRecorder captures video stream
3. If photo: canvas captures frame from video stream
4. User adds caption
5. FormData is created (multipart/form-data)
6. Axios POSTs to `/api/posts/`
7. Backend uses multer to save file to disk
8. Backend saves post record to DB
9. Response returns post object with `media_url`
10. Frontend displays post in feed
11. Canvas animation (fireworks) plays on success

**Animation:**
- Uses `requestAnimationFrame` for smooth 60fps animation
- Particles with gravity and fade-out
- Canvas drawn over post card
- Cleanup on unmount to prevent memory leaks

### 3. Calendar Timeline & Streaks

**Flow:**
1. Fetch user's posts from `/api/posts/mine/export`
2. Build a Set of dates (YYYY-MM-DD format) when posts were created
3. Calculate current streak by walking backward from today
4. Count consecutive days with posts
5. Display calendar with highlighted dates
6. Show streak counter: "5 days 🔥"

**Streak Logic:**
```
Today: 2026-05-11 (has post) → streak continues
Yesterday: 2026-05-10 (no post) → streak breaks
```
If today has no post, check if any posting will reset the streak.

### 4. Timezone Auto-Mapping

**Flow:**
1. User updates location in profile (e.g., "Dublin")
2. Frontend sends: `PUT /api/me { location: "Dublin" }`
3. Backend calls `getTimezoneFromLocation("Dublin")`
4. Looks up in timezoneMap → `"Europe/Dublin"`
5. Automatically saves to `users.timezone` column
6. Response returns updated user object
7. Frontend updates local state and localStorage

**Why?**
- Ensures workout reminders use correct local time
- No manual timezone selection needed

### 5. Multi-Language Support

**Implementation:**
- React Context stores current language
- All strings stored in `translations.js` object
- Components use `useLanguage()` hook
- `t(key)` translates based on selected language
- LocalStorage persists language choice

### 6. JWT Authentication

**Flow:**
1. User registers/logs in
2. Backend verifies credentials
3. Signs JWT: `jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' })`
4. Returns token to frontend
5. Frontend stores in `localStorage.getItem('token')`
6. Axios interceptor adds to every request header: `Authorization: Bearer <token>`
7. Backend middleware verifies token before processing route
8. Socket.IO authentication: token passed in handshake auth

**JWT Structure:**
- Header: Algorithm (HS256)
- Payload: User ID, email, iat (issued at), exp (expiration)
- Signature: HMAC-SHA256(header + payload, secret)

### 7. Google OAuth Integration

**Flow:**
1. Frontend displays Google login button
2. User clicks → Google login popup
3. User grants permission
4. Google returns OAuth code to backend callback
5. Backend exchanges code for ID token (verifies with Google)
6. Backend checks if user exists in DB
7. If new: creates user record
8. Returns JWT token
9. Frontend stores token and logs in

### 8. Email Sending with Fallback

**Provider Chain:**
1. Try Resend API (primary)
2. If fails → Try SendGrid API
3. If fails → Try Nodemailer SMTP
4. Logs which provider succeeded
5. Returns `{ success, provider, error }`

**Emails Sent:**
- Welcome email (registration)
- Email verification link
- Password reset link
- Workout reminders
- Notifications digests

### 9. Soft-Delete for Messages

**Why Soft-Delete?**
- Preserves audit trail
- Can recover deleted messages
- Faster deletion (no cascade deletes)
- Messages don't reappear after navigation

**Implementation:**
- Add `is_deleted INTEGER DEFAULT 0` column
- DELETE endpoint sets `is_deleted = 1`
- Select queries: `WHERE is_deleted = 0`
- Socket.IO emits `message:deleted` event
- Frontend preserves flag when fetching/decrypting

### 10. Deduplication in Real-Time

**Problem:** Socket.IO reconnects can send duplicate messages.

**Solution:**
```javascript
// Frontend ChatPage.js
function mergeMessages(existingMessages, newMessage) {
  const index = existingMessages.findIndex(m => m.id === newMessage.id);
  if (index >= 0) {
    // Message exists: merge, preserve is_deleted
    return [
      ...existingMessages.slice(0, index),
      { ...existingMessages[index], ...newMessage },
      ...existingMessages.slice(index + 1)
    ];
  }
  // New message
  return [...existingMessages, newMessage];
}
```

---

## Summary Table

| Component | Language | Purpose | Key Dependencies |
|-----------|----------|---------|------------------|
| server.js | Node.js | Express server & Socket.IO | Express, Socket.IO, SQLite |
| db.js | Node.js | Database connection | sqlite3 |
| routes/ | Node.js | API endpoints | Express, multer, bcrypt |
| utils/ | Node.js | Helpers | nodemailer, timezone mapping |
| App.js | React | Main app + routing | React Router |
| api.js | React | HTTP client | Axios |
| socket.js | React | Real-time client | Socket.IO Client |
| crypto.js | React | Encryption | Web Crypto API (built-in) |
| Pages/ | React | UI screens | React, Axios, Socket.IO |
| utils/ | React | Frontend helpers | dayjs, streak logic |

---

## Installation & Running

### Backend Setup
```bash
cd backend
npm install
npm start                   # Runs on http://localhost:4000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start                   # Runs on http://localhost:3000
```

### Environment Variables

**Backend (.env):**
```
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=yyy
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
RESEND_API_KEY=xxx
SENDGRID_API_KEY=yyy
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=app_password
NODE_ENV=development
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SOCKET_URL=http://localhost:4000
REACT_APP_GOOGLE_CLIENT_ID=xxx
```

---

## Testing

### Backend Tests
```bash
npm test                      # Run all tests
npm run test:integration      # Run integration tests
npm run test:class            # Run auth class tests
```

### Frontend Tests
```bash
npm test                      # Run with React Testing Library
```

---

## Deployment

- **Backend:** Render.com, Heroku, AWS
- **Frontend:** Netlify, Vercel, GitHub Pages
- **Database:** SQLite → Postgres (for scaling)
- **Media Storage:** Local disk → S3/CDN

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (3000)                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│ │  Pages/UI    │ │ Socket.IO    │ │ Axios HTTP Client    │  │
│ │ Components   │ │ (Real-time)  │ │ (JWT interceptor)    │  │
│ │              │ │              │ │                      │  │
│ │ - Home       │ │ - Messages   │ │ - API calls          │  │
│ │ - Profile    │ │ - Notifs     │ │ - Auth tokens        │  │
│ │ - Chat       │ │ - Typing     │ │ - Encryption         │  │
│ │ - Calendar   │ │              │ │                      │  │
│ └──────────────┘ └──────────────┘ └──────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
                         │
                    HTTP / WebSocket
                         │
┌────────────────────────┴──────────────────────────────────────┐
│             Express Server + Socket.IO (4000)                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │              Middleware Chain                          │   │
│ │ CORS → JSON Parser → Logger → Auth Middleware         │   │
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │              Route Handlers (routes/)                  │   │
│ │ /api/auth  /api/me  /api/posts  /api/messages etc     │   │
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │           Utilities & Middleware                       │   │
│ │ JWT Auth → Email Sender → Timezone Mapper → etc       │   │
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │              Socket.IO (Real-time)                     │   │
│ │ Connection → Message Events → Notifications → Typing  │   │
│ └────────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │
                      SQL Queries
                         │
          ┌──────────────┴──────────────┐
          │                             │
    ┌─────▼─────┐             ┌────────▼──────┐
    │   SQLite3 │             │ /uploads (CDN)│
    │  Database │             │ - Media       │
    │           │             │ - Profiles    │
    │ - users   │             │ - Videos      │
    │ - posts   │             └───────────────┘
    │ - messages│
    │ - etc     │
    └───────────┘
```

---

**End of Technical Documentation**

This markdown file is now ready to print or share with examiners. It covers:
✅ All dependencies and libraries
✅ All backend routes and functions
✅ All frontend pages and utilities
✅ Complete API reference
✅ Database schema
✅ Architecture and data flow
✅ Real-time features explanation
