/**
 * SNEAKERHUB — CATEGORY CLOUDINARY INTEGRATION TESTS
 * Verifies category list, upload-image, creation, update, and deletion on Cloudinary.
 */

const assert = require('assert');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api/category';
const ADMIN_USER_ID = '6a7c416e967fb2386154f2cc'; // Đoàn Thanh Huy (isAdmin: true)

function getAdminCookie() {
    const token = jwt.sign({ id: ADMIN_USER_ID }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return `accessToken=${token}; logged=true`;
}

const SAMPLE_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

async function runTests() {
    console.log('--- TESTING CATEGORY CLOUDINARY INTEGRATION ---\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const adminCookie = getAdminCookie();

    // 1. Verify GET /api/category/list has 100% Cloudinary URLs and 0 sneakerdaily.vn
    console.log('1. Verifying existing categories in database...');
    const listRes = await axios.get(`${API_BASE}/list`);
    assert.strictEqual(listRes.status, 200);
    const categories = listRes.data.metadata || [];
    assert.ok(categories.length > 0, 'Categories list must not be empty');

    let sneakerDailyCount = 0;
    let cloudinaryCount = 0;
    categories.forEach(c => {
        if ((c.imageCategory || '').includes('sneakerdaily.vn')) sneakerDailyCount++;
        if ((c.imageCategory || '').includes('res.cloudinary.com/u1vmfjx6')) cloudinaryCount++;
    });

    console.log(`  - Total categories: ${categories.length}`);
    console.log(`  - Cloudinary URLs: ${cloudinaryCount}/${categories.length}`);
    console.log(`  - SneakerDaily URLs: ${sneakerDailyCount}`);
    assert.strictEqual(sneakerDailyCount, 0, 'Zero sneakerdaily URLs allowed');
    assert.strictEqual(cloudinaryCount, categories.length, 'All categories must have Cloudinary URLs');
    console.log('  ✓ 1. All existing categories verified on Cloudinary.\n');

    // 2. Test Instant Category Logo Upload
    console.log('2. Testing POST /api/category/upload-image...');
    const uploadForm = new FormData();
    uploadForm.append('imageCategory', SAMPLE_PNG, { filename: 'test-brand-logo.png', contentType: 'image/png' });

    const uploadRes = await axios.post(`${API_BASE}/upload-image`, uploadForm, {
        headers: { ...uploadForm.getHeaders(), Cookie: adminCookie }
    });
    assert.strictEqual(uploadRes.status, 200);
    const uploadedLogoUrl = uploadRes.data.metadata?.url;
    assert.ok(uploadedLogoUrl.startsWith('https://res.cloudinary.com/u1vmfjx6/'), 'Must be HTTPS Cloudinary URL');
    assert.ok(uploadedLogoUrl.includes('/sneakerhub/'), 'Must be in folder sneakerhub');
    console.log(`  ✓ 2. Logo uploaded successfully: ${uploadedLogoUrl}\n`);

    // 3. Test Create Category
    console.log('3. Testing POST /api/category/create with Cloudinary logo...');
    const brandName = `Test Brand ${Date.now()}`;
    const createRes = await axios.post(`${API_BASE}/create`, {
        nameCategory: brandName,
        imageCategory: uploadedLogoUrl,
    }, {
        headers: { Cookie: adminCookie }
    });
    assert.strictEqual(createRes.status, 201);
    const createdCat = createRes.data.metadata;
    assert.strictEqual(createdCat.nameCategory, brandName);
    assert.strictEqual(createdCat.imageCategory, uploadedLogoUrl);
    console.log(`  ✓ 3. Brand created successfully: ID = ${createdCat._id}\n`);

    // 4. Test Update Category
    console.log('4. Testing PUT /api/category/update/:id...');
    const updatedName = `${brandName} Updated`;
    const updateRes = await axios.put(`${API_BASE}/update/${createdCat._id}`, {
        nameCategory: updatedName,
        imageCategory: uploadedLogoUrl,
    }, {
        headers: { Cookie: adminCookie }
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.metadata.nameCategory, updatedName);
    console.log(`  ✓ 4. Brand updated successfully.\n`);

    // 5. Test Delete Category
    console.log('5. Testing DELETE /api/category/delete/:id...');
    const deleteRes = await axios.delete(`${API_BASE}/delete/${createdCat._id}`, {
        headers: { Cookie: adminCookie }
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log(`  ✓ 5. Brand deleted successfully.\n`);

    await mongoose.disconnect();
    console.log('========================================================');
    console.log('✅ ALL CATEGORY CLOUDINARY INTEGRATION TESTS PASSED!');
    console.log('========================================================\n');
}

runTests().catch(err => {
    console.error('Test error:', err.response?.data || err.message);
    process.exit(1);
});
