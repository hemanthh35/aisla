# AISLA - AI Self-Learning Lab Assistant

## Professional Educational Platform with Badge Management System

A full-stack application built for the GITAM Hackathon featuring:

### Features

- **Professional Registration UI** - Smooth animations, role-based (Faculty/Student)
- **Badge Management System** - Award, revoke, and track student achievements
- **Local LLM Integration** - DistilGPT-2 running completely locally (no API keys!)
- **AI-Powered Content Generation** - Experiment creation, explanations, quizzes
- **Authentication** - JWT-based secure login with MongoDB
- **Responsive Design** - Mobile-friendly interface with professional styling

### Tech Stack

**Frontend:**

- React.js with React Router
- Professional CSS animations
- Real-time state management with Context API

**Backend:**

- Node.js + Express.js
- MongoDB Atlas for data persistence
- Local LLM via @xenova/transformers
- JWT authentication with bcryptjs

**AI/ML:**

- DistilGPT-2 model (300MB, runs on CPU)
- No API keys required - 100% local processing

### Project Structure

```
hackthon-gitam/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components with animations
│   │   ├── context/        # Auth context
│   │   └── App.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Auth middleware
│   ├── services/           # Business logic (LLM, etc)
│   ├── config/             # DB configuration
│   └── server.js
├── render.yaml             # Render deployment config
└── README.md
```

### Installation & Local Development

1. **Install Dependencies**

```bash
cd server && npm install
cd ../client && npm install
```

2. **Environment Variables** (`.env` in server folder)

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

3. **Start Development Servers**

```bash
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
cd client && npm start
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

### API Endpoints

**Authentication**

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout

**Badges**

- GET `/api/badges` - Get all badges
- POST `/api/badges` - Create badge (admin)
- POST `/api/badges/assign` - Assign badge to user
- GET `/api/badges/my-badges` - Get user's badges
- GET `/api/badges/stats` - Badge statistics

**Experiments**

- GET `/api/experiments` - Get all experiments
- POST `/api/experiment` - Create experiment with AI
- GET `/api/experiment/:id` - Get single experiment

**Quiz**

- GET `/api/quiz` - Get quizzes
- POST `/api/quiz` - Create quiz with AI
- POST `/api/quiz/submit` - Submit quiz answers

**AI**

- POST `/api/ai/generate` - Generate content via local LLM

### Deployment on Render

1. **Push to GitHub**

```bash
git push origin main
```

2. **Create New Service on Render**

   - Connect GitHub repository
   - Select this repository
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`
   - Add environment variables
3. **Set Environment Variables on Render Dashboard**

   - MONGO_URI
   - JWT_SECRET
   - NODE_ENV=production
4. **Deploy Frontend**

   - Create another Render service for client
   - Build: `cd client && npm install && npm run build`
   - Start: `cd client && npm start`

### Features Breakdown

**Badge System**

- Create/Edit/Delete badges with custom properties
- Assign badges to students with reward points
- Track badge statistics and leaderboard
- Different rarities and categories

**Local LLM Integration**

- Generate experiment content
- Create educational explanations
- Auto-generate quiz questions
- No external API dependencies
- 100% private data processing

**Professional UI**

- Cubic-bezier animations on auth pages
- Gradient backgrounds with smooth transitions
- Staggered animations for form elements
- Responsive design across all devices
- Role-based UI (Student/Faculty/Admin)

### Performance Optimizations

- Lazy-loaded LLM model (loads on first use)
- ONNX Runtime with multi-threaded processing
- Efficient MongoDB queries with proper indexing
- Frontend code splitting and lazy loading
- Caching strategies for repeated requests

### Future Enhancements

- Real-time notifications for badge awards
- Leaderboard with rankings
- Advanced analytics dashboard
- Mobile app (React Native)
- Video content support
- Community features (forums, peer review)

### Team

- **Project:** AISLA - AI Self-Learning Lab Assistant
- **Hackathon:** GITAM
- **Built:** December 2025

### License

MIT

---

**Live Demo:** [Deployed URL]
**GitHub:** https://github.com/hemanthh35/labs
