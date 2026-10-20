/**
 * SNEAKERHUB — AUTOMATED IMAGE MIGRATION SCRIPT
 * 
 * Migrates product images from external sources (e.g. sneakerdaily.vn) to Cloudinary.
 * Preserves image order, handles deduplication, prevents SSRF, and supports rollback.
 * 
 * Usage:
 *   node migrate-images.js --dry-run
 *   node migrate-images.js --dry-run --limit=1
 *   node migrate-images.js --execute --limit=1
 *   node migrate-images.js --execute
 *   node migrate-images.js --rollback=backups/products-backup-YYYY-MM-DD-HHmmss.json
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CLOUDINARY_FOLDER = 'sneakerhub';
const ALLOWED_SOURCE_HOSTS = ['sneakerdaily.vn'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const DOWNLOAD_TIMEOUT_MS = 15000; // 15 seconds
const CACHE_FILE = path.join(__dirname, 'migration-cache.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_DINARY_NAME,
    api_key: process.env.CLOUD_DINARY_KEY,
    api_secret: process.env.CLOUD_DINARY_SECRET,
});

// Helper: Parse CLI Arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: false,
        execute: false,
        limit: null,
        rollbackFile: null,
    };

    args.forEach(arg => {
        if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--execute') options.execute = true;
        else if (arg.startsWith('--limit=')) {
            const val = parseInt(arg.split('=')[1], 10);
            if (!isNaN(val) && val > 0) options.limit = val;
        } else if (arg.startsWith('--rollback=')) {
            options.rollbackFile = arg.split('=')[1];
        } else if (arg.startsWith('--rollback')) {
            const nextArg = args[args.indexOf(arg) + 1];
            if (nextArg && !nextArg.startsWith('--')) options.rollbackFile = nextArg;
        }
    });

    // Default to dry-run if neither execute nor rollback is specified
    if (!options.execute && !options.rollbackFile) {
        options.dryRun = true;
    }

    return options;
}

// Helper: Cache Management
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        } catch {
            return {};
        }
    }
    return {};
}

function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (err) {
        console.error('Warning: Failed to save migration cache:', err.message);
    }
}

// Helper: URL Validation & SSRF Prevention
function isValidSourceUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;

    // Skip already migrated Cloudinary URLs
    if (rawUrl.includes('res.cloudinary.com') || rawUrl.includes('cloudinary.com')) {
        return { isCloudinary: true, valid: true };
    }

    try {
        const parsed = new URL(rawUrl);
        // Only allow HTTP/HTTPS
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return { valid: false, reason: 'Invalid protocol: ' + parsed.protocol };
        }

        // Host validation (SSRF defense)
        const hostname = parsed.hostname.toLowerCase();
        const isAllowed = ALLOWED_SOURCE_HOSTS.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed));
        if (!isAllowed) {
            return { valid: false, reason: `Host ${hostname} not in allowed whitelist` };
        }

        // Reject private/loopback IPs
        if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|localhost|::1)/.test(hostname)) {
            return { valid: false, reason: 'Private/Loopback IP rejected for SSRF protection' };
        }

        return { valid: true, isCloudinary: false };
    } catch {
        return { valid: false, reason: 'Malformed URL' };
    }
}

// Helper: Safe URL Encoding (handles Vietnamese accented characters & Unicode quotes)
function sanitizeUrl(rawUrl) {
    try {
        return encodeURI(rawUrl);
    } catch {
        return rawUrl;
    }
}

// Helper: Generate Deterministic Public ID
function generatePublicId(originalUrl) {
    const hash = crypto.createHash('sha256').update(originalUrl).digest('hex').slice(0, 16);
    let baseName = 'product_img';
    try {
        const parsed = new URL(originalUrl);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1] || '';
        baseName = last.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24) || 'img';
    } catch {
        // fallback to baseName
    }
    return `${baseName}_${hash}`;
}

// Helper: Download Image with Axios
async function downloadImageBuffer(url) {
    const encoded = sanitizeUrl(url);
    const response = await axios.get(encoded, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        timeout: DOWNLOAD_TIMEOUT_MS,
        responseType: 'arraybuffer',
        maxContentLength: MAX_IMAGE_SIZE_BYTES,
    });

    if (response.status !== 200) {
        throw new Error(`HTTP Status ${response.status} received from source`);
    }

    const contentType = (response.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
        throw new Error(`Invalid Content-Type: ${contentType} (expected image/*)`);
    }

    return {
        buffer: Buffer.from(response.data),
        contentType,
        contentLength: response.data.length,
    };
}

// Helper: Upload Buffer to Cloudinary
function uploadBufferToCloudinary(buffer, publicId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: CLOUDINARY_FOLDER,
                public_id: publicId,
                resource_type: 'image',
                overwrite: true,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
}

// Helper: Create Snapshot Backup
async function createBackup(db) {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `products-backup-${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    const products = await db.collection('products').find({}).toArray();
    fs.writeFileSync(backupFilePath, JSON.stringify(products, null, 2), 'utf-8');

    return { backupFilePath, backupFileName, count: products.length };
}

// Rollback Handler
async function performRollback(db, filePath) {
    console.log(`\n==================================================`);
    console.log(`           SNEAKERHUB ROLLBACK OPERATION          `);
    console.log(`==================================================`);

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Backup file not found at: ${fullPath}`);
    }

    let backupData;
    try {
        backupData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (err) {
        throw new Error(`Failed to read/parse backup JSON: ${err.message}`);
    }

    if (!Array.isArray(backupData) || backupData.length === 0) {
        throw new Error('Backup data is empty or not an array');
    }

    console.log(`Found ${backupData.length} products in backup file: ${path.basename(fullPath)}`);

    let restoredCount = 0;
    let errorCount = 0;

    for (const item of backupData) {
        try {
            const filter = { _id: typeof item._id === 'string' ? new mongoose.Types.ObjectId(item._id) : item._id };
            const res = await db.collection('products').updateOne(
                filter,
                { $set: { imagesProduct: item.imagesProduct, updatedAt: new Date() } }
            );

            if (res.matchedCount > 0) {
                restoredCount++;
            } else {
                console.warn(`Warning: Product ID ${item._id} not found in database during restore.`);
                errorCount++;
            }
        } catch (err) {
            console.error(`Error restoring product ${item._id}:`, err.message);
            errorCount++;
        }
    }

    console.log(`\nRollback Summary:`);
    console.log(`- Successfully restored: ${restoredCount} products`);
    console.log(`- Errors / Missing:      ${errorCount}`);
    console.log(`==================================================\n`);

    return { restoredCount, errorCount };
}

// Main Migration Execution
async function run() {
    const options = parseArgs();

    console.log(`\n==================================================`);
    console.log(`   SNEAKERHUB PRODUCT IMAGES CLOUDINARY MIGRATION `);
    console.log(`==================================================`);
    console.log(`Mode:            ${options.rollbackFile ? 'ROLLBACK' : (options.execute ? 'EXECUTE (REAL WRITES)' : 'DRY-RUN (SIMULATION)')}`);
    if (options.limit) console.log(`Limit:           ${options.limit} products`);
    console.log(`Cloudinary Folder: ${CLOUDINARY_FOLDER}`);
    console.log(`Target DB:       ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'N/A'}`);
    console.log(`Timestamp:       ${new Date().toISOString()}`);
    console.log(`==================================================\n`);

    // Verify Cloudinary Credentials
    if (!process.env.CLOUD_DINARY_NAME || !process.env.CLOUD_DINARY_KEY || !process.env.CLOUD_DINARY_SECRET) {
        throw new Error('Missing Cloudinary environment variables in server/.env');
    }

    try {
        const pingResult = await cloudinary.api.ping();
        if (pingResult.status !== 'ok') {
            throw new Error('Cloudinary ping returned status: ' + pingResult.status);
        }
        console.log('✓ Cloudinary connection verified successfully.');
    } catch (err) {
        throw new Error('Cloudinary connection failed: ' + (err.message || err));
    }

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing MONGODB_URI in server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`✓ MongoDB connected successfully to database: "${db.databaseName}"`);

    // Check if Rollback requested
    if (options.rollbackFile) {
        await performRollback(db, options.rollbackFile);
        await mongoose.disconnect();
        return;
    }

    // Fetch Products
    let query = db.collection('products').find({});
    if (options.limit) query = query.limit(options.limit);
    const products = await query.toArray();

    console.log(`Found ${products.length} products to evaluate.\n`);

    // Backup if in Execute Mode
    let backupInfo = null;
    if (options.execute) {
        console.log('Creating pre-migration database snapshot backup...');
        backupInfo = await createBackup(db);
        console.log(`✓ Backup saved to: ${backupInfo.backupFilePath} (${backupInfo.count} documents)\n`);
    }

    // Load Cache
    const cache = loadCache();
    const initialCacheCount = Object.keys(cache).length;
    console.log(`Loaded ${initialCacheCount} existing mapped URLs from cache.\n`);

    // Statistics
    const stats = {
        totalProducts: products.length,
        productsUpdated: 0,
        productsUnchanged: 0,
        productsFailed: 0,
        totalImageSlots: 0,
        imagesAlreadyCloudinary: 0,
        imagesMigratedNew: 0,
        imagesReusedFromCache: 0,
        imagesFailed: 0,
        imagesSkippedInvalid: 0,
    };

    const failedDetails = [];

    // Process Each Product
    for (let pIndex = 0; pIndex < products.length; pIndex++) {
        const product = products[pIndex];
        const pLabel = `[${pIndex + 1}/${products.length}] "${product.nameProduct}" (${product._id})`;
        const originalImages = Array.isArray(product.imagesProduct) ? product.imagesProduct : [];

        if (originalImages.length === 0) {
            console.log(`${pLabel} -> No images found, skipping.`);
            stats.productsUnchanged++;
            continue;
        }

        stats.totalImageSlots += originalImages.length;
        const newImages = [];
        let productModified = false;
        let productHadError = false;

        console.log(`Processing ${pLabel} (${originalImages.length} images):`);

        for (let iIndex = 0; iIndex < originalImages.length; iIndex++) {
            const rawUrl = originalImages[iIndex];
            const validation = isValidSourceUrl(rawUrl);

            // 1. Already Cloudinary
            if (validation.isCloudinary) {
                newImages.push(rawUrl);
                stats.imagesAlreadyCloudinary++;
                console.log(`  - [${iIndex + 1}] Already on Cloudinary: ${rawUrl.slice(0, 60)}...`);
                continue;
            }

            // 2. Invalid or Unsafe URL
            if (!validation.valid) {
                newImages.push(rawUrl); // Preserve original URL on invalid
                stats.imagesSkippedInvalid++;
                console.warn(`  - [${iIndex + 1}] ⚠️ Skipped (${validation.reason}): ${rawUrl}`);
                failedDetails.push({ product: product.nameProduct, url: rawUrl, reason: validation.reason });
                continue;
            }

            // 3. Cached Cloudinary URL
            if (cache[rawUrl] && cache[rawUrl].cloudinaryUrl) {
                newImages.push(cache[rawUrl].cloudinaryUrl);
                stats.imagesReusedFromCache++;
                productModified = true;
                console.log(`  - [${iIndex + 1}] ⚡ Reused from cache: -> ${cache[rawUrl].cloudinaryUrl}`);
                continue;
            }

            // 4. Dry-run Mode simulation
            if (options.dryRun) {
                const simulatedPublicId = generatePublicId(rawUrl);
                newImages.push(`https://res.cloudinary.com/${process.env.CLOUD_DINARY_NAME}/image/upload/${CLOUDINARY_FOLDER}/${simulatedPublicId}`);
                stats.imagesMigratedNew++;
                productModified = true;
                console.log(`  - [${iIndex + 1}] [DRY-RUN] Would download & upload -> public_id: ${simulatedPublicId}`);
                continue;
            }

            // 5. Execute Mode: Real Download & Upload
            try {
                process.stdout.write(`  - [${iIndex + 1}] Downloading ${rawUrl.slice(0, 50)}... `);
                const { buffer, contentType, contentLength } = await downloadImageBuffer(rawUrl);
                process.stdout.write(`(${Math.round(contentLength / 1024)} KB, ${contentType}) -> Uploading... `);

                const publicId = generatePublicId(rawUrl);
                const uploadResult = await uploadBufferToCloudinary(buffer, publicId);

                const secureUrl = uploadResult.secure_url || uploadResult.url;
                newImages.push(secureUrl);

                // Update cache
                cache[rawUrl] = {
                    cloudinaryUrl: secureUrl,
                    publicId: uploadResult.public_id,
                    bytes: uploadResult.bytes,
                    format: uploadResult.format,
                    uploadedAt: new Date().toISOString(),
                };
                saveCache(cache);

                stats.imagesMigratedNew++;
                productModified = true;
                process.stdout.write(`DONE -> ${secureUrl}\n`);
            } catch (err) {
                process.stdout.write(`FAILED: ${err.message}\n`);
                newImages.push(rawUrl); // Preserve original URL on failure
                stats.imagesFailed++;
                productHadError = true;
                failedDetails.push({ product: product.nameProduct, url: rawUrl, reason: err.message });
            }
        }

        // Update MongoDB if modified and in Execute mode
        if (options.execute && productModified) {
            try {
                // Ensure exact length and order maintained
                if (newImages.length !== originalImages.length) {
                    throw new Error(`Length mismatch: original ${originalImages.length} vs new ${newImages.length}`);
                }

                const updateRes = await db.collection('products').updateOne(
                    { _id: product._id },
                    { $set: { imagesProduct: newImages, updatedAt: new Date() } }
                );

                if (updateRes.matchedCount > 0) {
                    console.log(`  ✓ MongoDB updated successfully (${newImages.length} images saved).\n`);
                    stats.productsUpdated++;
                } else {
                    console.error(`  ✗ MongoDB update failed: Document not matched.\n`);
                    stats.productsFailed++;
                }
            } catch (updateErr) {
                console.error(`  ✗ MongoDB update error: ${updateErr.message}\n`);
                stats.productsFailed++;
            }
        } else if (options.dryRun && productModified) {
            console.log(`  [DRY-RUN] Would update MongoDB document with ${newImages.length} new image URLs.\n`);
            stats.productsUpdated++;
        } else {
            console.log(`  No modifications required for this product.\n`);
            stats.productsUnchanged++;
        }

        if (productHadError && !options.execute) {
            stats.productsFailed++;
        }
    }

    // Final Report
    console.log(`\n==================================================`);
    console.log(`           MIGRATION SUMMARY REPORT               `);
    console.log(`==================================================`);
    console.log(`Execution Mode:            ${options.execute ? 'EXECUTE (REAL WRITES)' : 'DRY-RUN'}`);
    console.log(`Total Products Scanned:    ${stats.totalProducts}`);
    console.log(`Products Updated:          ${stats.productsUpdated}`);
    console.log(`Products Unchanged:        ${stats.productsUnchanged}`);
    console.log(`Products with Failures:    ${stats.productsFailed}`);
    console.log(`--------------------------------------------------`);
    console.log(`Total Image Slots:         ${stats.totalImageSlots}`);
    console.log(`Already on Cloudinary:     ${stats.imagesAlreadyCloudinary}`);
    console.log(`Newly Uploaded:            ${stats.imagesMigratedNew}`);
    console.log(`Reused from Cache:         ${stats.imagesReusedFromCache}`);
    console.log(`Failed Downloads/Uploads:  ${stats.imagesFailed}`);
    console.log(`Skipped / Invalid Hosts:   ${stats.imagesSkippedInvalid}`);
    console.log(`Cache Entries Total:       ${Object.keys(cache).length}`);
    if (backupInfo) {
        console.log(`Backup File Created:       ${backupInfo.backupFilePath}`);
    }
    console.log(`==================================================\n`);

    if (failedDetails.length > 0) {
        console.warn('Errors encountered during migration:');
        failedDetails.forEach(f => console.warn(`- Product: "${f.product}" | URL: ${f.url} | Error: ${f.reason}`));
        console.log('');
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB. Process completed.');

    // Exit code: non-zero if failures occurred in execute mode
    if (options.execute && stats.productsFailed > 0) {
        process.exit(1);
    }
}

// Global Error Handler
if (require.main === module) {
    run().catch(err => {
        console.error('\nFATAL MIGRATION ERROR:', err.message || err);
        process.exit(1);
    });
}

module.exports = {
    isValidSourceUrl,
    sanitizeUrl,
    generatePublicId,
    parseArgs,
};
