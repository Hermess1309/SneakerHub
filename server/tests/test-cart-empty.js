const http = require('http');

async function testCartEmpty() {
    console.log('--- TEST TASK-CART-01: Empty / New Cart Access ---');
    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/cart/get',
        method: 'GET',
        headers: {}
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`Status code: ${res.statusCode}`);
                console.log(`Response body: ${body}`);
                if (res.statusCode === 200) {
                    console.log('✅ TEST PASSED: Returned 200 OK');
                    resolve(true);
                } else {
                    console.log(`❌ TEST FAILED: Expected 200, got ${res.statusCode}`);
                    resolve(false);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

testCartEmpty().then((passed) => {
    process.exit(passed ? 0 : 1);
});
