const mongoose = require('mongoose');
require('dotenv').config();
const http = require('http');

async function testCartStock() {
    console.log('--- TEST TASK-CART-02: Cart Add Stock Non-Deduction ---');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookstore');
    
    const Product = require('../src/models/product.model');
    const product = await Product.findOne({ stockProduct: { $gt: 5 } });
    if (!product) {
        console.error('No suitable product found for test');
        process.exit(1);
    }

    const initialStock = product.stockProduct;
    console.log(`Product ID: ${product._id}, Initial Stock: ${initialStock}`);

    // Call POST /api/cart/create
    const postData = JSON.stringify({
        productId: product._id.toString(),
        quantity: 1,
        size: '41'
    });

    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/cart/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        }
    };

    const res = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    console.log(`Add to cart status: ${res.statusCode}`);
    
    // Check product stock in DB
    const updatedProduct = await Product.findById(product._id);
    console.log(`Updated Stock in DB: ${updatedProduct.stockProduct}`);

    let passed = false;
    if (updatedProduct.stockProduct === initialStock) {
        console.log('✅ TEST PASSED: Stock was preserved on add to cart!');
        passed = true;
    } else {
        console.log(`❌ TEST FAILED: Stock changed from ${initialStock} to ${updatedProduct.stockProduct}`);
        // Restore stock for safety
        await Product.findByIdAndUpdate(product._id, { stockProduct: initialStock });
        passed = false;
    }

    await mongoose.disconnect();
    return passed;
}

testCartStock().then(passed => process.exit(passed ? 0 : 1));
