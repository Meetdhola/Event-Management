const User = require('../models/User');
const Event = require('../models/Event');
const Resource = require('../models/Resource');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Toggle user status (Admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Approve/Reject manager (Admin only)
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.is_approved = true;
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Reject/Delete registration request (Admin only)
// @route   DELETE /api/admin/users/:id/reject
// @access  Private/Admin
const rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only allow rejection of pending users
        if (user.is_approved) {
            return res.status(400).json({ message: 'Cannot reject already verified users' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Registration request rejected and removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all events (Admin only)
// @route   GET /api/admin/events
// @access  Private/Admin
const getAdminEvents = async (req, res) => {
    try {
        const events = await Event.find({})
            .populate('event_manager_id', 'name email')
            .populate('client_id', 'name email');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalEvents = await Event.countDocuments();
        const pendingApprovals = await User.countDocuments({
            role: { $in: ['EventManager', 'Vendor', 'Volunteer'] },
            is_approved: false
        });

        // Simple revenue mock for now
        const revenue = totalEvents * 100;

        res.status(200).json({
            totalUsers,
            totalEvents,
            pendingApprovals,
            totalRevenue: revenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all resources for admin management
// @route   GET /api/admin/resources
// @access  Private/Admin
const getAdminResources = async (req, res) => {
    try {
        const resources = await Resource.find({});
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update resource parameters
// @route   PUT /api/admin/resources/:id
// @access  Private/Admin
const updateResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        res.status(200).json(resource);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getUsers,
    toggleUserStatus,
    approveUser,
    rejectUser,
    getAdminEvents,
    getStats,
    getAdminResources,
    updateResource,
    updateUserRole
};
