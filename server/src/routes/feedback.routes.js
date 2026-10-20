const express = require('express');
const router = express.Router();

const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('feedback');

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const feedbackController = require('../controllers/feedback.controller');

router.post('/create', authUser, upload.array('imagesFeedback', 10), asyncHandler(feedbackController.createFeedback));

module.exports = router;
