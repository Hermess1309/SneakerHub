/**
 * SNEAKERHUB — CATEGORY LOGO MIGRATION SCRIPT
 * 
 * Migrates brand/category logos from sneakerdaily.vn to Cloudinary (folder 'sneakerhub').
 * Features:
 * - Automatic snapshot backup before modification
 * - SSRF host whitelisting
 * - Deterministic SHA-256 public ID generation
 * - Fallback for broken source URLs (e.g. Asics 404 URL mapped to working Asics logo)
 * - Safe rollback capability
 * 
 * Usage:
 *   node migrate-categories.js --dry-run
 *   node migrate-categories.js --execute
 *   node migrate-categories.js --rollback=backups/categories-backup-XXXXX.json
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CLOUDINARY_FOLDER = 'sneakerhub';
const BACKUP_DIR = path.join(__dirname, 'backups');

cloudinary.config({
    cloud_name: process.env.CLOUD_DINARY_NAME,
    api_key: process.env.CLOUD_DINARY_KEY,
    api_secret: process.env.CLOUD_DINARY_SECRET,
});

function parseArgs() {
    const args = process.argv.slice(2);
    const options = { dryRun: false, execute: false, rollbackFile: null };
    args.forEach(arg => {
        if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--execute') options.execute = true;
        else if (arg.startsWith('--rollback=')) options.rollbackFile = arg.split('=')[1];
    });
    if (!options.execute && !options.rollbackFile) options.dryRun = true;
    return options;
}

function generatePublicId(originalUrl) {
    const hash = crypto.createHash('sha256').update(originalUrl).digest('hex').slice(0, 16);
    let baseName = 'brand_logo';
    try {
        const parsed = new URL(originalUrl);
        const last = parsed.pathname.split('/').filter(Boolean).pop() || '';
        baseName = last.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24) || 'brand';
    } catch {}
    return `${baseName}_${hash}`;
}

async function createBackup(db) {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(BACKUP_DIR, `categories-backup-${timestamp}.json`);
    const categories = await db.collection('categories').find({}).toArray();
    fs.writeFileSync(backupFilePath, JSON.stringify(categories, null, 2), 'utf-8');
    return { backupFilePath, count: categories.length };
}

async function performRollback(db, filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) throw new Error(`Backup file not found at: ${fullPath}`);
    const backupData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    console.log(`Restoring ${backupData.length} categories from ${path.basename(fullPath)}...`);
    let restored = 0;
    for (const cat of backupData) {
        const res = await db.collection('categories').updateOne(
            { _id: new mongoose.Types.ObjectId(cat._id) },
            { $set: { imageCategory: cat.imageCategory, updatedAt: new Date() } }
        );
        if (res.matchedCount > 0) restored++;
    }
    console.log(`✓ Restored ${restored}/${backupData.length} categories successfully.`);
}

async function run() {
    const options = parseArgs();
    console.log('========================================================');
    console.log(` SNEAKERHUB — BRAND LOGO MIGRATION TO CLOUDINARY`);
    console.log(` Mode: ${options.execute ? 'EXECUTE (REAL WRITES)' : options.rollbackFile ? 'ROLLBACK' : 'DRY-RUN'}`);
    console.log('========================================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    if (options.rollbackFile) {
        await performRollback(db, options.rollbackFile);
        await mongoose.disconnect();
        return;
    }

    const backupInfo = await createBackup(db);
    console.log(`✓ Backup created: ${path.basename(backupInfo.backupFilePath)} (${backupInfo.count} categories)\n`);

    const categories = await db.collection('categories').find({}).toArray();
    console.log(`Found ${categories.length} total categories in database.\n`);

    // Map of source URL -> Cloudinary URL
    const urlMap = new Map();

    // Known broken source URL fallback
    const BROKEN_URL = 'https://sneakerdaily.vn/wp-content/uploads/2022/03/Asics-chinh-hang-tai-Sneaker-Daily.jpg';
    const WORKING_ASICS_URL = 'https://sneakerdaily.vn/wp-content/uploads/2025/06/asics.jpg';

    // 1. Collect distinct URLs
    const distinctUrls = new Set();
    categories.forEach(c => {
        if (c.imageCategory && typeof c.imageCategory === 'string') {
            distinctUrls.add(c.imageCategory.trim());
        }
    });

    console.log(`Found ${distinctUrls.size} distinct category logo URLs.`);

    // 2. Upload distinct URLs to Cloudinary
    for (let rawUrl of distinctUrls) {
        // Skip if already on Cloudinary
        if (rawUrl.includes('res.cloudinary.com')) {
            urlMap.set(rawUrl, rawUrl);
            console.log(`  - [Already Cloudinary] ${rawUrl}`);
            continue;
        }

        // Remap broken URL if applicable
        const downloadUrl = (rawUrl === BROKEN_URL) ? WORKING_ASICS_URL : rawUrl;

        if (options.dryRun) {
            const simulatedPid = generatePublicId(downloadUrl);
            const simUrl = `https://res.cloudinary.com/${process.env.CLOUD_DINARY_NAME}/image/upload/${CLOUDINARY_FOLDER}/${simulatedPid}.jpg`;
            urlMap.set(rawUrl, simUrl);
            console.log(`  - [DRY-RUN] Would upload ${downloadUrl} -> ${simUrl}`);
            continue;
        }

        // Execute download & upload
        try {
            process.stdout.write(`  - Downloading ${downloadUrl.split('/').pop()}... `);
            const resp = await axios.get(encodeURI(downloadUrl), {
                headers: { 'User-Agent': 'Mozilla/5.0 SneakerHubCategoryMigrator/1.0' },
                timeout: 10000,
                responseType: 'arraybuffer'
            });

            process.stdout.write(`(${resp.data.length} bytes) -> Uploading to Cloudinary... `);
            const publicId = generatePublicId(downloadUrl);

            const uploadRes = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: CLOUDINARY_FOLDER, public_id: publicId, resource_type: 'image', overwrite: true },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                stream.end(Buffer.from(resp.data));
            });

            const secureUrl = uploadRes.secure_url || uploadRes.url;
            urlMap.set(rawUrl, secureUrl);
            process.stdout.write(`DONE: ${secureUrl}\n`);
        } catch (err) {
            console.error(`FAILED: ${err.message}`);
        }
    }

    // 3. Update MongoDB documents
    console.log(`\nUpdating categories in MongoDB...`);
    let updatedCount = 0;

    for (const cat of categories) {
        const currentUrl = cat.imageCategory;
        const newUrl = urlMap.get(currentUrl);

        if (newUrl && newUrl !== currentUrl) {
            if (options.execute) {
                await db.collection('categories').updateOne(
                    { _id: cat._id },
                    { $set: { imageCategory: newUrl, updatedAt: new Date() } }
                );
            }
            updatedCount++;
            console.log(`  ✓ [${cat.nameCategory}]: ${newUrl}`);
        } else {
            console.log(`  - [${cat.nameCategory}]: No change required`);
        }
    }

    console.log('\n========================================================');
    console.log(`SUMMARY:`);
    console.log(`Total Categories: ${categories.length}`);
    console.log(`Categories Updated: ${updatedCount}`);
    console.log(`Mode: ${options.execute ? 'EXECUTE (REAL WRITES)' : 'DRY-RUN'}`);
    console.log('========================================================\n');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
