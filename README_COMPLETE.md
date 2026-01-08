# AISLA - AI Self-Learning Lab Assistant
## Complete System Architecture & Implementation Guide

A full-stack educational platform with **Ollama-powered AI** for intelligent experiment generation, quiz creation, and real-time learning assistance. Built for the GITAM Hackathon with role-based access (Student/Faculty/Admin).

---

## 🎯 System Overview

### How It Works (Complete Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
│                                                                   │
│  Frontend: React 18 + React Router (localhost:3000)             │
│  - Landing, Register, Login, Dashboard                          │
│  - Experiment creation, quiz taking, badge viewing              │
│  - Real-time AI chat widget (SSE streaming)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST + JWT Bearer Token
                         │
┌────────────────────────▼────────────────────────────────────────┐
│               Backend: Express.js (localhost:5000)               │
│                                                                   │
│  Routes:                                                         │
│  - /api/auth        → AuthController → JWT generation          │
│  - /api/experiments → ExperimentController (CRUD)              │
│  - /api/chat        → ChatService → Ollama streaming           │
│  - /api/quiz        → QuizController → AI quiz generation      │
│  - /api/badges      → BadgeController → Badge management       │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    MongoDB Atlas    Ollama Server    Mongoose Models
  (Data Storage)  (AI Generation)   (User, Experiment,
                                    Quiz, Badge, etc)
```

---

## 🧠 AI & LLM Integration (Ollama)

### What is Ollama?
**Ollama** is a local LLM server that runs language models on your machine without external API calls.

**Current Setup:**
- **Model**: `llama3.2:3b` (Text generation)
- **Vision Model**: `llava:latest` (Image understanding)
- **URL**: `http://localhost:11434` (configurable in `.env`)
- **Cost**: FREE - runs entirely locally

### How Ollama Generates Content

#### 1. **Experiment Generation** (`aiService.js`)
```javascript
// Faculty creates experiment
Faculty Input: Title = "Ohm's Law", Content = "Description"
          ↓
Ollama LLM receives prompt with structured JSON template
          ↓
AI generates: {
  aim: "To study relationship between voltage, current, resistance",
  theory: "Ohm's law states V = IR",
  apparatus: ["Voltmeter", "Ammeter", "Resistor"],
  procedure: ["Step 1: Setup circuit", "Step 2: Measure voltage"...],
  keyFormulas: ["V = IR", "R = V/I"],
  ...
}
          ↓
Saves to MongoDB with createdBy = Faculty ID
```

#### 2. **Real-Time Chat Streaming** (`chatService.js`)
```javascript
// Student sends message
Student: "What is photosynthesis?"
          ↓
Connect to Ollama /api/chat endpoint with stream: true
          ↓
Ollama generates response token-by-token
          ↓
Server-Sent Events (SSE) stream tokens to client in real-time
          ↓
Frontend renders smooth ChatGPT-like typing effect
```

### AI Service Pattern
```javascript
// All AI calls follow this pattern:
const result = await callOllama(model, prompt, systemPrompt, options);

if (!result.success) {
  // AI failed - return fallback defaults
  return { success: true, content: FALLBACK_EXPERIMENT };
}

// Parse JSON response (handles markdown fences)
const parsed = parseJSON(result.text);
```

---

## 🏗️ Complete Architecture

### Frontend (React)

**Pages:**
- **Landing.js** - Public home page
- **Register.js / Login.js** - Authentication with role selection (student/faculty/admin)
- **Dashboard.js** - Main hub showing experiments, badges, quiz submissions
  - Students: View all experiments, take quizzes, see badges
  - Faculty: Create experiments, manage quizzes, view submissions
  - Admin: Full control - delete any experiment, manage all badges
- **CreateExperiment.js** - Faculty form → sends to backend → Ollama generates → saves to DB
- **ExperimentView.js** - Display generated experiment content
- **QuizPage.js** - Take quiz with real-time grading
- **ResultPage.js** - Quiz results
- **BadgeManagement.js** - Admin badge CRUD operations
- **DiagramGenerator.js** - Mermaid diagram creation

**Components:**
- **AIChatWidget.js** - Floating chat assistant using SSE streaming
  - Connects to `/api/chat/stream` endpoint
  - Renders markdown with custom formatter
  - Maintains conversation history
- **ConfirmModal.js** - Reusable confirmation modal (delete, actions)
- **PrivateRoute.js** - Route protection with auth check

**Context:**
- **AuthContext.js** - Global auth state
  - Stores JWT token in localStorage
  - Provides `login()`, `register()`, `logout()`
  - Fetches `/api/auth/me` on mount to restore session

### Backend (Express + MongoDB)

**Authentication Flow:**
```
1. User submits email/password → POST /api/auth/register
2. Controller hashes password with bcryptjs
3. Creates User document in MongoDB
4. Generates JWT token with user._id
5. Frontend stores token in localStorage
6. All future requests include: Authorization: Bearer <token>
7. Middleware (protect) verifies token → req.user populated
```

**Database Models:**
- **User** - { name, email, password (hashed), role, department, createdAt }
- **Experiment** - { title, originalContent, content (AI-generated), createdBy, subject, difficulty }
- **Quiz** - { experimentId, questions, createdBy }
- **Submission** - { userId, quizId, answers, score, percentage }
- **Badge** - { name, description, icon, rarity, points, category }
- **UserBadge** - { userId, badgeId, awardedBy, awardedAt }

**Role-Based Access Control:**

| Action | Student | Faculty | Admin |
|--------|---------|---------|-------|
| View experiments | ✅ (all) | ✅ (own) | ✅ (all) |
| Create experiment | ❌ | ✅ | ✅ |
| Edit experiment | ❌ | ✅ (own) | ✅ (all) |
| **Delete experiment** | ❌ | ✅ (own) | ✅ (all) |
| Take quiz | ✅ | ❌ | ❌ |
| View submissions | ❌ | ✅ (own) | ✅ (all) |
| Create badge | ❌ | ❌ | ✅ |
| Assign badge | ❌ | ❌ | ✅ |

**API Routes:**

```javascript
// Authentication
POST   /api/auth/register     - Register user
POST   /api/auth/login        - Login & get JWT
GET    /api/auth/me           - Get current user (protected)

// Experiments
GET    /api/experiments       - List all/faculty experiments
POST   /api/experiment/create - Create with AI (faculty only)
POST   /api/experiment/create-stream - Stream creation progress
GET    /api/experiment/:id    - Get single experiment
PUT    /api/experiment/:id    - Update (owner/admin)
DELETE /api/experiment/:id    - Delete (owner/admin) ← FIXED: now admin can delete all

// Quiz
GET    /api/quiz              - Get quizzes
POST   /api/quiz/create       - Create quiz (faculty)
POST   /api/quiz/submit       - Submit answers (student)

// Badges
GET    /api/badges            - Get all badges
POST   /api/badges            - Create (admin only)
POST   /api/badges/assign     - Assign to user (admin)
GET    /api/badges/my-badges  - Get user's badges

// Chat (Real-time AI)
POST   /api/chat/stream       - Stream chat response (SSE)
GET    /api/chat/status       - Check Ollama availability
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20.x
- MongoDB Atlas account (free tier works)
- **Ollama installed locally** (Download from ollama.ai)

### Step 1: Pull Models with Ollama

```bash
# Install Ollama from https://ollama.ai
# Then pull models:

ollama pull llama3.2:3b      # For experiment/quiz generation (~2GB)
ollama pull gemma3:4b        # For chat (optional, ~5GB)
ollama pull llava:latest     # For image understanding (optional, ~5GB)

# Verify Ollama is running:
curl http://localhost:11434/api/tags
# Should list available models
```

### Step 2: Configure Environment

Create `server/.env`:
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aisla

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars

# Server
PORT=5000
NODE_ENV=development

# Ollama (Local LLM)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### Step 3: Install & Run

```bash
# Install all dependencies
npm run install:all

# Development mode (concurrent frontend + backend)
npm run dev

# OR individual terminals:
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm start
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Ollama: http://localhost:11434

---

## 🔄 Key Workflows

### Creating an Experiment (Faculty)
1. Faculty navigates to "Create Experiment"
2. Enters: Title, Content, Subject, Difficulty
3. Frontend sends POST to `/api/experiment/create-stream`
4. Backend:
   - Checks `req.user.role === 'faculty'` ✅
   - Calls `aiService.generateExperiment(title, content)`
   - Ollama generates JSON: { aim, theory, apparatus, procedure... }
   - Saves to MongoDB with `createdBy = faculty._id`
   - Streams progress updates via SSE
5. Frontend receives experiment & redirects to view

### Taking a Quiz (Student)
1. Student views experiment & clicks "Take Quiz"
2. Quiz questions displayed (AI-generated or faculty-created)
3. Student submits answers → POST `/api/quiz/submit`
4. Backend:
   - Calculates score based on correct answers
   - Creates Submission document
   - Returns percentage score
5. Frontend displays ResultPage with badge eligibility

### Admin Deleting Any Experiment (NEW FIX)
1. Admin views experiment card
2. Delete button visible (previously only for owner)
3. Modal confirmation: "Are you sure? This action cannot be undone."
4. DELETE `/api/experiment/:id`:
   ```javascript
   // Backend check:
   const isOwner = experiment.createdBy === user._id;
   const isAdmin = user.role === 'admin'; // ✅ NOW WORKS
   
   if (!isOwner && !isAdmin) {
     return res.status(403).json({ message: 'Not authorized' });
   }
   ```
5. Experiment deleted, page refreshed

### Real-Time AI Chat
1. Student opens floating chat widget
2. Types question in message input
3. Sends → POST `/api/chat/stream`
4. Server connects to Ollama `/api/chat` with `stream: true`
5. Ollama streams tokens → Backend SSE relays to Frontend
6. Frontend renders tokens as they arrive (typing effect)

---

## 📊 Database Schema Details

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed, select: false),
  role: "student" | "faculty" | "admin",
  department: String,
  rollNumber: String,
  employeeId: String,
  institution: String,
  createdAt: Date
}
```

### Experiment Collection
```javascript
{
  _id: ObjectId,
  title: String,
  originalContent: {
    type: "text" | "pdf" | "image",
    text: String,
    fileUrl: String
  },
  content: {  // AI-generated, completely flexible (strict: false)
    aim: String,
    theory: String,
    apparatus: [String],
    procedure: [String],
    keyFormulas: [String],
    example: String,
    observations: String,
    result: String,
    precautions: [String],
    commonMistakes: [String],
    realWorldUse: [String],
    summary: String
  },
  subject: String,
  difficulty: "beginner" | "intermediate" | "advanced",
  createdBy: ObjectId (ref: User),
  quizGenerated: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Frontend Features

### Authentication UI
- Smooth cubic-bezier animations
- Role selection (student/faculty/admin)
- Gradient backgrounds with transitions
- Form validation with error messages

### Real-Time Chat
- Markdown rendering (bold, italic, code, lists)
- Token-by-token streaming animation
- Conversation history
- Floating widget (always accessible)

### Confirmation Modal
- Replaces browser `window.confirm()`
- Danger mode (red button for destructive actions)
- Smooth fade-in/slide-up animation
- Professional styling

### Responsive Design
- Mobile-first approach
- Sidebar navigation (collapsible on mobile)
- Card-based experiment layout
- Touch-friendly buttons

---

## ⚙️ Performance Optimizations

1. **Ollama Speed Settings**
   - Lower temperature (0.5) for consistent responses
   - Smaller context window (2048) for faster inference
   - Multi-threading (8 threads)
   - Token limit (1500) for quick generation

2. **MongoDB**
   - Indexes on frequently queried fields (createdBy, role, email)
   - Efficient pagination (skip/limit)
   - Select fields explicitly (exclude password by default)

3. **Frontend**
   - Code splitting with React Router lazy loading
   - Context API (no Redux bloat)
   - Memoization for expensive renders
   - SSE streaming for smooth UX

4. **Backend**
   - Non-blocking JSON parsing
   - Concurrent server startup (DB connects in background)
   - Proper error handling with fallbacks

---

## 🔒 Security Features

1. **JWT Authentication**
   - Tokens stored securely in localStorage
   - Verified on every protected route
   - 32-char minimum secret key

2. **Password Security**
   - bcryptjs hashing (10 salt rounds)
   - Select: false on password field (never returned in queries)

3. **Role-Based Access Control**
   - Checked in controllers (not middleware)
   - Admin > Faculty > Student hierarchy
   - Each endpoint validates `req.user.role`

4. **CORS Configuration**
   - Enabled for frontend requests
   - Production: restrict to frontend URL

---

## 🌐 Deployment (Render)

```bash
# 1. Push to GitHub
git push origin main

# 2. Create Backend Service on Render
Build: cd server && npm install
Start: cd server && npm start

# 3. Add Env Variables
MONGO_URI, JWT_SECRET, PORT=5000, OLLAMA_URL=...

# 4. Create Frontend Service
Build: cd client && npm install && npm run build
Start: npm start

# 5. Frontend .env points to backend Render URL
REACT_APP_API_URL=https://aisla-backend.render.com
```

**Note:** Ollama must run locally on backend server or be accessible via network.

---

## 🛠️ Development Commands

```bash
# Root directory
npm run install:all          # Install server + client deps
npm run dev                  # Concurrent dev (backend + frontend)
npm run build:client         # Build React for production

# Server directory
npm run dev                  # Nodemon with auto-reload

# Client directory
npm start                    # CRA dev server on :3000
npm run build               # Production build
npm test                    # Run tests
```

---

## 📝 File Structure

```
hackthon-gitam/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── pages/                   # Page components (each with .js & .css)
│   │   │   ├── Landing.js
│   │   │   ├── Dashboard.js         # Main hub (students/faculty/admin)
│   │   │   ├── CreateExperiment.js  # Faculty creates with AI
│   │   │   ├── ExperimentView.js    # Display AI-generated content
│   │   │   ├── QuizPage.js          # Take quizzes
│   │   │   ├── ResultPage.js        # Quiz results
│   │   │   ├── BadgeManagement.js   # Admin badge CRUD
│   │   │   ├── DiagramGenerator.js  # Mermaid diagrams
│   │   │   ├── Register.js
│   │   │   └── Login.js
│   │   ├── components/
│   │   │   ├── AIChatWidget.js      # Floating SSE chat
│   │   │   ├── ConfirmModal.js      # Confirmation dialog
│   │   │   ├── PrivateRoute.js      # Route protection
│   │   │   └── *.css
│   │   ├── context/
│   │   │   └── AuthContext.js       # JWT + user state
│   │   ├── App.js                   # Router setup
│   │   └── index.js
│   └── package.json
│
├── server/                          # Express Backend
│   ├── routes/
│   │   ├── authRoutes.js            # Login/Register
│   │   ├── experimentRoutes.js      # CRUD + AI generation
│   │   ├── quizRoutes.js            # Quiz management
│   │   ├── badgeRoutes.js           # Badge CRUD
│   │   ├── chat.js                  # SSE chat streaming
│   │   └── aiRoutes.js              # AI utilities
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── experimentController.js  # Experiment logic
│   │   ├── quizController.js        # Quiz logic
│   │   └── badgeController.js       # Badge logic
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Experiment.js            # Experiment schema (strict: false)
│   │   ├── Quiz.js
│   │   ├── Submission.js
│   │   ├── Badge.js
│   │   └── UserBadge.js
│   ├── services/
│   │   ├── aiService.js             # Ollama calls for experiments/quizzes
│   │   └── chatService.js           # SSE streaming chat
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification (protect)
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── server.js                    # Main entry point
│   └── package.json
│
├── .github/
│   └── copilot-instructions.md      # AI agent guidelines
├── LOCAL_LLM_SETUP.md               # Ollama setup docs
├── README.md                        # Main README
├── README_COMPLETE.md               # THIS FILE (Complete guide)
├── package.json                     # Root workspace
└── render.yaml                      # Deployment config
```

---

## 🎓 Common Issues & Solutions

### "Unauthorized" when admin deletes experiment
**Problem:** Backend wasn't restarted after code fix.  
**Solution:** Kill server (`Ctrl+C`) and restart: `npm run dev`

### Ollama connection fails
**Problem:** Ollama server not running.  
**Solution:** Start Ollama: `ollama serve` (runs on http://localhost:11434)

### MongoDB Atlas connection timeout
**Problem:** IP address not whitelisted.  
**Solution:** Go to MongoDB Atlas → Network Access → Add your IP

### SSE chat not streaming
**Problem:** Browser cache or stale connection.  
**Solution:** Clear cache, hard refresh (Ctrl+Shift+R), close chat widget & reopen

---

## 🚀 Features Summary

✅ **AI-Powered Content Generation** - Ollama creates structured experiments  
✅ **Real-Time Chat Streaming** - SSE for ChatGPT-like experience  
✅ **Role-Based Access** - Student/Faculty/Admin with granular permissions  
✅ **Badge System** - Reward students for achievements  
✅ **Quiz Management** - AI-generated or manual quizzes with auto-grading  
✅ **Professional UI** - Smooth animations, responsive design  
✅ **Local LLM** - No API keys, no external calls, 100% private  
✅ **JWT Authentication** - Secure token-based login  
✅ **MongoDB Integration** - Scalable data persistence  

---

## 📜 License
MIT - Open source for educational purposes

---

**Last Updated:** December 13, 2025  
**Built for:** GITAM Hackathon  
**Repository:** https://github.com/hemanthh35/labs
