// Badge routes for badge management system
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/badgeController');

// All routes require authentication
router.use(protect);

// Badge CRUD routes
router.route('/')
    .get(getAllBadges)
    .post(createBadge);

router.route('/stats')
    .get(getBadgeStats);

router.route('/my-badges')
    .get(getMyBadges);

router.route('/users')
    .get(getAllUsers);

router.route('/assignments')
    .get(getAllAssignments);

router.route('/assign')
    .post(assignBadge);

router.route('/revoke/:assignmentId')
    .delete(revokeBadge);

router.route('/user/:userId')
    .get(getUserBadges);

router.route('/:id')
    .get(getBadge)
    .put(updateBadge)
    .delete(deleteBadge);

module.exports = router;
