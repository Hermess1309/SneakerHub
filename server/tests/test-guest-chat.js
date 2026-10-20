const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Message = require('../src/models/message.model');
const User = require('../src/models/user.model');

const BASE_URL = 'http://localhost:3000/api/message';

async function runGuestChatTests() {
    console.log('--- Starting Guest Chat Fix Tests ---');

    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Find or create admin user for token
    const adminUser = await User.findOne({ isAdmin: true });
    assert(adminUser, 'Admin user must exist in DB');
    const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const adminHeaders = {
        Cookie: `accessToken=${adminToken}; logged=true`
    };

    // 2. Generate new unique guestId
    const testGuestId = new mongoose.Types.ObjectId().toString();
    const guestHeaders = {
        Cookie: `guestId=${testGuestId}`
    };

    console.log('Step 1: Guest sends a message');
    const sendRes = await axios.post(BASE_URL, { content: 'Xin chào, tôi là khách vãng lai test' }, { headers: guestHeaders });
    assert.strictEqual(sendRes.status, 201, 'Guest message should be created');

    console.log('Step 2: Admin retrieves conversations list');
    const convRes = await axios.get(`${BASE_URL}/conversations`, { headers: adminHeaders });
    assert.strictEqual(convRes.status, 200, 'Conversations should return 200');
    
    const conversations = convRes.data.metadata || [];
    const guestConv = conversations.find(c => c._id === testGuestId);
    assert(guestConv, 'Guest conversation MUST be present in conversations list');
    assert(guestConv.userInfo, 'Guest conversation MUST have userInfo populated');
    assert(guestConv.userInfo.fullName.includes('Khách vãng lai'), 'Guest name should indicate Khách vãng lai');
    assert.strictEqual(guestConv.userInfo.chatStatus, 'waiting', 'Guest chatStatus should be waiting initially');
    console.log('✅ Guest conversation correctly identified and visible as waiting');

    console.log('Step 3: Admin accepts guest chat');
    const acceptRes = await axios.post(`${BASE_URL}/accept`, { userId: testGuestId }, { headers: adminHeaders });
    assert.strictEqual(acceptRes.status, 200, 'Accept chat should return 200');

    const convResAfterAccept = await axios.get(`${BASE_URL}/conversations`, { headers: adminHeaders });
    const guestConvAfterAccept = (convResAfterAccept.data.metadata || []).find(c => c._id === testGuestId);
    assert(guestConvAfterAccept, 'Guest conversation should still be present');
    assert.strictEqual(guestConvAfterAccept.userInfo.chatStatus, 'chatting', 'Guest chatStatus should now be chatting');
    console.log('✅ Guest chat status successfully transitioned to chatting');

    console.log('Step 4: Admin closes guest chat');
    const closeRes = await axios.post(`${BASE_URL}/close`, { userId: testGuestId }, { headers: adminHeaders });
    assert.strictEqual(closeRes.status, 200, 'Close chat should return 200');

    const convResAfterClose = await axios.get(`${BASE_URL}/conversations`, { headers: adminHeaders });
    const guestConvAfterClose = (convResAfterClose.data.metadata || []).find(c => c._id === testGuestId);
    assert(guestConvAfterClose, 'Guest conversation should still be present');
    assert.strictEqual(guestConvAfterClose.userInfo.chatStatus, 'closed', 'Guest chatStatus should now be closed');
    console.log('✅ Guest chat status successfully transitioned to closed');

    // Clean up test messages
    await Message.deleteMany({ userId: testGuestId });
    await mongoose.disconnect();

    console.log('--- ALL GUEST CHAT TESTS PASSED ---');
}

runGuestChatTests().catch(err => {
    console.error('❌ Test failed:', err.message, err.response?.data || '');
    process.exit(1);
});
