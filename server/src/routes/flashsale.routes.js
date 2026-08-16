const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');

const flashSaleController = require('../controllers/flashsale.controller');

router.get('/config', asyncHandler(flashSaleController.getFlashSale));
router.post('/set', authAdmin, asyncHandler(flashSaleController.setFlashSale));

module.exports = router;
