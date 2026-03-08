const express = require('express');
const router = express.Router();
const {
    getVendorServices,
    updateService,
    getVendorStats,
    deleteService
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Vendor', 'Admin'));

router.get('/services', getVendorServices);
router.post('/services', updateService);
router.delete('/services/:id', deleteService);
router.get('/stats', getVendorStats);

module.exports = router;
