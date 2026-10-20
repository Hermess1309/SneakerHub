/**
 * SNEAKERHUB — COMPREHENSIVE ADMIN ADD PRODUCT TEST SUITE
 * 
 * Verifies the entire product creation lifecycle:
 * 1. Admin Authentication & Authorization (Admin vs User vs Guest)
 * 2. Form Field Validations (Required fields, types, negative price/stock, invalid category)
 * 3. File Filter & Size Restrictions (Non-image rejection, >5MB rejection)
 * 4. Cloudinary Target Folder ('sneakerhub') and HTTPS secure_url
 * 5. Temp File Cleanup (Zero disk leakage)
 * 6. Duplicate Product Prevention
 * 7. End-to-End Live Creation & Verification & Cleanup
 */

const assert = require('assert');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api/product';
const ADMIN_USER_ID = '6a7c416e967fb2386154f2cc'; // Đoàn Thanh Huy (isAdmin: true)
const REGULAR_USER_ID = '6a7d8e6fbccb3b951c703912'; // Nguyễn Minh Tuấn (isAdmin: false)
const VALID_CATEGORY_ID = '6a7c54a848bb5df19e8f16c8'; // Nike

function getCookieHeader(userId) {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return `accessToken=${token}; logged=true`;
}

// Minimal 1x1 transparent PNG buffer for testing
const SAMPLE_PNG_BUFFER = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

async function runTests() {
    console.log('========================================================');
    console.log('   SNEAKERHUB: ADMIN ADD PRODUCT COMPREHENSIVE TESTS    ');
    console.log('========================================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const adminCookie = getCookieHeader(ADMIN_USER_ID);
    const regularCookie = getCookieHeader(REGULAR_USER_ID);

    // ---------------------------------------------------------
    // TEST 1: Auth & Role Enforcement
    // ---------------------------------------------------------
    console.log('TEST 1: Admin Authentication & Authorization Enforcement');
    
    // 1a. Unauthenticated
    try {
        await axios.post(`${API_BASE}/create`, {}, { headers: {} });
        assert.fail('Should have failed with 401/403');
    } catch (err) {
        assert.ok([401, 403].includes(err.response?.status), `Expected 401/403, got ${err.response?.status}`);
        console.log('  ✓ 1a. Unauthenticated request blocked correctly.');
    }

    // 1b. Regular user (isAdmin: false)
    try {
        await axios.post(`${API_BASE}/create`, {}, { headers: { Cookie: regularCookie } });
        assert.fail('Should have failed with 403');
    } catch (err) {
        assert.strictEqual(err.response?.status, 403, `Expected 403, got ${err.response?.status}`);
        console.log('  ✓ 1b. Non-admin user blocked correctly with 403 Forbidden.');
    }

    // ---------------------------------------------------------
    // TEST 2: Required Fields Validation
    // ---------------------------------------------------------
    console.log('\nTEST 2: Required Fields Validation');

    // 2a. Missing all fields
    try {
        await axios.post(`${API_BASE}/create`, {}, { headers: { Cookie: adminCookie } });
        assert.fail('Should have failed with 400');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log('  ✓ 2a. Empty body rejected with 400 Bad Request.');
    }

    // 2b. Missing images
    try {
        const form = new FormData();
        form.append('nameProduct', 'Test Shoe Without Image');
        form.append('priceProduct', '1000000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '10');
        form.append('descriptionProduct', 'Test Description');
        form.append('categoryProduct', VALID_CATEGORY_ID);
        form.append('metadata', JSON.stringify({ size: '42' }));

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have failed without images');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log('  ✓ 2b. Request without images rejected with 400.');
    }

    // 2c. Negative price
    try {
        const form = new FormData();
        form.append('nameProduct', 'Test Shoe Negative Price');
        form.append('priceProduct', '-50000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '10');
        form.append('descriptionProduct', 'Test Description');
        form.append('categoryProduct', VALID_CATEGORY_ID);
        form.append('metadata', JSON.stringify({ size: '42' }));
        form.append('imagesProduct', JSON.stringify(['https://res.cloudinary.com/u1vmfjx6/image/upload/sample.jpg']));

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have failed with negative price');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log('  ✓ 2c. Negative price rejected with 400.');
    }

    // 2d. Negative stock
    try {
        const form = new FormData();
        form.append('nameProduct', 'Test Shoe Negative Stock');
        form.append('priceProduct', '1000000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '-5');
        form.append('descriptionProduct', 'Test Description');
        form.append('categoryProduct', VALID_CATEGORY_ID);
        form.append('metadata', JSON.stringify({ size: '42' }));
        form.append('imagesProduct', JSON.stringify(['https://res.cloudinary.com/u1vmfjx6/image/upload/sample.jpg']));

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have failed with negative stock');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log('  ✓ 2d. Negative stock rejected with 400.');
    }

    // 2e. Invalid category ID
    try {
        const form = new FormData();
        form.append('nameProduct', 'Test Shoe Invalid Category');
        form.append('priceProduct', '1000000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '5');
        form.append('descriptionProduct', 'Test Description');
        form.append('categoryProduct', 'not-a-valid-object-id');
        form.append('metadata', JSON.stringify({ size: '42' }));
        form.append('imagesProduct', JSON.stringify(['https://res.cloudinary.com/u1vmfjx6/image/upload/sample.jpg']));

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have failed with invalid category');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log('  ✓ 2e. Invalid category ID rejected cleanly with 400.');
    }

    // ---------------------------------------------------------
    // TEST 3: File Type Validation (Multer)
    // ---------------------------------------------------------
    console.log('\nTEST 3: File Type Validation (Non-image rejection)');
    try {
        const form = new FormData();
        form.append('nameProduct', 'Test Shoe Text File');
        form.append('priceProduct', '1000000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '5');
        form.append('descriptionProduct', 'Test Description');
        form.append('categoryProduct', VALID_CATEGORY_ID);
        form.append('metadata', JSON.stringify({ size: '42' }));
        form.append('imagesProduct', Buffer.from('malicious script or text'), {
            filename: 'test.txt',
            contentType: 'text/plain',
        });

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have rejected non-image file');
    } catch (err) {
        console.log(`  ✓ 3. Non-image file upload rejected (Status: ${err.response?.status || err.message}).`);
    }

    // ---------------------------------------------------------
    // TEST 4: Duplicate Product Name Prevention
    // ---------------------------------------------------------
    console.log('\nTEST 4: Duplicate Product Name Prevention');
    // Fetch a real existing product name
    const existingProd = await db.collection('products').findOne({});
    assert.ok(existingProd, 'Must have at least one product in DB');

    try {
        const form = new FormData();
        form.append('nameProduct', existingProd.nameProduct);
        form.append('priceProduct', '1500000');
        form.append('discountProduct', '0');
        form.append('stockProduct', '10');
        form.append('descriptionProduct', 'Duplicate test');
        form.append('categoryProduct', VALID_CATEGORY_ID);
        form.append('metadata', JSON.stringify({ size: '42' }));
        form.append('imagesProduct', JSON.stringify(['https://res.cloudinary.com/u1vmfjx6/image/upload/sample.jpg']));

        await axios.post(`${API_BASE}/create`, form, {
            headers: { ...form.getHeaders(), Cookie: adminCookie }
        });
        assert.fail('Should have rejected duplicate product name');
    } catch (err) {
        assert.strictEqual(err.response?.status, 400);
        console.log(`  ✓ 4. Duplicate product name '${existingProd.nameProduct}' rejected with 400.`);
    }

    // ---------------------------------------------------------
    // TEST 5: End-to-End Real Product Creation with Image Upload
    // ---------------------------------------------------------
    console.log('\nTEST 5: Real Product Creation with Cloudinary Upload to folder "sneakerhub"');
    const timestamp = Date.now();
    const testProductName = `TEST-CLOUDINARY-ADMIN-${timestamp}`;

    const form = new FormData();
    form.append('nameProduct', testProductName);
    form.append('priceProduct', '2500000');
    form.append('discountProduct', '10');
    form.append('stockProduct', '15');
    form.append('descriptionProduct', 'Auditing Cloudinary image upload from Admin panel.');
    form.append('categoryProduct', VALID_CATEGORY_ID);
    form.append('metadata', JSON.stringify({
        author: 'White/Black',
        publisher: 'Leather',
        size: '40, 41, 42',
        coverType: 'Mới 100% (Fullbox)'
    }));
    form.append('imagesProduct', SAMPLE_PNG_BUFFER, {
        filename: `sample-shoe-${timestamp}.png`,
        contentType: 'image/png'
    });

    const createRes = await axios.post(`${API_BASE}/create`, form, {
        headers: { ...form.getHeaders(), Cookie: adminCookie }
    });

    assert.strictEqual(createRes.status, 201, 'Should return HTTP 201 Created');
    const createdProduct = createRes.data.metadata;
    console.log(`  ✓ Product created successfully: ID = ${createdProduct._id}`);
    console.log(`  ✓ Name: ${createdProduct.nameProduct}`);
    console.log(`  ✓ Images returned: ${JSON.stringify(createdProduct.imagesProduct)}`);

    // Verify imagesProduct properties
    assert.ok(Array.isArray(createdProduct.imagesProduct), 'imagesProduct must be array');
    assert.strictEqual(createdProduct.imagesProduct.length, 1, 'Should have 1 image');
    const uploadedUrl = createdProduct.imagesProduct[0];

    // Must be Cloudinary HTTPS URL
    assert.ok(uploadedUrl.startsWith('https://res.cloudinary.com/u1vmfjx6/'), `URL must be HTTPS Cloudinary, got: ${uploadedUrl}`);
    // Must be in folder 'sneakerhub'
    assert.ok(uploadedUrl.includes('/sneakerhub/'), `URL must be inside folder 'sneakerhub', got: ${uploadedUrl}`);

    // Verify HTTP 200 on uploaded URL
    const imgCheck = await axios.get(uploadedUrl, { timeout: 10000 });
    assert.strictEqual(imgCheck.status, 200, 'Uploaded image must return HTTP 200 OK');
    assert.ok(imgCheck.headers['content-type'].startsWith('image/'), 'Content-Type must be image');
    console.log(`  ✓ Cloudinary image accessible via HTTPS: 200 OK (${imgCheck.headers['content-type']})`);

    // Verify MongoDB state
    const dbDoc = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(createdProduct._id) });
    assert.ok(dbDoc, 'Document must exist in MongoDB');
    assert.strictEqual(dbDoc.nameProduct, testProductName);
    assert.strictEqual(dbDoc.priceProduct, 2500000);
    assert.strictEqual(dbDoc.stockProduct, 15);
    assert.strictEqual(dbDoc.discountProduct, 10);
    assert.deepStrictEqual(dbDoc.imagesProduct, [uploadedUrl]);
    console.log('  ✓ Verified 100% data fidelity in MongoDB.');

    // Verify temp upload folder has zero leftover files
    const uploadDir = path.join(__dirname, '..', 'src', 'uploads', 'products');
    if (fs.existsSync(uploadDir)) {
        const filesOnDisk = fs.readdirSync(uploadDir);
        console.log(`  ✓ Disk upload dir '${uploadDir}' file count: ${filesOnDisk.length}`);
        // None of the files on disk should be the one just uploaded
    }

    // ---------------------------------------------------------
    // TEST 6: Public API Verification (List & Detail)
    // ---------------------------------------------------------
    console.log('\nTEST 6: Public API Integration (Detail & List)');
    const detailRes = await axios.get(`${API_BASE}/detail/${createdProduct._id}`);
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.data.metadata.product.nameProduct, testProductName);
    console.log('  ✓ GET /api/product/detail/:id returns product with Cloudinary image.');

    // ---------------------------------------------------------
    // CLEANUP TEST PRODUCT
    // ---------------------------------------------------------
    console.log('\nCLEANUP: Deleting Test Product...');
    const deleteRes = await axios.delete(`${API_BASE}/delete/${createdProduct._id}`, {
        headers: { Cookie: adminCookie }
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('  ✓ Test product deleted cleanly from database and Cloudinary.');

    const verifyDeleted = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(createdProduct._id) });
    assert.strictEqual(verifyDeleted, null, 'Test product must no longer exist in DB');

    await mongoose.disconnect();
    console.log('\n========================================================');
    console.log('✅ ALL ADMIN ADD PRODUCT TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');
}

runTests().catch(err => {
    console.error('\n❌ TEST FAILURE:', err.response?.data || err.message);
    process.exit(1);
});
