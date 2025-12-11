// Main server entry point for AISLA Backend
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json({ limit: '50mb' })); // Parse JSON request bodies with larger limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experiment', experimentRoutes);
app.use('/api/experiments', experimentRoutes); // Alias for getting all
app.use('/api/quiz', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/badges', badgeRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'AISLA API is running...',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      experiments: '/api/experiments',
      experiment: '/api/experiment',
      quiz: '/api/quiz',
      ai: '/api/ai',
      badges: '/api/badges'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;

// Start server first, then connect to DB (non-blocking)
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);

  // Connect to MongoDB after server starts
  connectDB();
});
