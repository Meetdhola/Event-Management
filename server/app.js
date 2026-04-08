const express = require('express');
// const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware'); // Need to create this or use simple one
const connectDB = require('./config/db');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
});

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Attach IO to request for role-specific notifications later
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/volunteer', require('./routes/volunteerRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/hiring', require('./routes/hiringRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/crowd', require('./routes/crowdRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('volunteer_emergency', (data) => {
        console.log('ULTRA-SOS TRIGGERED BY VOLUNTEER:', data);
        // Relay to relevant selective rooms
        io.to('admin_room').emit('volunteer_emergency', data);
        io.to('manager_room').emit('volunteer_emergency', data);
        io.to(`event_${data.eventId}`).emit('emergency_alert', data);
        
        // Final fallback: Global broadcast to everyone to ensure delivery
        io.emit('broadcast_emergency', data);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Simple error handler for now if not creating separate file
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR HANDLER:', err);
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
