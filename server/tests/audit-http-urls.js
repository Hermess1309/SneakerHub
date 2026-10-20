/**
 * SNEAKERHUB — AUTOMATED HTTP VALIDATION FOR ALL CLOUDINARY URLS
 * Performs concurrent non-destructive HTTP verification of all migrated image URLs.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONCURRENCY_LIMIT = 10;
const TIMEOUT_MS = 10000;
const OUTPUT_FILE = path.join(__dirname, '..', 'backups', 'http-urls-audit.json');

async function checkUrl(url) {
    const result = {
        url,
        validStructure: false,
        folder: null,
        status: null,
        contentType: null,
        contentLength: null,
        error: null,
    };

    try {
        const parsed = new URL(url);
        result.validStructure = parsed.hostname === 'res.cloudinary.com' && parsed.pathname.includes('/u1vmfjx6/image/upload/');
        result.folder = parsed.pathname.includes('/sneakerhub/') ? 'sneakerhub' : 'other';

        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SneakerHubAuditor/1.0',
            },
            timeout: TIMEOUT_MS,
            maxRedirects: 3,
        });

        result.status = res.status;
        result.contentType = res.headers['content-type'] || '';
        result.contentLength = parseInt(res.headers['content-length'] || '0', 10);
    } catch (err) {
        if (err.response) {
            result.status = err.response.status;
            result.contentType = err.response.headers['content-type'];
            result.error = `HTTP Error ${err.response.status}`;
        } else {
            result.error = err.message;
        }
    }

    return result;
}

// Concurrency pool runner
async function runPool(items, limit, workerFn) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const currentIdx = index++;
            const item = items[currentIdx];
            const res = await workerFn(item);
            results[currentIdx] = res;
            if ((currentIdx + 1) % 50 === 0 || currentIdx + 1 === items.length) {
                process.stdout.write(`  [${currentIdx + 1}/${items.length}] URLs verified...\n`);
            }
        }
    }

    const workers = Array(Math.min(limit, items.length)).fill(0).map(() => worker());
    await Promise.all(workers);
    return results;
}

async function run() {
    console.log('--- STARTING ALL-URLS HTTP ACCESSIBILITY AUDIT ---\n');
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await mongoose.connection.db.collection('products').find({}).toArray();

    const uniqueUrlSet = new Set();
    products.forEach(p => {
        (p.imagesProduct || []).forEach(u => uniqueUrlSet.add(u));
    });

    const uniqueUrls = Array.from(uniqueUrlSet);
    console.log(`Found ${products.length} products and ${uniqueUrls.length} distinct image URLs to audit.\n`);

    const results = await runPool(uniqueUrls, CONCURRENCY_LIMIT, checkUrl);

    let successCount = 0;
    let failedCount = 0;
    let nonImageCount = 0;
    let wrongFolderCount = 0;

    results.forEach(r => {
        const isOk = r.status === 200 && r.contentType && r.contentType.startsWith('image/') && r.folder === 'sneakerhub';
        if (isOk) successCount++;
        else failedCount++;

        if (r.contentType && !r.contentType.startsWith('image/')) nonImageCount++;
        if (r.folder !== 'sneakerhub') wrongFolderCount++;
    });

    console.log('\n=== HTTP ACCESSIBILITY AUDIT SUMMARY ===');
    console.log(`Total Unique URLs Audited:    ${uniqueUrls.length}`);
    console.log(`Successfully Accessible (200): ${successCount} (${Math.round(successCount / uniqueUrls.length * 100)}%)`);
    console.log(`Failed / Inaccessible URLs:   ${failedCount}`);
    console.log(`Non-image Responses:          ${nonImageCount}`);
    console.log(`Non-sneakerhub Folder URLs:   ${wrongFolderCount}`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nDetailed verification results saved to: ${OUTPUT_FILE}`);

    await mongoose.disconnect();

    if (failedCount > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Audit fatal error:', err);
    process.exit(1);
});
