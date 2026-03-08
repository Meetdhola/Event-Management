const express = require('express');
// const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware'); // Need to create this or use simple one
const connectDB = require('./config/db');
const cors = require('cors');

// Connect to Database
connectDB();

const app = express();

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

// Simple error handler for now if not creating separate file
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
