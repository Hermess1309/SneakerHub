const express = require('express');
const router = express.Router();

const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('products');

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');

const productController = require('../controllers/product.controller');

router.post('/upload-image', authAdmin, upload.single('image'), asyncHandler(productController.uploadSingleImage));
router.post('/create', authAdmin, upload.array('imagesProduct', 100), asyncHandler(productController.createProduct));
router.get('/list', asyncHandler(productController.getAllProduct));
router.put('/update/:id', authAdmin, upload.array('imagesProduct', 100), asyncHandler(productController.updateProduct));
router.get('/detail/:id', asyncHandler(productController.getProductById));
router.delete('/delete/:id', authAdmin, asyncHandler(productController.deleteProduct));

router.get('/list/:idCategory', asyncHandler(productController.getProductByCategory));

module.exports = router;
