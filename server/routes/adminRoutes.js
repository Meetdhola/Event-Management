const express = require('express');
const router = express.Router();
const {
    getUsers,
    toggleUserStatus,
    approveUser,
    rejectUser,
    getAdminEvents,
    getStats,
    getAdminResources,
    updateResource,
    updateUserRole
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect);
router.use(authorize('Admin'));

router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/approve', approveUser);
router.delete('/users/:id/reject', rejectUser);
router.get('/events', getAdminEvents);
router.get('/stats', getStats);
router.get('/resources', getAdminResources);
router.put('/resources/:id', updateResource);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
