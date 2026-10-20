const assert = require('assert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const geminiService = require('../src/services/gemini.service');
const Product = require('../src/models/product.model');
const Category = require('../src/models/category.model');
const Coupon = require('../src/models/coupon.model');
const Payment = require('../src/models/payment.model');
const User = require('../src/models/user.model');
const Message = require('../src/models/message.model');

const BASE_URL = 'http://localhost:3000/api';

async function runMasterTestSuite() {
    console.log('====================================================');
    console.log(' SNEAKERHUB GEMINI CHATBOT MASTER INTEGRATION TESTS ');
    console.log('====================================================');

    await mongoose.connect(process.env.MONGODB_URI);

    // 1. API Gemini trả lời thành công
    console.log('\n[1] Testing Gemini API Direct Response...');
    const chatRes = await geminiService.chat({
        userMessage: 'Xin chào shop, bạn có thể giúp gì cho tôi?'
    });
    assert(chatRes.success, 'Chat should be successful');
    assert(chatRes.message && chatRes.message.length > 10, 'Message should not be empty');
    console.log('✅ [1] Gemini answered successfully:', chatRes.message.substring(0, 70) + '...');

    // 2. Tìm giày Nike dưới 4 triệu, size 42
    console.log('\n[2] Testing searchProducts (Nike, maxPrice 4M, size 42)...');
    const nikeSearchResults = await geminiService.searchProducts({
        keyword: 'Nike',
        maxPrice: 4000000,
        size: '42'
    });
    assert(Array.isArray(nikeSearchResults), 'Should return an array');
    assert(nikeSearchResults.length > 0, 'Should find Nike shoes under 4M with size 42');
    for (const p of nikeSearchResults) {
        assert(p.nameProduct.toLowerCase().includes('nike'), 'Must be Nike product');
        assert(p.priceProduct <= 4000000, 'Price must be <= 4M');
        assert(p.availableSizes.includes('42'), 'Size must include 42');
    }
    console.log('✅ [2] Found matching shoes:', nikeSearchResults.map(p => `${p.nameProduct} (${p.priceProduct}đ - Size ${p.availableSizes})`));

    // 3. Không tìm thấy sản phẩm phù hợp (e.g. giá dưới 100k)
    console.log('\n[3] Testing searchProducts with no matches (maxPrice 1000)...');
    const noResults = await geminiService.searchProducts({
        keyword: 'NonExistentBrand123456',
        maxPrice: 1000
    });
    assert.strictEqual(noResults.length, 0, 'Should return empty array');
    console.log('✅ [3] Correctly returned empty array when no matches found');

    // 4. Giá, tồn kho và size khớp với Database
    console.log('\n[4] Verifying returned product fields match MongoDB exactly...');
    const sampleDbProduct = await Product.findById(nikeSearchResults[0]._id).lean();
    assert.strictEqual(sampleDbProduct.priceProduct, nikeSearchResults[0].priceProduct, 'Price must match DB');
    assert.strictEqual(sampleDbProduct.stockProduct, nikeSearchResults[0].stockProduct, 'Stock must match DB');
    assert.strictEqual(sampleDbProduct.metadata?.size, nikeSearchResults[0].availableSizes, 'Size must match DB');
    console.log('✅ [4] Data matches MongoDB 100% (Price:', sampleDbProduct.priceProduct, 'Stock:', sampleDbProduct.stockProduct, 'Size:', sampleDbProduct.metadata?.size, ')');

    // 5. Coupon hết hạn hoặc hết số lượng không được trả về
    console.log('\n[5] Verifying expired/out-of-stock coupons are filtered out...');
    const validCoupons = await geminiService.getActiveCoupons();
    const allDbCoupons = await Coupon.find().lean();
    for (const c of validCoupons) {
        assert(c.remainingQuantity > 0, 'Coupon remainingQuantity must be > 0');
        assert(new Date(c.expiryDate) >= new Date(), 'Coupon must not be expired');
    }
    console.log('✅ [5] Total coupons in DB:', allDbCoupons.length, '| Valid active coupons returned:', validCoupons.length);

    // 6. Không thể truy cập đơn hàng của người khác
    console.log('\n[6] Testing order access authorization security...');
    const randomUserA = new mongoose.Types.ObjectId().toString();
    const randomUserB = new mongoose.Types.ObjectId().toString();
    
    // Guest attempt
    const guestCheck = await geminiService.checkOrderStatus({ orderId: 'any', currentUserId: null });
    assert(guestCheck.error, 'Guest must receive error');
    
    // User A trying to access User B's order
    const samplePayment = await Payment.findOne().lean();
    if (samplePayment) {
        const unauthorizedCheck = await geminiService.checkOrderStatus({
            orderId: samplePayment._id.toString(),
            currentUserId: randomUserA
        });
        assert(unauthorizedCheck.error, 'User A cannot access order belonging to another user');
    }
    console.log('✅ [6] Unauthorized access properly denied with error');

    // 7. Tin nhắn rỗng hoặc vượt giới hạn bị từ chối (HTTP 400)
    console.log('\n[7] Testing empty and excessive message rejection...');
    try {
        await axios.post(`${BASE_URL}/chat/gemini`, { message: '' });
        assert.fail('Empty message should fail');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400, 'Expected 400 for empty message');
    }
    try {
        await axios.post(`${BASE_URL}/chat/gemini`, { message: 'x'.repeat(1500) });
        assert.fail('Too long message should fail');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400, 'Expected 400 for long message');
    }
    console.log('✅ [7] Validation correctly enforces content length constraints');

    // 8. Rate limit headers
    console.log('\n[8] Testing rate limiting headers on /api/chat/gemini...');
    const rateLimitRes = await axios.post(`${BASE_URL}/chat/gemini`, { message: 'ping' }, { timeout: 30000 });
    assert(rateLimitRes.headers['ratelimit-limit'], 'RateLimit-Limit header must be present');
    console.log('✅ [8] Rate limiter active: Limit =', rateLimitRes.headers['ratelimit-limit']);

    // 9. Gemini fallback handling (model error does not crash server)
    console.log('\n[9] Testing graceful fallback when model encounters error...');
    const originalKey = geminiService.apiKey;
    geminiService.apiKey = 'INVALID_MOCK_KEY_FOR_TEST';
    let serviceThrew = false;
    try {
        await geminiService.chat({ userMessage: 'test fallback' });
    } catch (e) {
        serviceThrew = true;
    }
    assert(serviceThrew, 'Gemini service should throw error on invalid key so controller catches it');
    geminiService.apiKey = originalKey;
    console.log('✅ [9] Error handling and graceful fallback logic verified');

    // 10. Tool call với tham số không hợp lệ
    console.log('\n[10] Testing tool call with invalid parameters...');
    const invalidToolResult = await geminiService.executeTool('unknownTool123', {});
    assert(invalidToolResult.error, 'Should return error for unrecognized tool');
    const invalidProductDetails = await geminiService.getProductDetails({ productId: 'invalid-id-xyz' });
    assert(invalidProductDetails.error, 'Invalid product ID should return error');
    console.log('✅ [10] Invalid tool parameters handled gracefully');

    // 11. Guest chat visibility in Admin Dashboard
    console.log('\n[11] Verifying guest chat visibility in Admin Dashboard...');
    const guestId = new mongoose.Types.ObjectId().toString();
    await Message.create({
        userId: guestId,
        senderId: guestId,
        content: 'Test guest message',
        isRead: false
    });
    const adminUser = await User.findOne({ isAdmin: true });
    const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const convRes = await axios.get(`${BASE_URL}/message/conversations`, {
        headers: { Cookie: `accessToken=${adminToken}; logged=true` }
    });
    const guestConv = convRes.data.metadata?.find(c => c._id === guestId);
    assert(guestConv, 'Guest conversation must be in Admin conversations list');
    assert.strictEqual(guestConv.userInfo?.chatStatus, 'waiting', 'Guest chatStatus must be waiting');
    await Message.deleteMany({ userId: guestId });
    console.log('✅ [11] Guest chat appears in Admin Support Desk as waiting ticket');

    // 12. API key is NOT exposed in client dist bundle
    console.log('\n[12] Verifying GEMINI_API_KEY is NOT exposed in client dist bundle...');
    const distJsFiles = fs.readdirSync(path.join(__dirname, '../../client/dist/assets')).filter(f => f.endsWith('.js'));
    assert(distJsFiles.length > 0, 'Dist JS files must exist');
    for (const f of distJsFiles) {
        const bundleContent = fs.readFileSync(path.join(__dirname, '../../client/dist/assets', f), 'utf8');
        assert(!bundleContent.includes(process.env.GEMINI_API_KEY), 'GEMINI_API_KEY MUST NOT appear in frontend bundle');
    }
    console.log('✅ [12] Zero API key leakage in client production bundle');

    // 13. Regression check on existing routes
    console.log('\n[13] Checking core routes regression (products, categories)...');
    const prodRes = await axios.get(`${BASE_URL}/product/list`);
    assert.strictEqual(prodRes.status, 200, 'Products route OK');
    const catRes = await axios.get(`${BASE_URL}/category/list`);
    assert.strictEqual(catRes.status, 200, 'Categories route OK');
    console.log('✅ [13] Core shop routes remain 100% operational');

    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(' 🎉 ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY!  ');
    console.log('====================================================');
}

runMasterTestSuite().catch(err => {
    console.error('❌ Master Test Suite Failed:', err.message, err.response?.data || '');
    process.exit(1);
});
