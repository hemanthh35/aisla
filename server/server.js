// Main server entry point for AISLA Backend
// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import chatRoutes from './routes/chat.js';
import aiRoutes from './routes/aiRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reactionRoutes from './routes/reactionRoutes.js';
import labExperimentRoutes from './routes/labExperimentRoutes.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json({ limit: '50mb' })); // Parse JSON request bodies with larger limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/experiment', experimentRoutes);
app.use('/api/experiments', experimentRoutes); // Alias for getting all
app.use('/api/quiz', quizRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/lab-experiments', labExperimentRoutes);

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  // Health check route for development
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
        badges: '/api/badges',
        chat: '/api/chat'
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;

// Start server on all interfaces (0.0.0.0) for network access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🌍 Network Access: http://0.0.0.0:${PORT}`);

  // Connect to MongoDB after server starts
  connectDB();
});
