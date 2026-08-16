const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'src/uploads/complaints';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const { authUser } = require('../middleware/authUser'); // We can reuse authUser for client side submissions!

const complaintController = require('../controllers/complaint.controller');

// Customer endpoints
router.post('/create', authUser, upload.array('images', 5), asyncHandler(complaintController.createComplaint));
router.get('/user-list', authUser, asyncHandler(complaintController.getUserComplaints));

// Admin & Staff endpoints (authAdmin blocks standard users)
router.get('/list', authAdmin, asyncHandler(complaintController.getAllComplaints));
router.put('/respond/:id', authAdmin, asyncHandler(complaintController.respondToComplaint));

module.exports = router;
