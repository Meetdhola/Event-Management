const Resource = require('../models/Resource');
const Event = require('../models/Event');

// @desc    Get vendor's services
// @route   GET /api/vendor/services
// @access  Private/Vendor
const getVendorServices = async (req, res) => {
    try {
        const services = await Resource.find({ vendor_id: req.user.id });
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add or update vendor service
// @route   POST /api/vendor/services
// @access  Private/Vendor
const updateService = async (req, res) => {
    try {
        const { name, category, base_price, unit, capacity_per_unit, description, is_available, resourceId } = req.body;

        let sanitizedName = name ? name.trim().replace(/\s+/g, ' ') : '';
        if (!sanitizedName) {
            return res.status(400).json({ message: 'Resource designation cannot be empty.' });
        }
        let strippedName = sanitizedName.replace(/\s+/g, '').toLowerCase();

        const vendorServices = await Resource.find({ vendor_id: req.user.id });

        let service;
        if (resourceId) {
            service = await Resource.findById(resourceId);
            if (!service || service.vendor_id.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            if (service.name.replace(/\s+/g, '').toLowerCase() !== strippedName) {
                const existing = vendorServices.find(s => s.name.replace(/\s+/g, '').toLowerCase() === strippedName);
                if (existing) {
                    return res.status(400).json({ message: 'You already have a resource with this or a very similar designation.' });
                }
            }

            Object.assign(service, { name: sanitizedName, category, base_price, unit, capacity_per_unit, description, is_available });
            await service.save();
        } else {
            const existing = vendorServices.find(s => s.name.replace(/\s+/g, '').toLowerCase() === strippedName);
            if (existing) {
                return res.status(400).json({ message: 'You already have a resource with this or a very similar designation.' });
            }

            service = await Resource.create({
                name: sanitizedName, category, base_price, unit, capacity_per_unit, description, is_available,
                vendor_id: req.user.id
            });
        }

        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get vendor statistics
// @route   GET /api/vendor/stats
// @access  Private/Vendor
const getVendorStats = async (req, res) => {
    try {
        const services = await Resource.find({ vendor_id: req.user.id });
        const serviceIds = services.map(s => s._id);

        if (services.length === 0) {
            return res.status(200).json({
                totalServices: 0,
                activeBookings: 0,
                estimatedRevenue: 0,
                monthlyRevenue: 0,
                recentBookings: []
            });
        }

        // Find events using vendor's services
        const bookings = await Event.find({
            'logistics_cart.resource': { $in: serviceIds }
        })
            .populate('event_manager_id', 'name email')
            .sort('-createdAt');

        const totalRevenue = bookings.reduce((sum, event) => {
            const vendorItems = event.logistics_cart.filter(item =>
                item.resource && serviceIds.some(id => id.equals(item.resource))
            );
            return sum + vendorItems.reduce((s, i) => s + ((i.quantity || 0) * (i.resource_price_at_booking || 0)), 0);
        }, 0);

        // Simple monthly breakdown (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRevenue = bookings
            .filter(b => new Date(b.createdAt) >= thirtyDaysAgo)
            .reduce((sum, event) => {
                const vendorItems = event.logistics_cart.filter(item =>
                    item.resource && serviceIds.some(id => id.equals(item.resource))
                );
                return sum + vendorItems.reduce((s, i) => s + ((i.quantity || 0) * (i.resource_price_at_booking || 0)), 0);
            }, 0);

        res.status(200).json({
            totalServices: services.length,
            activeBookings: bookings.length,
            estimatedRevenue: Number(totalRevenue.toFixed(2)),
            monthlyRevenue: Number(recentRevenue.toFixed(2)),
            recentBookings: bookings.slice(0, 5).map(b => ({
                id: b._id,
                name: b.event_name,
                manager: b.event_manager_id?.name,
                date: b.start_date,
                status: b.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Vendor Analytics Error', error: error.message });
    }
};

// @desc    Delete vendor service
// @route   DELETE /api/vendor/services/:id
// @access  Private/Vendor
const deleteService = async (req, res) => {
    try {
        const service = await Resource.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.vendor_id.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Service removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getVendorServices,
    updateService,
    getVendorStats,
    deleteService
};
