const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageModel = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('messages', messageModel);
