const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const messageController = require('../controllers/message.controller');

router.get('/', authUser, asyncHandler(messageController.getMessages));
router.post('/', authUser, asyncHandler(messageController.sendMessage));
router.get('/conversations', authAdmin, asyncHandler(messageController.getConversations));

// New routes for accepting, closing, and getting stats
router.post('/accept', authAdmin, asyncHandler(messageController.acceptChat));
router.post('/close', authAdmin, asyncHandler(messageController.closeChat));
router.get('/stats', authAdmin, asyncHandler(messageController.getChatStats));

module.exports = router;
