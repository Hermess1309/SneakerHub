const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userModel = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        role: { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
        chatStatus: { type: String, enum: ['waiting', 'chatting', 'closed'], default: 'closed' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('User', userModel);
