const express = require('express');
const router = express.Router();

const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('categorys');

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');

const categoryController = require('../controllers/category.controller');

router.post('/upload-image', authAdmin, upload.single('imageCategory'), asyncHandler(categoryController.uploadCategoryImage));
router.post('/create', authAdmin, upload.single('imageCategory'), asyncHandler(categoryController.createCategory));
router.get('/list', asyncHandler(categoryController.getAllCategory));
router.put('/update/:id', authAdmin, upload.single('imageCategory'), asyncHandler(categoryController.updateCategory));
router.delete('/delete/:id', authAdmin, asyncHandler(categoryController.deleteCategory));

module.exports = router;
