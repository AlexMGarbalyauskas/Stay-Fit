# Stay-Fit Project - Technical Documentation

## Project Overview
**Stay-Fit** is a full-stack social fitness web application that combines workout tracking, social networking, and real-time communication features. Built with modern web technologies, it enables users to share fitness journeys, connect with friends, schedule workouts, and communicate securely.

---

## 🏗️ Architecture

### Type: Full-Stack Web Application
- **Frontend**: React Single Page Application (SPA)
- **Backend**: Node.js + Express RESTful API
- **Database**: SQLite (file-based relational database)
- **Real-time**: Socket.IO for WebSocket connections
- **Deployment**: Render.com (cloud hosting)

---

## 💾 Database Layer

### Technology: SQLite3
**Why SQLite?**
- Lightweight, serverless database
- Zero configuration required
- Perfect for development and small-to-medium applications
- File-based storage (data.sqlite)
- ACID compliant

### Database Management
- **Location**: `backend/data.sqlite` (configured via environment variable)
- **ORM**: Raw SQL queries using `sqlite3` npm package
- **Migration System**: SQL migration files in `backend/migrations/`
- **Schema Evolution**: Incremental migrations for version control

### Key Database Tables

#### Users Table
```sql
- id (PRIMARY KEY, AUTO INCREMENT)
- username (UNIQUE)
- email (UNIQUE)
- password_hash (bcrypt hashed)
- profile_picture
- bio, location, nickname
- created_at (timestamp)
```

#### Social Features Tables
- **friends**: Many-to-many user relationships
- **friend_requests**: Pending/accepted friend requests with status tracking
- **messages**: Direct messaging between users with encryption support
- **notifications**: User notification system

#### Content Tables
- **posts**: User workout posts with media support
- **comments**: Nested comment system with reply support
- **likes**: Post engagement tracking
- **saves**: Saved posts functionality

#### Fitness Features
- **workout_schedules**: User workout planning and calendar integration

### Data Storage Strategy
- **User Files**: `backend/uploads/` directory structure
  - `profile_pics/`: User profile images
  - `media/`: Post images
  - `videos/`: Post video content
- **Static Files**: Served via Express static middleware at `/uploads` endpoint

---

## 🔐 Authentication & Security

### Multi-Factor Authentication System

#### 1. Local Authentication (JWT)
**Technology Stack:**
- `bcrypt` / `bcryptjs`: Password hashing (salt rounds for security)
- `jsonwebtoken`: Token generation and verification
- `express-session`: Session management

**Flow:**
1. User registers → Password hashed with bcrypt
2. User logs in → Credentials verified
3. JWT token generated with user payload
4. Token stored in localStorage (client-side)
5. Token sent in Authorization header for protected routes

**JWT Payload:**
```javascript
{
  id: user.id,
  username: user.username,
  email: user.email
}
```

#### 2. OAuth 2.0 - Google Authentication
**Technology Stack:**
- `passport`: Authentication middleware
- `passport-google-oauth20`: Google OAuth strategy
- `@react-oauth/google`: React Google login component

**Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. Google returns authorization code
4. Backend exchanges code for user profile
5. User created/retrieved from database
6. JWT token issued (same as local auth)

**Configuration:**
- Client ID and Secret stored in environment variables
- Callback URL configured for Passport strategy
- Scopes: profile, email

#### 3. Protected Routes
**Middleware:** `backend/middleware/auth.js`
- Validates JWT token on each request
- Extracts user from token payload
- Attaches user object to request (`req.user`)
- Returns 401 Unauthorized if invalid

### Security Features

#### Password Security
- **Hashing Algorithm**: bcrypt with automatic salting
- **Password Requirements**: Enforced at application level
- **No Plain Text Storage**: Only hashes stored in database

#### Token Security
- **Secret Key**: Environment variable (`JWT_SECRET`)
- **Expiration**: Configurable token lifetime
- **Stateless**: No server-side session storage

#### Message Encryption (End-to-End)
**Technology**: Web Crypto API (AES-GCM)

**Implementation Details:**
```javascript
Algorithm: AES-GCM (Galois/Counter Mode)
Key Length: 256 bits
IV Length: 96 bits (12 bytes)
Key Derivation: PBKDF2 with 100,000 iterations
```

**Flow:**
1. Derive conversation key from user IDs (deterministic)
2. Generate random IV (Initialization Vector) per message
3. Encrypt plaintext using AES-GCM
4. Store encrypted content + IV in database
5. Recipient decrypts using same derived key + IV

**Storage:**
- `encrypted_content`: Base64 encoded ciphertext
- `iv`: Base64 encoded initialization vector
- `is_encrypted`: Boolean flag (1/0)

**Key Management:**
- Master seed stored in localStorage (`encryption_seed`)
- Per-conversation keys derived using PBKDF2
- Same key derivable by both participants independently

---

## 🚀 Backend Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Language**: JavaScript (ES6+)

### Core Dependencies
```json
{
  "express": "^5.2.1",          // Web framework
  "socket.io": "^4.8.1",        // WebSocket server
  "sqlite3": "^5.1.7",          // Database driver
  "jsonwebtoken": "^9.0.3",     // JWT auth
  "bcrypt": "^6.0.0",           // Password hashing
  "passport": "^0.7.0",         // OAuth middleware
  "multer": "^2.0.2",           // File uploads
  "helmet": "^8.1.0",           // Security headers
  "cors": "^2.8.5",             // Cross-origin requests
  "dotenv": "^17.2.3"           // Environment variables
}
```

### Project Structure

#### Configuration Layer (`backend/config/`)
- **cors.js**: CORS policy configuration for frontend origins
- **jwt.js**: JWT token generation/verification utilities
- **googleAuth.js**: Google OAuth credentials and settings
- **passport.js**: Passport strategies initialization

#### Middleware Layer (`backend/middleware/`)
- **auth.js**: JWT token verification for protected routes
- **logger.js**: Request/response logging

#### Routes Layer (`backend/routes/`)
API endpoint organization by feature:

| Route File | Endpoint | Purpose |
|------------|----------|---------|
| authRoutes.js | `/api/auth` | Login, Register, Logout |
| googleAuth.js | `/api/auth/google` | OAuth callbacks |
| meRoutes.js | `/api/me` | Current user profile |
| userRoutes.js | `/api/users` | User search, profiles |
| friendsRoutes.js | `/api/friends` | Friend management |
| messagesRoutes.js | `/api/messages` | Direct messaging |
| notificationsRoutes.js | `/api/notifications` | Notifications CRUD |
| postsRoutes.js | `/api/posts` | Posts, comments, likes |
| workoutSchedulesRoutes.js | `/api/workout-schedules` | Calendar events |

#### Utilities Layer (`backend/utils/`)
- **timezone.js**: User timezone handling for scheduling

### File Upload System
**Technology**: Multer (multipart/form-data parser)

**Configuration:**
- Storage: Disk storage in `uploads/` directory
- File naming: UUID-based to prevent collisions
- Subdirectories: Organized by content type
- Mime type validation: Images and videos only
- Size limits: Configured per route

**Supported Formats:**
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM, MOV

**Video Processing:**
- `get-video-duration`: Extract video metadata
- Duration validation before storage

---

## 🎨 Frontend Architecture

### Technology Stack
- **Framework**: React v19.2.1
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Styling**: Tailwind CSS v3
- **Build Tool**: Create React App (webpack)

### Core Dependencies
```json
{
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "react-router-dom": "^7.10.1",
  "axios": "^1.13.2",
  "socket.io-client": "^4.8.1",
  "tailwindcss": "^3.4.18",
  "@react-oauth/google": "^0.12.2",
  "emoji-picker-react": "^4.16.1",
  "dayjs": "^1.11.19",
  "lucide-react": "^0.561.0",
  "qrcode.react": "^4.2.0"
}
```

### UI Component Library
**Icon Systems:**
- `lucide-react`: Modern icon set
- `react-icons`: Comprehensive icon collection

**Feature Components:**
- `emoji-picker-react`: Emoji selection in messages
- `qrcode.react`: QR code generation for app sharing
- `dayjs`: Date/time formatting and manipulation

### Project Structure

#### Pages Layer (`frontend/src/pages/`)
Route-level components:

| Page | Route | Description |
|------|-------|-------------|
| Login.js | `/login` | Authentication entry |
| Register.js | `/register` | User signup |
| Home.js | `/` | Main feed (posts) |
| Profile.js | `/profile` | Current user profile |
| UserProfile.js | `/user/:id` | Other user profiles |
| ChatPage.js | `/chat/:id` | Messaging interface |
| Calendar.js | `/calendar` | Workout schedule |
| FindFriends.js | `/find-friends` | User discovery |
| FriendRequests.js | `/friend-requests` | Pending requests |
| Friends.js | `/friends` | Friends list |
| Notifications.js | `/notifications` | Activity feed |
| SavedPosts.js | `/saved` | Bookmarked content |
| Settings.js | `/settings` | Account settings |
| Post.js | `/post/:id` | Single post view |
| PostComments.js | `/post/:id/comments` | Comment thread |

#### Components Layer (`frontend/src/components/`)
Reusable UI components:
- **Header.js**: Top navigation bar
- **Navbar.js**: Bottom navigation (mobile)
- **ProfileHeader.js**: User profile header
- **CommentsModal.js**: Comment interface
- **EmojiPickerModal.js**: Emoji selector
- **ConfirmModal.js**: Confirmation dialogs
- **DebugOverlay.js**: Development debugging tool

#### Context API (`frontend/src/context/`)
Global state management:

**LanguageContext.js**
- Multi-language support (English, Spanish, etc.)
- Translation utilities
- Locale persistence

**WorkoutReminderContext.js**
- Workout notification system
- Browser notifications API
- Reminder scheduling

#### Utilities Layer (`frontend/src/utils/`)
- **crypto.js**: End-to-end encryption functions
- **translations.js**: Language translation mappings
- **workoutReminders.js**: Notification helpers
- **api.js**: Axios instance configuration

### State Management Strategy
**Approach**: React Context + Local State
- **Context**: Cross-component shared state (auth, language, reminders)
- **Local State**: Component-specific data (useState hooks)
- **Props**: Parent-child data flow
- **No Redux**: Kept simple with built-in React features

### Styling Approach
**Tailwind CSS**: Utility-first CSS framework

**Configuration**: `tailwind.config.js`
- Custom theme colors
- Dark mode support (`class` strategy)
- Responsive breakpoints
- Custom animations

**Dark Mode Implementation:**
- Theme toggled via `document.documentElement.classList`
- Preference stored in localStorage
- System-wide consistency

---

## 🔄 Real-Time Communication

### Technology: Socket.IO v4.8.1
**Protocol**: WebSocket with fallback to HTTP long-polling

### Architecture
**Server**: HTTP server upgraded to WebSocket server
```javascript
const server = http.createServer(app);
const io = new Server(server, { cors: {...} });
```

### Authentication
**Socket Authentication Middleware:**
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  socket.user = decoded; // Attach user to socket
  next();
});
```

### Connection Management
**User Rooms:**
- Each user joins room: `user:${userId}`
- Private channels for targeted messaging
- Automatic room cleanup on disconnect

### Real-Time Features

#### 1. Direct Messaging
**Events:**
- `send_message`: Client → Server (new message)
- `receive_message`: Server → Recipient (message delivery)

**Flow:**
1. Sender emits message with encryption
2. Server validates and stores in database
3. Server emits to recipient's room
4. Recipient receives and decrypts

**Payload:**
```javascript
{
  senderId, receiverId,
  content,           // Plaintext or encrypted
  encrypted, iv,     // Encryption data
  isEncrypted,       // Boolean flag
  messageType,       // 'text' | 'gif' | 'image'
  mediaUrl,          // Optional media
  createdAt          // ISO timestamp
}
```

#### 2. Message Reactions
**Events:**
- `add_reaction`: React to message
- `reaction_added`: Broadcast reaction

**Emoji Support**: Full emoji set via emoji-picker-react

#### 3. Notifications
**Events:**
- `notification`: Server → User (new notification)

**Notification Types:**
- Friend requests
- Post likes/comments
- New messages
- Workout reminders

**Delivery:**
- Real-time via Socket.IO
- Persisted in database for offline users
- Browser notifications (Web Notifications API)

### Connection Resilience
**Features:**
- Automatic reconnection
- Connection state tracking
- Offline queuing (client-side)
- Heartbeat mechanism

---

## 📦 Deployment & DevOps

### Hosting Platform: Render.com
**Type**: Cloud platform (PaaS)

**Deployed Services:**
1. **Frontend**: Static site
   - Build: `npm run build`
   - Serve: `build/` directory
   - CDN-backed for performance

2. **Backend**: Web service
   - Start: `npm start` (runs server.js)
   - Environment variables configured in Render dashboard
   - Auto-deployment on git push

### Environment Configuration
**Backend Environment Variables:**
```bash
DATABASE_FILE=./data.sqlite
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=oauth_client_id
GOOGLE_CLIENT_SECRET=oauth_client_secret
PORT=5000
```

**Frontend Environment:**
```bash
REACT_APP_API_BASE=https://backend-url.onrender.com
```

### Build Process

#### Frontend Build
```bash
npm run build
├── Static asset optimization
├── Code minification
├── Bundle splitting
└── Service worker generation
```

**Output**: `build/` directory
- `index.html`: Entry point
- `static/`: JS, CSS bundles
- `service-worker.js`: PWA support
- `_redirects`: SPA routing (Netlify/Render)

#### Backend Build
**No build step required**
- Node.js directly executes JavaScript
- Environment-based configuration
- Dependencies installed via `npm install`

### Database Persistence
**SQLite File Storage:**
- Database file persisted on Render disk
- Automatic backups (Render feature)
- Volume mounting for data durability

**Migration Strategy:**
1. Run migrations on server start (`run-migration.js`)
2. Idempotent SQL scripts (`CREATE TABLE IF NOT EXISTS`)
3. Version tracking in migration files

### CORS Configuration
**Allowed Origins:**
```javascript
[
  'http://localhost:3000',           // Local development
  'http://192.168.0.16:3000',        // Network testing
  'https://stay-fit-1.onrender.com', // Production frontend
  'https://stay-fit-2.onrender.com'  // Backup domain
]
```

**Headers:**
- Credentials: Enabled
- Methods: GET, POST, PUT, DELETE
- Headers: Authorization, Content-Type

### Performance Optimizations
**Frontend:**
- Code splitting (React lazy loading)
- Image optimization
- Service worker caching
- Gzip compression

**Backend:**
- Static file caching
- Database query optimization
- Connection pooling
- Helmet security headers

---

## 🎯 Key Features Breakdown

### 1. Social Networking
**Technologies:**
- React Router for navigation
- Axios for API calls
- SQLite for relationship storage

**Features:**
- User profiles with bio, location, profile pictures
- Friend system (send/accept/reject requests)
- User search and discovery
- Follow/unfollow functionality

### 2. Content Sharing
**Technologies:**
- Multer for file uploads
- React hooks for state
- SQLite BLOB storage references

**Features:**
- Create posts with text, images, videos
- Like and save posts
- Nested comment system with replies
- Post sharing (QR code generation)

### 3. Messaging System
**Technologies:**
- Socket.IO for real-time delivery
- Web Crypto API for encryption
- localStorage for key management

**Features:**
- End-to-end encrypted messages
- Message reactions (emojis)
- GIF support
- Read receipts
- Typing indicators (potential)

### 4. Workout Management
**Technologies:**
- React Context for reminders
- dayjs for date handling
- Browser Notifications API

**Features:**
- Schedule workouts on calendar
- Set reminders for workouts
- Track workout history
- Timezone-aware scheduling

### 5. Internationalization (i18n)
**Technology:**
- Custom React Context
- JSON translation files

**Languages:**
- English (default)
- Spanish
- Additional languages configurable

**Implementation:**
```javascript
const { t } = useLanguage();
<p>{t('welcome_message')}</p>
```

### 6. Notifications System
**Types:**
- In-app notifications (React state)
- Real-time push (Socket.IO)
- Browser notifications (Notification API)

**Persistence:**
- Stored in SQLite notifications table
- Fetched on login for offline period
- Marked as read/unread

### 7. Privacy & Settings
**User Controls:**
- Account privacy settings
- Theme preferences (light/dark)
- Language selection
- Notification preferences
- Timezone configuration

---

## 🧪 Testing

### Frontend Testing
**Framework**: Jest + React Testing Library

**Test Files:**
- `App.test.js`: App component tests
- `crypto.test.js`: Encryption unit tests
- `setupTests.js`: Test configuration

**Testing Utilities:**
- `@testing-library/react`: Component testing
- `@testing-library/user-event`: User interaction simulation
- `@testing-library/jest-dom`: Custom matchers

### Backend Testing
**Current Status**: Manual testing
**Planned**: Jest + Supertest for API tests

---

## 🔒 Security Measures

### 1. Authentication Security
- JWT with secret key
- Password hashing (bcrypt)
- Token expiration
- Protected routes

### 2. Data Security
- End-to-end message encryption
- SQL injection prevention (parameterized queries)
- XSS protection (React auto-escaping)
- CSRF tokens (session-based)

### 3. Network Security
- CORS whitelist
- Helmet security headers
- HTTPS in production
- Secure cookies

### 4. File Upload Security
- File type validation
- Size limits
- Filename sanitization
- Separate upload directory

---

## 📊 Data Flow Examples

### User Registration Flow
```
1. User fills form → Frontend validation
2. POST /api/auth/register → Backend receives data
3. Password hashed → bcrypt.hash()
4. User inserted → SQLite INSERT
5. JWT generated → jsonwebtoken.sign()
6. Token returned → Frontend stores in localStorage
7. Redirect to home → React Router navigation
```

### Real-Time Message Flow
```
1. User types message → React state update
2. Encrypt message → Web Crypto API
3. Emit 'send_message' → Socket.IO client
4. Server receives → JWT auth validated
5. Store in database → SQLite INSERT
6. Emit to recipient → io.to(room).emit()
7. Recipient receives → Socket listener
8. Decrypt message → Web Crypto API
9. Display in UI → React state update
```

### Post Creation Flow
```
1. User selects image → File input
2. Image preview → FileReader API
3. Form submission → multipart/form-data
4. Multer processes → File saved to disk
5. Post created → SQLite INSERT with file path
6. Response sent → Post object returned
7. UI updates → React state refresh
8. Feed reloads → GET /api/posts
```

---

## 🚀 Performance Considerations

### Frontend Optimizations
- Lazy loading routes
- Image lazy loading
- Debounced search inputs
- Pagination on feeds
- Local caching (localStorage)

### Backend Optimizations
- Database indexing (unique constraints)
- Query optimization
- File system caching
- Connection pooling
- Response compression

### Database Performance
- Indexed columns: username, email
- Unique constraints for fast lookups
- Efficient JOIN queries
- Limited result sets

---

## 📱 Progressive Web App (PWA)

### Features
- Service worker for offline support
- Manifest.json for installability
- Mobile-responsive design
- Touch-friendly UI

### Service Worker
**Location**: `public/service-worker.js`
**Capabilities:**
- Cache static assets
- Offline fallback
- Background sync (potential)

---

## 🔮 Future Enhancements

### Planned Features
- Video calls (WebRTC)
- AI workout recommendations
- Fitness tracking integrations
- Group messaging
- Stories feature
- Advanced analytics

### Technical Improvements
- Migration to PostgreSQL/MongoDB
- Redis for caching
- CDN for media files
- Microservices architecture
- Kubernetes deployment
- GraphQL API

---

## 📚 Development Workflow

### Local Development
```bash
# Backend
cd backend
npm install
npm start  # Runs on http://localhost:5000

# Frontend
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Git Workflow
- Feature branches
- Pull request reviews
- Deployment via Render auto-deploy

### Database Migrations
```bash
node run-migration.js  # Applies pending migrations
```

---

## 🛠️ Technology Choices Rationale

### Why React?
- Component-based architecture
- Virtual DOM for performance
- Large ecosystem and community
- Easy to learn and maintain

### Why Express?
- Minimalist and flexible
- Middleware system
- Large plugin ecosystem
- Industry standard

### Why SQLite?
- Zero configuration
- Portable (single file)
- Sufficient for project scale
- Easy to version control

### Why Socket.IO?
- Real-time bidirectional communication
- Automatic reconnection
- Fallback mechanisms
- Easy integration with Express

### Why Tailwind CSS?
- Utility-first approach
- Consistent design system
- No CSS conflicts
- Easy dark mode

---

## 📖 API Documentation Summary

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - OAuth initiation
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/me` - Current user profile
- `GET /api/users` - Search users
- `GET /api/users/:id` - User profile
- `PUT /api/me` - Update profile

### Social Endpoints
- `GET /api/friends` - List friends
- `POST /api/friends/request` - Send friend request
- `GET /api/friends/requests` - Pending requests
- `POST /api/friends/accept/:id` - Accept request

### Content Endpoints
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Add comment

### Messaging Endpoints
- `GET /api/messages/:userId` - Conversation history
- (Real-time via Socket.IO)

### Workout Endpoints
- `GET /api/workout-schedules` - User's schedule
- `POST /api/workout-schedules` - Create event
- `DELETE /api/workout-schedules/:id` - Remove event

---

## 💡 Best Practices Implemented

### Code Organization
- Separation of concerns
- Modular architecture
- Reusable components
- Clear naming conventions

### Security
- Environment variable usage
- Input validation
- Error handling
- Secure dependencies

### User Experience
- Responsive design
- Loading states
- Error messages
- Confirmation dialogs

### Performance
- Optimized queries
- Efficient rendering
- Asset optimization
- Caching strategies

---

## 📝 Conclusion

Stay-Fit is a modern, full-stack social fitness application built with industry-standard technologies. It demonstrates proficiency in:

- **Full-Stack Development**: React + Node.js + Express
- **Real-Time Systems**: Socket.IO WebSockets
- **Security**: JWT, OAuth, End-to-End Encryption
- **Database Design**: Relational data modeling with SQLite
- **DevOps**: Cloud deployment, CI/CD
- **UI/UX**: Responsive design, PWA capabilities
- **Software Architecture**: RESTful API, MVC pattern

The project showcases practical implementation of modern web development concepts including authentication, real-time communication, file handling, encryption, and social networking features.

---

**Project Repository**: stay-fit
**Built by**: Smart (Final Year Project)
**Last Updated**: January 2026
