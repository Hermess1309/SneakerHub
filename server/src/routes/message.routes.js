const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const messageController = require('../controllers/message.controller');

router.get('/', authUser, asyncHandler(messageController.getMessages));
router.post('/', authUser, asyncHandler(messageController.sendMessage));
router.get('/conversations', authAdmin, asyncHandler(messageController.getConversations));

module.exports = router;
