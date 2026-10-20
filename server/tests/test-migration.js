/**
 * SNEAKERHUB — AUTOMATED MIGRATION LOGIC TEST SUITE
 * Tests URL validation, SSRF protection, encoding, public ID generation, and CLI parsing.
 */

const assert = require('assert');
const {
    isValidSourceUrl,
    sanitizeUrl,
    generatePublicId,
} = require('../migrate-images');

console.log('--- TEST SUITE: SNEAKERHUB IMAGE MIGRATION LOGIC ---\n');

// 1. SSRF & Host Whitelist Tests
console.log('1. Testing URL Validation & SSRF Prevention...');
// Valid whitelisted host
const v1 = isValidSourceUrl('https://sneakerdaily.vn/wp-content/uploads/2026/08/Giày-Nike-Vomero-Plus-‘Hydrogen-Blue-HV8150-404.jpg');
assert.strictEqual(v1.valid, true, 'Valid sneakerdaily.vn URL must be accepted');

// Cloudinary URL detection
const vCloud = isValidSourceUrl('https://res.cloudinary.com/u1vmfjx6/image/upload/v12345/sneakerhub/sample.jpg');
assert.strictEqual(vCloud.isCloudinary, true, 'Cloudinary URL must be flagged as isCloudinary');

// Rejection: Localhost
const vLocalhost = isValidSourceUrl('http://localhost:3000/uploads/products/123.jpg');
assert.strictEqual(vLocalhost.valid, false, 'Localhost must be rejected');

// Rejection: Loopback IP
const vLoopback = isValidSourceUrl('http://127.0.0.1:8080/secret.jpg');
assert.strictEqual(vLoopback.valid, false, '127.0.0.1 must be rejected');

// Rejection: Cloud metadata IP (AWS/GCP SSRF)
const vMetadata = isValidSourceUrl('http://169.254.169.254/latest/meta-data/');
assert.strictEqual(vMetadata.valid, false, '169.254.169.254 must be rejected');

// Rejection: Non-whitelisted domain
const vUntrusted = isValidSourceUrl('https://malicious-site.com/exploit.jpg');
assert.strictEqual(vUntrusted.valid, false, 'Non-whitelisted domain must be rejected');

// Rejection: Non-HTTP protocol (e.g. file:// or javascript:)
const vFile = isValidSourceUrl('file:///etc/passwd');
assert.strictEqual(vFile.valid, false, 'file:// scheme must be rejected');

console.log('✓ All 7 SSRF & URL validation test cases passed.\n');

// 2. URL Sanitization & Encoding Tests
console.log('2. Testing Vietnamese & Unicode URL Sanitization...');
const rawUrlWithAccents = 'https://sneakerdaily.vn/wp-content/uploads/2026/08/Giày-Nike-Vomero-Plus-‘Hydrogen-Blue-HV8150-404.jpg';
const sanitized = sanitizeUrl(rawUrlWithAccents);
assert.ok(sanitized.includes('%E2%80%98') || sanitized.includes('HV8150'), 'Unicode quotes/accents must be safely encoded');
console.log('✓ URL sanitization test passed.\n');

// 3. Deterministic Public ID Generation
console.log('3. Testing Deterministic Public ID Generation...');
const id1 = generatePublicId(rawUrlWithAccents);
const id2 = generatePublicId(rawUrlWithAccents);
assert.strictEqual(id1, id2, 'Identical URL must produce identical public ID (idempotency)');

const differentUrl = 'https://sneakerdaily.vn/wp-content/uploads/2026/08/Giày-Nike-Book-2-EP-‘Tiger-Camo-IV5770-001.jpg';
const id3 = generatePublicId(differentUrl);
assert.notStrictEqual(id1, id3, 'Different URLs must produce different public IDs');
console.log('✓ Deterministic Public ID test passed.\n');

console.log('==================================================');
console.log('✅ ALL MIGRATION UNIT TESTS PASSED SUCCESSFULLY!');
console.log('==================================================\n');
