const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authUser, authAdmin } = require('../middleware/authUser');

const usersController = require('../controllers/users.controller');

router.post('/register', asyncHandler(usersController.register));
router.post('/login', asyncHandler(usersController.login));
router.get('/auth', authUser, asyncHandler(usersController.authUser));
router.get('/logout', authUser, asyncHandler(usersController.logout));
router.post('/forgot-password', asyncHandler(usersController.forgotPassword));
router.post('/verify-forgot-password', asyncHandler(usersController.verifyForgotPassword));
router.get('/refresh-token', asyncHandler(usersController.refreshToken));

router.put('/update-profile', authUser, asyncHandler(usersController.updateProfile));
router.put('/change-password', authUser, asyncHandler(usersController.changePassword));

router.get('/admin/list', authAdmin, asyncHandler(usersController.getAllUsers));
router.delete('/admin/delete/:id', authAdmin, asyncHandler(usersController.deleteUser));
router.put('/admin/toggle-admin/:id', authAdmin, asyncHandler(usersController.toggleAdmin));

module.exports = router;
