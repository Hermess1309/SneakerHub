const assert = require('assert');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/chat';

async function runRouteTests() {
    console.log('--- Starting Chat API Route Tests ---');

    // Test 1: Empty message rejection (400 Bad Request)
    console.log('Test 1: Empty message rejection');
    try {
        await axios.post(`${BASE_URL}/gemini`, { message: '   ' });
        assert.fail('Should have failed with 400');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400, 'Expected 400 Bad Request');
        console.log('✅ Empty message correctly rejected with 400');
    }

    // Test 2: Message exceeding length limit (> 1000 chars)
    console.log('Test 2: Exceeding length limit');
    try {
        const longMsg = 'a'.repeat(1200);
        await axios.post(`${BASE_URL}/gemini`, { message: longMsg });
        assert.fail('Should have failed with 400');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400, 'Expected 400 Bad Request for excessive length');
        console.log('✅ Excessive length correctly rejected with 400');
    }

    // Test 3: Normal message response
    console.log('Test 3: Valid message response');
    const res = await axios.post(`${BASE_URL}/gemini`, {
        message: 'Chính sách đổi trả của shop như thế nào?'
    });
    assert.strictEqual(res.status, 200, 'Expected 200 OK');
    assert(res.data.metadata?.success, 'Response metadata should have success: true');
    assert(res.data.metadata?.message, 'Response should contain message text');
    assert(res.headers['ratelimit-limit'], 'RateLimit-Limit header should be present');
    console.log('✅ Valid message answered successfully:', res.data.metadata.message.substring(0, 50) + '...');
    console.log('✅ RateLimit headers verified:', res.headers['ratelimit-limit'], 'remaining:', res.headers['ratelimit-remaining']);

    console.log('--- ALL CHAT ROUTE TESTS PASSED ---');
}

runRouteTests().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
});
