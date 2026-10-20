const createUpload = require('../src/middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');

async function testUploadSecurity() {
    console.log('--- TEST TASK-SEC-01: Upload Security & File Filtering ---');
    try {
        const upload = createUpload('test_upload', 1024 * 1024); // 1MB limit

        // Simulate multer fileFilter test
        let filterRejected = false;
        let filterAccepted = false;

        const fakeTxtFile = { originalname: 'malicious.html', mimetype: 'text/html' };
        upload.fileFilter({}, fakeTxtFile, (err, pass) => {
            if (err || !pass) filterRejected = true;
        });

        const fakeImgFile = { originalname: 'sneaker.jpg', mimetype: 'image/jpeg' };
        upload.fileFilter({}, fakeImgFile, (err, pass) => {
            if (!err && pass) filterAccepted = true;
        });

        console.log(`Malicious HTML rejected: ${filterRejected}`);
        console.log(`Valid JPG accepted: ${filterAccepted}`);

        if (filterRejected && filterAccepted) {
            console.log('✅ TEST PASSED: File filter blocks non-images and accepts valid images!');
            return true;
        } else {
            console.log('❌ TEST FAILED: Filter did not reject non-image or did not accept image');
            return false;
        }
    } catch (e) {
        console.log('❌ TEST FAILED with error:', e.message);
        return false;
    }
}

testUploadSecurity().then(passed => process.exit(passed ? 0 : 1));
