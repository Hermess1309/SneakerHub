/**
 * SNEAKERHUB — CLOUDINARY ADMIN API ASSETS RECONCILIATION
 * Queries Cloudinary Admin API to list assets in folder 'sneakerhub' and matches with MongoDB & Cache.
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_DINARY_NAME,
    api_key: process.env.CLOUD_DINARY_KEY,
    api_secret: process.env.CLOUD_DINARY_SECRET,
});

async function run() {
    console.log('--- CLOUDINARY ADMIN API ASSET RECONCILIATION ---\n');

    // 1. Fetch all resources in folder 'sneakerhub/' with pagination
    let allCloudinaryResources = [];
    let nextCursor = null;

    do {
        const options = {
            type: 'upload',
            prefix: 'sneakerhub/',
            max_results: 500,
        };
        if (nextCursor) options.next_cursor = nextCursor;

        const res = await cloudinary.api.resources(options);
        allCloudinaryResources = allCloudinaryResources.concat(res.resources || []);
        nextCursor = res.next_cursor;
    } while (nextCursor);

    console.log(`Cloudinary API returned ${allCloudinaryResources.length} total resources in 'sneakerhub/' folder.\n`);

    const cloudinaryPublicIdMap = new Map();
    allCloudinaryResources.forEach(r => {
        cloudinaryPublicIdMap.set(r.public_id, r);
    });

    // 2. Read MongoDB products
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await mongoose.connection.db.collection('products').find({}).toArray();

    const mongoPublicIds = new Set();
    const mongoUrls = [];

    products.forEach(p => {
        (p.imagesProduct || []).forEach(url => {
            mongoUrls.push(url);
            // Extract public_id from Cloudinary URL
            // e.g. https://res.cloudinary.com/u1vmfjx6/image/upload/v1792507561/sneakerhub/Gia_CC_80y-Nike-Vomero-P_f1103ba20a597e73.jpg
            const match = url.match(/\/image\/upload\/(?:v\d+\/)?(sneakerhub\/[^.]+)/);
            if (match && match[1]) {
                mongoPublicIds.add(match[1]);
            }
        });
    });

    // 3. Read migration-cache.json
    const cachePath = path.join(__dirname, '..', 'migration-cache.json');
    let cacheData = {};
    if (fs.existsSync(cachePath)) {
        cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
    const cacheCount = Object.keys(cacheData).length;

    // 4. Reconciliation
    let missingInCloudinary = 0;
    mongoPublicIds.forEach(pid => {
        if (!cloudinaryPublicIdMap.has(pid)) {
            missingInCloudinary++;
            console.warn(`Missing in Cloudinary: ${pid}`);
        }
    });

    let unreferencedInMongo = 0;
    allCloudinaryResources.forEach(r => {
        if (!mongoPublicIds.has(r.public_id)) {
            unreferencedInMongo++;
        }
    });

    console.log('=== ASSET RECONCILIATION SUMMARY ===');
    console.log(`Total Image Slots in MongoDB:     ${mongoUrls.length}`);
    console.log(`Unique Public IDs in MongoDB:      ${mongoPublicIds.size}`);
    console.log(`Cache Entries (migration-cache):   ${cacheCount}`);
    console.log(`Cloudinary Assets in 'sneakerhub': ${allCloudinaryResources.length}`);
    console.log(`Missing Assets in Cloudinary:      ${missingInCloudinary}`);
    console.log(`Unreferenced Assets in Cloudinary: ${unreferencedInMongo}`);

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Cloudinary API Error:', err.message || err);
    process.exit(1);
});
