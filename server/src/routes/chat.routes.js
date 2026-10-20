const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const chatController = require('../controllers/chat.controller');

// Rate limiter: 30 requests per minute per IP
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau 1 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/gemini', chatLimiter, authUser, asyncHandler(chatController.handleGeminiChat));

module.exports = router;
