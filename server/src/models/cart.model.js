const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cartModel = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
                quantity: { type: Number, default: 1 },
                size: { type: String, default: '' },
            },
        ],
        totalPrice: { type: Number, default: 0 }, // 100.000đ
        fullName: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        address: { type: String, default: '' },
        email: { type: String, default: '' },
        finalPrice: { type: Number, default: 0 }, // 90.000đ
        couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'coupon' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('cart', cartModel);
