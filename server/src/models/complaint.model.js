const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const complaintModel = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'payment', required: true },
        reason: { type: String, required: true },
        content: { type: String, required: true },
        images: { type: Array, default: [] },
        status: { 
            type: String, 
            enum: ['pending', 'processing', 'resolved', 'rejected'], 
            default: 'pending' 
        },
        adminResponse: { type: String, default: '' }
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('complaint', complaintModel);
