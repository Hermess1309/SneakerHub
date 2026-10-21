const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productModel = new Schema(
    {
        imagesProduct: { type: Array, required: true },
        nameProduct: { type: String, required: true },
        priceProduct: { type: Number, required: true },
        costPrice: { type: Number, default: 0 },
        discountProduct: { type: Number, default: 0 },
        stockProduct: { type: Number, default: 0 },
        descriptionProduct: { type: String, required: true },
        categoryProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('products', productModel);
