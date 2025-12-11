// Badge controller for managing badges and assignments
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');

// @desc    Create a new badge (Admin only)
// @route   POST /api/badges
// @access  Private/Admin
const createBadge = async (req, res) => {
    try {
        const { name, description, icon, color, rarity, category, points } = req.body;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create badges' });
        }

        // Check if badge with same name exists
        const existingBadge = await Badge.findOne({ name: name.trim() });
        if (existingBadge) {
            return res.status(400).json({ message: 'A badge with this name already exists' });
        }

        const badge = await Badge.create({
            name: name.trim(),
            description: description.trim(),
            icon: icon || 'star',
            color: color || 'gold',
            rarity: rarity || 'common',
            category: category || 'achievement',
            points: points || 10,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Badge created successfully',
            badge
        });
    } catch (error) {
        console.error('Create badge error:', error);
        res.status(500).json({ message: 'Error creating badge', error: error.message });
    }
};

// @desc    Get all badges
// @route   GET /api/badges
// @access  Private
const getAllBadges = async (req, res) => {
    try {
        const badges = await Badge.find({ isActive: true })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: badges.length,
            badges
        });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ message: 'Error fetching badges', error: error.message });
    }
};

// @desc    Get single badge
// @route   GET /api/badges/:id
// @access  Private
const getBadge = async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        res.json({
            success: true,
            badge
        });
    } catch (error) {
        console.error('Get badge error:', error);
        res.status(500).json({ message: 'Error fetching badge', error: error.message });
    }
};

// @desc    Update badge (Admin only)
// @route   PUT /api/badges/:id
// @access  Private/Admin
const updateBadge = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update badges' });
        }

        const badge = await Badge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        res.json({
            success: true,
            message: 'Badge updated successfully',
            badge
        });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Error updating badge', error: error.message });
    }
};

// @desc    Delete badge (Admin only)
// @route   DELETE /api/badges/:id
// @access  Private/Admin
const deleteBadge = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete badges' });
        }

        const badge = await Badge.findByIdAndDelete(req.params.id);

        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        // Also remove all assignments of this badge
        await UserBadge.deleteMany({ badgeId: req.params.id });

        res.json({
            success: true,
            message: 'Badge deleted successfully'
        });
    } catch (error) {
        console.error('Delete badge error:', error);
        res.status(500).json({ message: 'Error deleting badge', error: error.message });
    }
};

// @desc    Assign badge to user (Admin only)
// @route   POST /api/badges/assign
// @access  Private/Admin
const assignBadge = async (req, res) => {
    try {
        const { userId, badgeId, reason } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can assign badges' });
        }

        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate badge exists
        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        // Check if already assigned
        const existingAssignment = await UserBadge.findOne({ userId, badgeId });
        if (existingAssignment) {
            return res.status(400).json({ message: 'User already has this badge' });
        }

        const userBadge = await UserBadge.create({
            userId,
            badgeId,
            awardedBy: req.user._id,
            reason: reason || ''
        });

        const populatedBadge = await UserBadge.findById(userBadge._id)
            .populate('userId', 'name email role')
            .populate('badgeId')
            .populate('awardedBy', 'name');

        res.status(201).json({
            success: true,
            message: 'Badge assigned successfully',
            assignment: populatedBadge
        });
    } catch (error) {
        console.error('Assign badge error:', error);
        res.status(500).json({ message: 'Error assigning badge', error: error.message });
    }
};

// @desc    Revoke badge from user (Admin only)
// @route   DELETE /api/badges/revoke/:assignmentId
// @access  Private/Admin
const revokeBadge = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can revoke badges' });
        }

        const assignment = await UserBadge.findByIdAndDelete(req.params.assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Badge assignment not found' });
        }

        res.json({
            success: true,
            message: 'Badge revoked successfully'
        });
    } catch (error) {
        console.error('Revoke badge error:', error);
        res.status(500).json({ message: 'Error revoking badge', error: error.message });
    }
};

// @desc    Get all badge assignments (Admin only)
// @route   GET /api/badges/assignments
// @access  Private/Admin
const getAllAssignments = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view all assignments' });
        }

        const assignments = await UserBadge.find()
            .populate('userId', 'name email role department')
            .populate('badgeId')
            .populate('awardedBy', 'name')
            .sort({ awardedAt: -1 });

        res.json({
            success: true,
            count: assignments.length,
            assignments
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
};

// @desc    Get user's badges
// @route   GET /api/badges/my-badges
// @access  Private
const getMyBadges = async (req, res) => {
    try {
        const userBadges = await UserBadge.find({ userId: req.user._id, isVisible: true })
            .populate('badgeId')
            .populate('awardedBy', 'name')
            .sort({ awardedAt: -1 });

        res.json({
            success: true,
            count: userBadges.length,
            badges: userBadges
        });
    } catch (error) {
        console.error('Get my badges error:', error);
        res.status(500).json({ message: 'Error fetching your badges', error: error.message });
    }
};

// @desc    Get all users (for badge assignment dropdown)
// @route   GET /api/badges/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view all users' });
        }

        const users = await User.find()
            .select('name email role department rollNumber employeeId')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// @desc    Get badges for a specific user (Admin only)
// @route   GET /api/badges/user/:userId
// @access  Private/Admin
const getUserBadges = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view user badges' });
        }

        const userBadges = await UserBadge.find({ userId: req.params.userId })
            .populate('badgeId')
            .populate('awardedBy', 'name')
            .sort({ awardedAt: -1 });

        res.json({
            success: true,
            count: userBadges.length,
            badges: userBadges
        });
    } catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({ message: 'Error fetching user badges', error: error.message });
    }
};

// @desc    Get badge statistics (Admin only)
// @route   GET /api/badges/stats
// @access  Private/Admin
const getBadgeStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view badge stats' });
        }

        const totalBadges = await Badge.countDocuments({ isActive: true });
        const totalAssignments = await UserBadge.countDocuments();

        // Get badges by rarity
        const badgesByRarity = await Badge.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$rarity', count: { $sum: 1 } } }
        ]);

        // Get top earners
        const topEarners = await UserBadge.aggregate([
            { $group: { _id: '$userId', badgeCount: { $sum: 1 } } },
            { $sort: { badgeCount: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    badgeCount: 1,
                    'user.name': 1,
                    'user.email': 1,
                    'user.role': 1
                }
            }
        ]);

        // Most awarded badges
        const mostAwarded = await UserBadge.aggregate([
            { $group: { _id: '$badgeId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'badges', localField: '_id', foreignField: '_id', as: 'badge' } },
            { $unwind: '$badge' }
        ]);

        res.json({
            success: true,
            stats: {
                totalBadges,
                totalAssignments,
                badgesByRarity,
                topEarners,
                mostAwarded
            }
        });
    } catch (error) {
        console.error('Get badge stats error:', error);
        res.status(500).json({ message: 'Error fetching badge stats', error: error.message });
    }
};

module.exports = {
    createBadge,
    getAllBadges,
    getBadge,
    updateBadge,
    deleteBadge,
    assignBadge,
    revokeBadge,
    getAllAssignments,
    getMyBadges,
    getAllUsers,
    getUserBadges,
    getBadgeStats
};
