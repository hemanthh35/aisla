# AISLA - AI Self-Learning Lab Assistant

## Architecture Overview
AISLA is a full-stack educational platform with role-based access (student/faculty/admin). The stack is:
- **Frontend**: React 18 + React Router 6 at `client/` (CRA, proxies to `:5000`)
- **Backend**: Express.js (ES Modules) at `server/` with MongoDB Atlas
- **AI**: Ollama-powered (llama3.2:3b for text, llava for vision) via local HTTP API

Data flow: React → Express API (`/api/*`) → MongoDB/Ollama → SSE streaming responses

## Key Patterns

### Authentication
- JWT tokens stored in `localStorage`, sent as `Bearer` header
- Auth state managed via React Context (`client/src/context/AuthContext.js`)
- Protected routes use `<PrivateRoute>` wrapper and `protect` middleware on server
- User roles: `student`, `faculty`, `admin` - checked in controllers, not middleware

### API Structure
Routes follow RESTful patterns in `server/routes/`. Controllers in `server/controllers/` handle business logic:
```javascript
// Route pattern: router.use(protect) then define endpoints
router.post('/create', createExperiment);  // Faculty only - checked in controller
```

### AI Service Pattern
AI calls go through `server/services/aiService.js` using Ollama's REST API:
- Always parse JSON from AI responses using the `parseJSON()` helper (handles markdown fences)
- Provide fallback defaults when AI fails - never return empty content
- Use streaming SSE for long-running operations (see `/create-stream` endpoint)

### SSE Streaming Pattern
For real-time AI responses (`server/services/chatService.js`, `server/routes/chat.js`):
```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.flushHeaders();
res.write(`data: ${JSON.stringify({ type: 'TOKEN', content })}\n\n`);
```

### MongoDB Models
Models use Mongoose with ES Modules in `server/models/`. Key conventions:
- Password hashing via pre-save hooks (`User.js`)
- `select: false` on sensitive fields
- `strict: false` for flexible AI-generated content (`Experiment.js`)

## Development Commands
```bash
# Root: Install all dependencies
npm run install:all

# Development (concurrent frontend + backend)
npm run dev

# Individual servers
cd server && npm run dev    # nodemon on :5000
cd client && npm start      # CRA on :3000

# Production build
npm run build:client
```

## Environment Variables (server/.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
PORT=5000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## File Conventions
- **Pages**: `client/src/pages/` - each has paired `.js` and `.css`
- **Components**: `client/src/components/` - reusable UI elements
- **Routes**: Map 1:1 with controllers (`experimentRoutes.js` → `experimentController.js`)
- **Services**: Business logic layer for external integrations (AI, etc.)

## Role-Based Access
| Role    | Can Create Experiments | Badge Management | View All Experiments |
|---------|------------------------|------------------|----------------------|
| Student | ❌                     | View own only    | ✅                   |
| Faculty | ✅                     | Assign badges    | Own only             |
| Admin   | ✅                     | Full CRUD        | ✅                   |

## Common Tasks

### Adding a new API endpoint
1. Add route in `server/routes/<domain>Routes.js`
2. Create controller function in `server/controllers/<domain>Controller.js`
3. Apply `protect` middleware for auth; check `req.user.role` for permissions

### Adding a new page
1. Create `client/src/pages/NewPage.js` and `NewPage.css`
2. Add route in `client/src/App.js` (wrap with `<PrivateRoute>` if protected)
3. Link from navigation or other pages

### Working with AI generation
- Call functions from `server/services/aiService.js`
- Handle `{ success, content/error }` response pattern
- Always provide user-facing fallbacks for AI failures
