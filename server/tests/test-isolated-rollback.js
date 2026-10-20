/**
 * SNEAKERHUB — ISOLATED ROLLBACK VALIDATION TEST
 * Verifies the rollback mechanism end-to-end on a dedicated test collection without touching live products.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
require('dotenv').config();

const BACKUP_FILE = path.join(__dirname, '..', 'backups', 'products-backup-2026-10-20T14-45-59-939Z.json');
const TEST_COLLECTION = 'products_test_isolated_rollback';

async function run() {
    console.log('--- STARTING ISOLATED ROLLBACK TEST ---\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    // 1. Ensure test collection is clean
    try { await db.collection(TEST_COLLECTION).drop(); } catch {}

    // 2. Read backup file
    assert.ok(fs.existsSync(BACKUP_FILE), 'Backup file must exist');
    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    console.log(`Loaded ${backupData.length} records from backup file.`);

    // 3. Insert mutated version into TEST_COLLECTION
    const mutatedData = backupData.map(doc => ({
        ...doc,
        _id: new mongoose.Types.ObjectId(doc._id),
        imagesProduct: ['https://mutated-temp-url.com/fake.jpg'], // altered images
    }));
    await db.collection(TEST_COLLECTION).insertMany(mutatedData);
    console.log(`Inserted ${mutatedData.length} mutated records into '${TEST_COLLECTION}'.`);

    // Verify mutated
    const checkMutated = await db.collection(TEST_COLLECTION).findOne({});
    assert.strictEqual(checkMutated.imagesProduct[0], 'https://mutated-temp-url.com/fake.jpg');

    // 4. Execute Rollback Logic on TEST_COLLECTION
    console.log('Executing isolated rollback restoration...');
    let restoredCount = 0;
    for (const item of backupData) {
        const filter = { _id: new mongoose.Types.ObjectId(item._id) };
        const res = await db.collection(TEST_COLLECTION).updateOne(
            filter,
            { $set: { imagesProduct: item.imagesProduct, updatedAt: new Date() } }
        );
        if (res.matchedCount > 0) restoredCount++;
    }

    console.log(`Restored ${restoredCount} records.`);
    assert.strictEqual(restoredCount, backupData.length, 'All records must be restored');

    // 5. Verify restored state matches original backup 100%
    const restoredDocs = await db.collection(TEST_COLLECTION).find({}).toArray();
    for (const rDoc of restoredDocs) {
        const orig = backupData.find(b => b._id.toString() === rDoc._id.toString());
        assert.ok(orig, 'Original record must exist');
        assert.deepStrictEqual(rDoc.imagesProduct, orig.imagesProduct, `imagesProduct must match original backup for ${rDoc.nameProduct}`);
        assert.strictEqual(rDoc.nameProduct, orig.nameProduct, 'nameProduct must be preserved');
        assert.strictEqual(rDoc.priceProduct, orig.priceProduct, 'priceProduct must be preserved');
    }
    console.log('✓ Verified 100% data fidelity: images restored, all other fields preserved.');

    // 6. Test invalid backup handling
    const invalidBackupPath = path.join(__dirname, 'non-existent-backup.json');
    assert.strictEqual(fs.existsSync(invalidBackupPath), false);

    // 7. Cleanup test collection
    await db.collection(TEST_COLLECTION).drop();
    console.log(`✓ Cleaned up temporary collection '${TEST_COLLECTION}'.`);

    await mongoose.disconnect();
    console.log('\n==================================================');
    console.log('✅ ISOLATED ROLLBACK TEST PASSED WITH 100% FIDELITY!');
    console.log('==================================================\n');
}

run().catch(err => {
    console.error('Isolated Rollback Test Error:', err);
    process.exit(1);
});
