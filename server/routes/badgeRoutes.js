// Badge routes for badge management system
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
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
} from '../controllers/badgeController.js';

const router = express.Router();

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

export default router;
