const assert = require('assert');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// We require the service which does not exist yet (TDD Red)
let geminiService;
try {
    geminiService = require('../src/services/gemini.service');
} catch (e) {
    console.log('TDD Red: gemini.service not found as expected:', e.message);
}

async function runTests() {
    console.log('--- Starting Gemini Service Unit Tests ---');

    await mongoose.connect(process.env.MONGODB_URI);

    // Test 1: Tool searchProducts
    console.log('Test 1: searchProducts tool');
    assert(geminiService && typeof geminiService.searchProducts === 'function', 'geminiService.searchProducts should be a function');
    const nikeProducts = await geminiService.searchProducts({ keyword: 'Nike', limit: 3 });
    assert(Array.isArray(nikeProducts), 'Result should be an array');
    assert(nikeProducts.length > 0, 'Should find Nike products');
    assert(nikeProducts[0].nameProduct.toLowerCase().includes('nike'), 'Product name should include Nike');
    console.log('✅ searchProducts found:', nikeProducts.length, 'shoes');

    // Test 2: Tool getProductDetails
    console.log('Test 2: getProductDetails tool');
    const firstProd = nikeProducts[0];
    const details = await geminiService.getProductDetails({ productId: firstProd._id.toString() });
    assert(details && details._id, 'Details should return product');
    assert(details.priceProduct > 0, 'Price should be positive number');
    assert(details.metadata, 'Product should have metadata');
    console.log('✅ getProductDetails returned shoe:', details.nameProduct, 'Price:', details.priceProduct);

    // Test 3: Tool getActiveCoupons
    console.log('Test 3: getActiveCoupons tool');
    const coupons = await geminiService.getActiveCoupons();
    assert(Array.isArray(coupons), 'Coupons should be an array');
    // Any returned coupon must have quantity > 0 and not expired
    for (const c of coupons) {
        assert(c.quantity > 0, 'Coupon must have stock > 0');
        assert(new Date(c.endDate) >= new Date(), 'Coupon must not be expired');
    }
    console.log('✅ getActiveCoupons verified:', coupons.length, 'valid coupons in DB');

    // Test 4: Tool getStorePolicies
    console.log('Test 4: getStorePolicies tool');
    const returnPolicy = await geminiService.getStorePolicies({ topic: 'return_policy' });
    assert(returnPolicy && returnPolicy.includes('đổi trả'), 'Return policy must contain return info');
    console.log('✅ getStorePolicies return policy verified');

    // Test 5: Tool checkOrderStatus security
    console.log('Test 5: checkOrderStatus tool authorization');
    // Guest or null user cannot access orders
    const guestOrder = await geminiService.checkOrderStatus({ orderId: 'any', currentUserId: null });
    assert(guestOrder.error && guestOrder.error.includes('đăng nhập'), 'Guest should receive login prompt');
    
    // User cannot access another user's order
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const otherUserOrder = await geminiService.checkOrderStatus({ orderId: '6a7cb65a2b1a01c7519b5648', currentUserId: fakeUserId });
    assert(otherUserOrder.error, 'Should not access order belonging to different user');
    console.log('✅ checkOrderStatus authorization check passed');

    console.log('--- ALL GEMINI SERVICE TESTS PASSED ---');
    await mongoose.disconnect();
}

runTests().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
});
