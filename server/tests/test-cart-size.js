const http = require('http');

async function sendRequest(path, method, body, cookie) {
    const data = body ? JSON.stringify(body) : null;
    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            ...(cookie ? { 'Cookie': cookie } : {})
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let resBody = '';
            const setCookie = res.headers['set-cookie'];
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(resBody); } catch (e) { parsed = resBody; }
                resolve({ statusCode: res.statusCode, body: parsed, cookie: setCookie });
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function testCartSize() {
    console.log('--- TEST TASK-SIZE-02: Cart Shoe Size Distinct Entries ---');
    const productId = '6a7c852d23859c359e28fbc4'; // sample product
    
    // 1. Initial cart get to obtain cookie
    const getRes = await sendRequest('/api/cart/get', 'GET');
    const cookie = getRes.cookie ? getRes.cookie.map(c => c.split(';')[0]).join('; ') : '';
    console.log('Session Cookie established');

    // 2. Add size 41
    const add41 = await sendRequest('/api/cart/create', 'POST', { productId, quantity: 1, size: '41' }, cookie);
    console.log('Add size 41 response:', add41.statusCode);

    // 3. Add size 42
    const add42 = await sendRequest('/api/cart/create', 'POST', { productId, quantity: 1, size: '42' }, cookie);
    console.log('Add size 42 response:', add42.statusCode);

    // 4. Verify cart products in get
    const cartRes = await sendRequest('/api/cart/get', 'GET', null, cookie);
    const products = cartRes.body?.metadata?.cart?.products || [];
    console.log('Cart items count:', products.length);
    console.log('Items in cart:', products.map(p => ({ id: p.productId?._id || p.productId, size: p.size, qty: p.quantity })));

    const item41 = products.find(p => p.size === '41');
    const item42 = products.find(p => p.size === '42');

    if (products.length >= 2 && item41 && item42) {
        console.log('✅ TEST PASSED: Distinct shoe sizes are maintained in cart!');
        return true;
    } else {
        console.log('❌ TEST FAILED: Sizes were not saved distinctly in cart');
        return false;
    }
}

testCartSize().then(passed => process.exit(passed ? 0 : 1));
