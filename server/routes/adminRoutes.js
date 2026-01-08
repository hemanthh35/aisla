// Admin Routes - User and Submission Management
import express from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Experiment from '../models/Experiment.js';

const router = express.Router();

// Middleware to check admin access
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Middleware to allow faculty and admin to view data
const facultyOrAdminView = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Faculty or Admin access required' });
    }
    next();
};

// @route   GET /api/admin/users
// @desc    Get all users with optional role filter
// @access  Admin or Faculty
router.get('/users', protect, facultyOrAdminView, async (req, res) => {
    try {
        const { role } = req.query;

        let query = {};
        if (role && ['student', 'faculty', 'admin'].includes(role)) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`[Admin] Fetching users - Found ${users.length} users`);

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// @route   GET /api/admin/students
// @desc    Get all students with their quiz stats
// @access  Admin only
router.get('/students', protect, adminOnly, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Get submission stats for each student
        const studentsWithStats = await Promise.all(
            students.map(async (student) => {
                const submissions = await Submission.find({ userId: student._id });
                const totalAttempts = submissions.length;
                const avgScore = totalAttempts > 0
                    ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / totalAttempts)
                    : 0;
                const bestScore = totalAttempts > 0
                    ? Math.max(...submissions.map(s => s.percentage))
                    : 0;

                return {
                    ...student.toObject(),
                    stats: {
                        totalAttempts,
                        avgScore,
                        bestScore
                    }
                };
            })
        );

        res.json({
            success: true,
            count: studentsWithStats.length,
            students: studentsWithStats
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
});

// @route   GET /api/admin/all-submissions
// @desc    Get all quiz submissions across all experiments
// @access  Admin only
router.get('/all-submissions', protect, adminOnly, async (req, res) => {
    try {
        const { limit = 100, skip = 0 } = req.query;

        const submissions = await Submission.find()
            .populate('userId', 'name email rollNumber')
            .populate('experimentId', 'title subject')
            .sort({ submittedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Submission.countDocuments();

        // Calculate overall stats
        const allSubmissions = await Submission.find();
        const totalSubmissions = allSubmissions.length;
        const avgScore = totalSubmissions > 0
            ? Math.round(allSubmissions.reduce((a, s) => a + s.percentage, 0) / totalSubmissions)
            : 0;
        const highestScore = totalSubmissions > 0
            ? Math.max(...allSubmissions.map(s => s.percentage))
            : 0;
        const lowestScore = totalSubmissions > 0
            ? Math.min(...allSubmissions.map(s => s.percentage))
            : 0;

        res.json({
            success: true,
            total,
            count: submissions.length,
            stats: {
                totalSubmissions,
                avgScore,
                highestScore,
                lowestScore
            },
            submissions
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'Failed to fetch submissions' });
    }
});

// @route   GET /api/admin/dashboard-stats
// @desc    Get comprehensive dashboard statistics
// @access  Admin only
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
    try {
        // Get counts
        const [
            totalStudents,
            totalFaculty,
            totalExperiments,
            totalSubmissions
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: { $in: ['faculty', 'admin'] } }),
            Experiment.countDocuments(),
            Submission.countDocuments()
        ]);

        // Get quiz stats
        const submissions = await Submission.find();
        const avgScore = submissions.length > 0
            ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length)
            : 0;

        // Get experiments with quizzes
        const experimentsWithQuizzes = await Experiment.countDocuments({ quizGenerated: true });

        // Recent activity - last 10 submissions
        const recentSubmissions = await Submission.find()
            .populate('userId', 'name email')
            .populate('experimentId', 'title')
            .sort({ submittedAt: -1 })
            .limit(10);

        // Recent experiments
        const recentExperiments = await Experiment.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Top performers
        const studentStats = await Submission.aggregate([
            {
                $group: {
                    _id: '$userId',
                    avgScore: { $avg: '$percentage' },
                    totalAttempts: { $sum: 1 }
                }
            },
            { $sort: { avgScore: -1 } },
            { $limit: 10 }
        ]);

        // Populate top performers
        const topPerformers = await User.populate(studentStats, {
            path: '_id',
            select: 'name email'
        });

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalFaculty,
                totalExperiments,
                totalQuizzes: experimentsWithQuizzes,
                totalSubmissions,
                averageScore: avgScore
            },
            recentActivity: {
                submissions: recentSubmissions,
                experiments: recentExperiments
            },
            topPerformers: topPerformers.map(p => ({
                user: p._id,
                avgScore: Math.round(p.avgScore),
                totalAttempts: p.totalAttempts
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
});

// @route   GET /api/admin/student/:id
// @desc    Get detailed info about a specific student
// @access  Admin only
router.get('/student/:id', protect, adminOnly, async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get all submissions for this student
        const submissions = await Submission.find({ userId: student._id })
            .populate('experimentId', 'title subject difficulty')
            .sort({ submittedAt: -1 });

        // Calculate stats
        const totalAttempts = submissions.length;
        const avgScore = totalAttempts > 0
            ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / totalAttempts)
            : 0;
        const bestScore = totalAttempts > 0
            ? Math.max(...submissions.map(s => s.percentage))
            : 0;

        // Get unique experiments attempted
        const uniqueExperiments = [...new Set(submissions.map(s => s.experimentId?._id?.toString()))].length;

        res.json({
            success: true,
            student: {
                ...student.toObject(),
                stats: {
                    totalAttempts,
                    avgScore,
                    bestScore,
                    uniqueExperiments
                },
                submissions
            }
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Failed to fetch student details' });
    }
});

// @route   PUT /api/admin/user/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/user/:id/role', protect, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['student', 'faculty', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Failed to update user role' });
    }
});

// @route   DELETE /api/admin/user/:id
// @desc    Delete a user
// @access  Admin only
router.delete('/user/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Delete user's submissions
        await Submission.deleteMany({ userId: user._id });

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User and associated data deleted'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// @route   POST /api/admin/user
// @desc    Create a new user
// @access  Admin only
router.post('/user', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, password, role, department, rollNumber, employeeId, institution } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate role
        const validRole = ['student', 'faculty', 'admin'].includes(role) ? role : 'student';

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: validRole,
            department: department || '',
            rollNumber: rollNumber || '',
            employeeId: employeeId || '',
            institution: institution || ''
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                rollNumber: user.rollNumber,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
});

// @route   GET /api/admin/chart-data
// @desc    Get data for dashboard charts
// @access  Admin only
router.get('/chart-data', protect, adminOnly, async (req, res) => {
    try {
        // 1. Submissions over last 7 days (for line chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailySubmissions = await Submission.aggregate([
            { $match: { submittedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                    count: { $sum: 1 },
                    avgScore: { $avg: '$percentage' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const found = dailySubmissions.find(d => d._id === dateStr);
            days.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: found ? found.count : 0,
                avgScore: found ? Math.round(found.avgScore) : 0
            });
        }

        // 2. Score distribution (for pie chart)
        const allSubmissions = await Submission.find().select('percentage');
        const scoreDistribution = {
            excellent: 0, // 90-100
            good: 0,      // 70-89
            average: 0,   // 50-69
            poor: 0       // 0-49
        };

        allSubmissions.forEach(s => {
            if (s.percentage >= 90) scoreDistribution.excellent++;
            else if (s.percentage >= 70) scoreDistribution.good++;
            else if (s.percentage >= 50) scoreDistribution.average++;
            else scoreDistribution.poor++;
        });

        // 3. Experiments by subject (for bar chart)
        const subjectData = await Experiment.aggregate([
            {
                $group: {
                    _id: '$subject',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 4. User registrations over last 30 days (for line chart)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthlyRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    students: {
                        $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
                    },
                    faculty: {
                        $sum: { $cond: [{ $in: ['$role', ['faculty', 'admin']] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 5. Quiz performance by experiment (for bar chart)
        const experimentPerformance = await Submission.aggregate([
            {
                $group: {
                    _id: '$experimentId',
                    avgScore: { $avg: '$percentage' },
                    submissions: { $sum: 1 }
                }
            },
            { $sort: { avgScore: -1 } },
            { $limit: 10 }
        ]);

        // Populate experiment titles
        const expPerformanceWithTitles = await Experiment.populate(experimentPerformance, {
            path: '_id',
            select: 'title'
        });

        // 6. Role distribution (for pie chart)
        const roleCounts = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            charts: {
                // Line chart - daily submissions
                dailySubmissions: {
                    labels: days.map(d => d.label),
                    data: days.map(d => d.count),
                    avgScores: days.map(d => d.avgScore)
                },
                // Pie chart - score distribution
                scoreDistribution: {
                    labels: ['Excellent (90-100)', 'Good (70-89)', 'Average (50-69)', 'Poor (0-49)'],
                    data: [scoreDistribution.excellent, scoreDistribution.good, scoreDistribution.average, scoreDistribution.poor]
                },
                // Bar chart - experiments by subject
                experimentsBySubject: {
                    labels: subjectData.map(s => s._id || 'Unspecified'),
                    data: subjectData.map(s => s.count)
                },
                // Line chart - user registrations
                userRegistrations: monthlyRegistrations,
                // Bar chart - quiz performance
                quizPerformance: {
                    labels: expPerformanceWithTitles.map(e => e._id?.title || 'Unknown').slice(0, 8),
                    avgScores: expPerformanceWithTitles.map(e => Math.round(e.avgScore)).slice(0, 8),
                    submissions: expPerformanceWithTitles.map(e => e.submissions).slice(0, 8)
                },
                // Pie chart - role distribution
                roleDistribution: {
                    labels: roleCounts.map(r => r._id.charAt(0).toUpperCase() + r._id.slice(1)),
                    data: roleCounts.map(r => r.count)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Failed to fetch chart data' });
    }
});

// Middleware to allow faculty and admin
const facultyOrAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Faculty or Admin access required' });
    }
    next();
};

// @route   POST /api/admin/users
// @desc    Create a new user (student/faculty)
// @access  Admin or Faculty
router.post('/users', protect, facultyOrAdmin, async (req, res) => {
    try {
        const { name, email, password, role, rollNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Only allow creating students for faculty, admins can create any role
        const allowedRole = req.user.role === 'admin' ? (role || 'student') : 'student';

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: allowedRole,
            rollNumber: rollNumber || undefined
        });

        console.log(`✅ [Admin] Created new ${allowedRole}: ${email}`);

        res.status(201).json({
            success: true,
            message: `${allowedRole.charAt(0).toUpperCase() + allowedRole.slice(1)} created successfully`,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                rollNumber: newUser.rollNumber,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Faculty or Admin
router.delete('/users/:id', protect, facultyOrAdminView, async (req, res) => {
    try {
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Prevent deleting other admins (optional safety)
        if (user.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Delete user's submissions
        await Submission.deleteMany({ userId: id });

        // Delete user
        await User.findByIdAndDelete(id);

        console.log(`🗑️ [Admin] Deleted user: ${user.email}`);

        res.json({
            success: true,
            message: `User ${user.name} deleted successfully`
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user's role or details
// @access  Admin only
router.put('/users/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, rollNumber } = req.body;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (role && ['student', 'faculty', 'admin'].includes(role)) user.role = role;
        if (rollNumber !== undefined) user.rollNumber = rollNumber;

        await user.save();

        console.log(`✏️ [Admin] Updated user: ${user.email}`);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber
            }
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

export default router;
