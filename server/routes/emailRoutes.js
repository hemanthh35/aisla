// Email testing routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// @desc    Test email functionality (admin only)
// @route   POST /api/email/test
// @access  Private (Admin only)
router.post('/test', protect, async (req, res) => {
    try {
        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { email, type } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address required' });
        }

        let result;

        if (type === 'welcome') {
            result = await emailService.sendWelcomeEmail(email, 'Test User', 'student');
        } else {
            // Test experiment notification
            const testExperiment = {
                _id: 'test123',
                title: 'Test Experiment - Newton\'s Laws',
                subject: 'Physics',
                difficulty: 'intermediate',
                createdAt: new Date()
            };

            result = await emailService.sendNewExperimentNotification(
                [email],
                testExperiment,
                {
                    name: req.user.name,
                    email: req.user.email
                }
            );
        }

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
