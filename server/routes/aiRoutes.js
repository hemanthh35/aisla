// AI routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { aiExplain } from '../controllers/experimentController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// AI Explain endpoint
router.post('/explain', aiExplain);

export default router;
