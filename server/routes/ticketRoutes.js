const express = require('express');
const router = express.Router();
const { bookTicket, getMyTickets } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/book', bookTicket);
router.get('/my-tickets', getMyTickets);

module.exports = router;
