const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

async function sendGet(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path,
            method: 'GET',
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body, headers: res.headers }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function testAuthSafety() {
    console.log('--- TEST TASK-SEC-03 & TASK-SEC-04: Auth Middleware Safety ---');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookstore');
    const User = require('../src/models/user.model');
    const countBefore = await User.countDocuments();

    // 1. Test malformed guestId cookie
    const malformedRes = await sendGet('/api/cart/get', {
        'Cookie': 'guestId=invalid_malformed_not_an_id'
    });
    console.log(`1. Malformed guestId status: ${malformedRes.statusCode}`);

    // 2. Test invalid/expired accessToken cookie
    const badTokenRes = await sendGet('/api/cart/get', {
        'Cookie': 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.badpayload.badsig'
    });
    console.log(`2. Bad accessToken status: ${badTokenRes.statusCode}`);

    // 3. Check that User count did not increase with guest junk
    const countAfter = await User.countDocuments();
    console.log(`3. User count before: ${countBefore}, after: ${countAfter}`);

    await mongoose.disconnect();

    const passed = (malformedRes.statusCode === 200) && (badTokenRes.statusCode === 200) && (countAfter === countBefore);
    if (passed) {
        console.log('✅ TEST PASSED: Auth middleware safely handles edge cases without user DB pollution!');
    } else {
        console.log('❌ TEST FAILED: Auth middleware threw error or polluted user DB');
    }
    return passed;
}

testAuthSafety().then(passed => process.exit(passed ? 0 : 1));
