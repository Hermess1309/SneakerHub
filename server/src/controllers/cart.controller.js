const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');
const couponModel = require('../models/coupon.model');

async function calculateTotalPrice(findCartUser) {
    const allProductIds = findCartUser.products.map((p) => p.productId);

    const productsData = await productModel.find({ _id: { $in: allProductIds } });

    let totalPrice = 0;

    findCartUser.products.forEach((p) => {
        const product = productsData.find((prod) => prod._id.toString() === p.productId.toString());
        if (product) {
            const discount = Number(product.discountProduct) || 0;
            const priceAfterDiscount = Math.round(product.priceProduct - (product.priceProduct * discount) / 100);
            totalPrice += priceAfterDiscount * p.quantity;
        }
    });

    findCartUser.totalPrice = Math.round(totalPrice);
    await findCartUser.save();

    return totalPrice;
}

class CartController {
    async createCart(req, res) {
        const id = req.user;
        const { productId, quantity, size } = req.body;

        if (!id || !productId || !Number(quantity)) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }

        const findProductDb = await productModel.findById(productId);
        if (!findProductDb) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        let findCartUser = await cartModel.findOne({ userId: id });

        if (!findCartUser) {
            findCartUser = await cartModel.create({
                userId: id,
                products: [],
            });
        }

        const normalizedSize = size ? String(size).trim() : '';

        // Match item by both productId and size
        const findProduct = findCartUser.products.find(
            (p) => p.productId.toString() === productId && (p.size || '') === normalizedSize
        );

        const currentQtyInCart = findProduct ? findProduct.quantity : 0;
        const newTotalQty = currentQtyInCart + Number(quantity);

        if (findProductDb.stockProduct < newTotalQty) {
            throw new BadRequestError(`Số lượng sản phẩm trong kho không đủ (chỉ còn ${findProductDb.stockProduct} sản phẩm)`);
        }

        if (findProduct) {
            findProduct.quantity = newTotalQty;
        } else {
            findCartUser.products.push({
                productId,
                quantity: Number(quantity),
                size: normalizedSize,
            });
        }

        await findCartUser.save();
        await calculateTotalPrice(findCartUser);

        return new OK({
            message: 'Thêm sản phẩm vào giỏ hàng thành công',
            metadata: findCartUser,
        }).send(res);
    }

    async updateCart(req, res) {
        const id = req.user;
        const { productId, newQuantity, size } = req.body;

        if (!id || !productId) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }

        const findCartUser = await cartModel.findOne({ userId: id });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        const normalizedSize = size !== undefined ? String(size).trim() : null;

        const findProductInCart = findCartUser.products.find(
            (p) => p.productId.toString() === productId && (normalizedSize !== null ? (p.size || '') === normalizedSize : true)
        );

        if (!findProductInCart) {
            throw new NotFoundError('Sản phẩm không tồn tại trong giỏ hàng');
        }

        const productDb = await productModel.findById(productId);
        if (!productDb) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        // If new quantity = 0 => remove from cart
        if (Number(newQuantity) === 0) {
            findCartUser.products = findCartUser.products.filter(
                (p) => !(p.productId.toString() === productId && (normalizedSize !== null ? (p.size || '') === normalizedSize : true))
            );
            await findCartUser.save();
        } else {
            if (productDb.stockProduct < Number(newQuantity)) {
                throw new BadRequestError(`Số lượng sản phẩm không đủ (chỉ còn ${productDb.stockProduct} sản phẩm)`);
            }
            findProductInCart.quantity = Number(newQuantity);
            await findCartUser.save();
        }

        await calculateTotalPrice(findCartUser);

        return new OK({
            message: 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
            metadata: findCartUser,
        }).send(res);
    }

    async deleteProductInCart(req, res) {
        const id = req.user;
        const { productId } = req.params;
        const { size } = req.query;

        if (!id || !productId) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }

        const findCartUser = await cartModel.findOne({ userId: id });

        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        const normalizedSize = size !== undefined ? String(size).trim() : null;

        const findProductInCart = findCartUser.products.find(
            (p) => p.productId.toString() === productId && (normalizedSize !== null ? (p.size || '') === normalizedSize : true)
        );

        if (!findProductInCart) {
            throw new NotFoundError('Sản phẩm không tồn tại trong giỏ hàng');
        }

        findCartUser.products = findCartUser.products.filter(
            (p) => !(p.productId.toString() === productId && (normalizedSize !== null ? (p.size || '') === normalizedSize : true))
        );
        await findCartUser.save();

        await calculateTotalPrice(findCartUser);

        return new OK({
            message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
            metadata: findCartUser,
        }).send(res);
    }

    async getCartInUser(req, res) {
        const id = req.user;

        let findCartUser = await cartModel.findOne({ userId: id }).populate('products.productId');

        if (!findCartUser) {
            findCartUser = await cartModel.create({
                userId: id,
                products: [],
            });
        }

        const today = new Date();

        const coupons = await couponModel.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
            minPrice: { $lte: findCartUser.totalPrice || 0 },
            quantity: { $gt: 0 },
        });

        return new OK({
            message: 'Lấy giỏ hàng thành công',
            metadata: { cart: findCartUser, coupons },
        }).send(res);
    }

    async updateInfoCart(req, res) {
        const id = req.user;
        const { fullName, phoneNumber, address, email } = req.body;

        if (!id || !fullName || !phoneNumber || !address || !email) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }

        const findCartUser = await cartModel.findOne({ userId: id });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        findCartUser.fullName = fullName;
        findCartUser.phoneNumber = phoneNumber;
        findCartUser.address = address;
        findCartUser.email = email;
        await findCartUser.save();

        return new OK({
            message: 'Cập nhật thông tin giỏ hàng thành công',
            metadata: findCartUser,
        }).send(res);
    }

    async applyCoupon(req, res) {
        const id = req.user;
        const { couponId } = req.body;
        if (!id) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }

        const findCartUser = await cartModel.findOne({ userId: id });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        if (!couponId || couponId === 'null' || couponId === null) {
            findCartUser.couponId = null;
            findCartUser.finalPrice = findCartUser.totalPrice;
            await findCartUser.save();
            return new OK({
                message: 'Hủy áp dụng mã giảm giá thành công',
                metadata: findCartUser,
            }).send(res);
        }

        let findCoupon;
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(couponId)) {
            findCoupon = await couponModel.findById(couponId);
        }
        if (!findCoupon) {
            findCoupon = await couponModel.findOne({ nameCoupon: couponId });
        }

        if (!findCoupon) {
            throw new NotFoundError('Mã giảm giá không tồn tại');
        }

        switch (true) {
            case findCoupon.quantity <= 0:
                throw new BadRequestError('Mã giảm giá đã hết số lượng');
            case findCoupon.startDate > new Date():
                throw new BadRequestError('Mã giảm giá chưa bắt đầu');
            case findCoupon.endDate < new Date():
                throw new BadRequestError('Mã giảm giá đã hết hạn');
            case findCartUser.totalPrice < findCoupon.minPrice:
                throw new BadRequestError('Đơn hàng không đủ điều kiện áp dụng mã giảm giá');
            default:
                break;
        }

        findCartUser.couponId = findCoupon._id;
        findCartUser.finalPrice = Math.round(findCartUser.totalPrice - (findCartUser.totalPrice * findCoupon.discount) / 100);
        await findCartUser.save();

        return new OK({
            message: 'Áp dụng mã giảm giá thành công',
            metadata: findCartUser,
        }).send(res);
    }
}

module.exports = new CartController();
