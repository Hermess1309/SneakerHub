const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const flashsaleModel = new Schema(
    {
        title: { type: String, default: 'Flash Sale Chớp Nhoáng' },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date, required: true },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('flashsale', flashsaleModel);
