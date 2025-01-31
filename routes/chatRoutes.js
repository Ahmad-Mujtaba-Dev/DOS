const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route to handle chat messages
router.post('/', chatController.sendMessage);

module.exports = router; 