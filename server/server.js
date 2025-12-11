// Main server entry point for AISLA Backend
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json({ limit: '50mb' })); // Parse JSON request bodies with larger limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/experiment', require('./routes/experimentRoutes'));
app.use('/api/experiments', require('./routes/experimentRoutes')); // Alias for getting all
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/badges', require('./routes/badgeRoutes'));

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
