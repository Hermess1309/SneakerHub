const cartModel = require('../models/cart.model');
const paymentModel = require('../models/payment.model');
const couponModel = require('../models/coupon.model');

const { NotFoundError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const vnpayService = require('../services/vnpay.service');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const crypto = require('crypto');
const https = require('https');

function generatePayID() {
    // Tạo ID thanh toán bao gồm cả giây để tránh trùng lặp
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

const productModel = require('../models/product.model');

const decreaseProductStock = async (products) => {
    try {
        for (const item of products) {
            if (item.productId) {
                const prod = await productModel.findById(item.productId);
                if (prod) {
                    prod.stockProduct = Math.max(0, (prod.stockProduct || 0) - (item.quantity || 1));
                    if (item.size && prod.metadata && prod.metadata.sizeStock) {
                        const cur = prod.metadata.sizeStock[item.size] || 0;
                        prod.metadata.sizeStock[item.size] = Math.max(0, cur - (item.quantity || 1));
                        prod.markModified('metadata');
                    }
                    await prod.save();
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi trừ kho sản phẩm:', error);
    }
};

class PaymentController {
    async createPayment(req, res) {
        const { typePayment } = req.body;
        const id = req.user;

        const findCartUser = await cartModel.findOne({ userId: id });

        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        if (findCartUser.products.length === 0) {
            throw new BadRequestError('Giỏ hàng không có sản phẩm');
        }

        if (typePayment === 'cod') {
            const newPayment = await paymentModel.create({
                userId: id,
                products: findCartUser.products,
                totalPrice: findCartUser.totalPrice,
                fullName: findCartUser.fullName,
                phoneNumber: findCartUser.phoneNumber,
                address: findCartUser.address,
                email: findCartUser.email,
                finalPrice: findCartUser.finalPrice,
                couponId: findCartUser.couponId,
                paymentMethod: 'cod',
                status: 'pending',
            });

            await findCartUser.deleteOne();
            await cartModel.create({
                userId: id,
                products: [],
            });

            await decreaseProductStock(findCartUser.products);
            await couponModel.findByIdAndUpdate(findCartUser.couponId, { $inc: { quantity: -1 } });

            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: newPayment,
            }).send(res);
        } else if (typePayment === 'vnpay') {
            const clientIp = vnpayService.getClientIp(req);
            const amount = Math.round(Number(findCartUser.couponId ? findCartUser.finalPrice : findCartUser.totalPrice));
            const vnpayResponse = vnpayService.createPaymentUrl({
                amount: amount,
                txnRef: `${findCartUser.userId}_${generatePayID()}`,
                orderInfo: `Thanh toan don hang ${findCartUser.userId}`,
                ipAddr: clientIp,
            });

            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: vnpayResponse,
            }).send(res);
        } else if (typePayment === 'momo') {
            const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
            const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
            const orderInfo = `Thanh toan don hang ${findCartUser.userId}`;
            const redirectUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3000/api/payment/momo-callback';
            const ipnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3000/api/payment/momo-callback';
            const requestType = 'payWithMethod';
            const amount = Number(findCartUser.couponId ? findCartUser.finalPrice : findCartUser.totalPrice);
            const extraData = '';

            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                orderGroupId: '',
                signature,
            });

            const options = {
                hostname: process.env.MOMO_HOST || 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req1 = https.request(options, (res1) => {
                let data = '';
                res1.on('data', (chunk) => {
                    data += chunk;
                });
                res1.on('end', () => {
                    try {
                        return new Created({
                            message: 'Tạo đơn hàng thành công',
                            metadata: JSON.parse(data),
                        }).send(res);
                    } catch (err) {
                        console.log(err);
                    }
                });
            });

            req1.on('error', (e) => console.log(e));
            req1.write(requestBody);
            req1.end();
        }
    }

    async vnpayCallback(req, res) {
        const verifyResult = vnpayService.verifyReturnUrl(req.query);

        // 1. Kiểm tra chữ ký số bảo mật (HMAC-SHA512)
        if (!verifyResult.isVerified) {
            console.error('VNPay callback failed: Invalid checksum signature', req.query);
            throw new BadRequestError('Chữ ký bảo mật không hợp lệ (Sai checksum)');
        }

        // 2. Kiểm tra mã phản hồi (ResponseCode: 00 là thành công)
        if (!verifyResult.isSuccess) {
            console.warn('VNPay payment failed or canceled:', verifyResult.message);
            return res.redirect(`${process.env.CLIENT_URL}/checkout?error=vnpay_failed&code=${verifyResult.vnpResponseCode}`);
        }

        const txnRef = req.query.vnp_TxnRef || '';
        const vnp_OrderInfo = req.query.vnp_OrderInfo || '';
        const userId = txnRef.includes('_')
            ? txnRef.split('_')[0]
            : (vnp_OrderInfo.includes('+') ? vnp_OrderInfo.split('+')[4] : vnp_OrderInfo.split(' ')[4]);
        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        const newPayment = await paymentModel.create({
            userId,
            products: findCartUser.products,
            totalPrice: findCartUser.totalPrice,
            fullName: findCartUser.fullName,
            phoneNumber: findCartUser.phoneNumber,
            address: findCartUser.address,
            email: findCartUser.email,
            finalPrice: findCartUser.finalPrice,
            couponId: findCartUser.couponId,
            paymentMethod: 'vnpay',
            status: 'confirmed', // Đã thanh toán VNPay thành công -> tự động chuyển sang 'Đang chuẩn bị'
        });

        await findCartUser.deleteOne();
        await cartModel.create({
            userId,
            products: [],
        });

        await decreaseProductStock(findCartUser.products);
        if (findCartUser.couponId) {
            await couponModel.findByIdAndUpdate(findCartUser.couponId, { $inc: { quantity: -1 } });
        }

        return res.redirect(`${process.env.CLIENT_URL}/payment-success/${newPayment._id}`);
    }

    async momoCallback(req, res) {
        const { resultCode, orderInfo } = req.query;
        if (resultCode !== '0') {
            throw new BadRequestError('Thanh toán thất bại');
        }

        const userId = orderInfo.split(' ')[4];
        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }
        const newPayment = await paymentModel.create({
            userId,
            products: findCartUser.products,
            totalPrice: findCartUser.totalPrice,
            fullName: findCartUser.fullName,
            phoneNumber: findCartUser.phoneNumber,
            address: findCartUser.address,
            email: findCartUser.email,
            finalPrice: findCartUser.finalPrice,
            couponId: findCartUser.couponId,
            paymentMethod: 'momo',
            status: 'confirmed', // Đã thanh toán MoMo thành công -> tự động chuyển sang 'Đang chuẩn bị'
        });

        await findCartUser.deleteOne();
        await cartModel.create({
            userId,
            products: [],
        });

        await decreaseProductStock(findCartUser.products);
        await couponModel.findByIdAndUpdate(findCartUser.couponId, { $inc: { quantity: -1 } });

        return res.redirect(`${process.env.CLIENT_URL}/payment-success/${newPayment._id}`);
    }

    async getPaymentsAdmin(req, res) {
        const dataPayment = await paymentModel
            .find({})
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email')
            .populate({
                path: 'products.productId',
                populate: { path: 'categoryProduct' }
            })
            .populate('couponId')
            .populate('confirmedBy', 'fullName email role');
        return new OK({
            message: 'Lấy danh sách đơn hàng thành công',
            metadata: dataPayment,
        }).send(res);
    }

    async updatePayment(req, res) {
        const { orderId } = req.params;
        const { status, internalNote } = req.body;
        if (!orderId || (!status && internalNote === undefined)) {
            throw new BadRequestError('Bạn đang thiếu thông tin');
        }

        const findPayment = await paymentModel.findById(orderId);
        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        const oldStatus = findPayment.status;
        if (status) {
            findPayment.status = status;
            if (status === 'confirmed' && oldStatus !== 'confirmed') {
                findPayment.confirmedBy = req.user;
            }
        }
        if (internalNote !== undefined) {
            findPayment.internalNote = internalNote;
        }
        await findPayment.save();

        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            for (const item of findPayment.products) {
                if (item.productId) {
                    const prod = await productModel.findById(item.productId);
                    if (prod) {
                        prod.stockProduct = (prod.stockProduct || 0) + (item.quantity || 1);
                        if (item.size && prod.metadata && prod.metadata.sizeStock) {
                            const cur = prod.metadata.sizeStock[item.size] || 0;
                            prod.metadata.sizeStock[item.size] = cur + (item.quantity || 1);
                            prod.markModified('metadata');
                        }
                        await prod.save();
                    }
                }
            }
            if (findPayment.couponId) {
                await couponModel.findByIdAndUpdate(findPayment.couponId, { $inc: { quantity: 1 } });
            }
        }

        return new OK({
            message: 'Cập nhật đơn hàng thành công',
            metadata: findPayment,
        }).send(res);
    }

    async getPaymentById(req, res) {
        const { orderId } = req.params;
        const findPayment = await paymentModel
            .findById(orderId)
            .populate('userId', 'fullName email')
            .populate('products.productId', '')
            .populate('couponId');
        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }
        return new OK({
            message: 'Lấy đơn hàng thành công',
            metadata: findPayment,
        }).send(res);
    }

    async getPaymentsUser(req, res) {
        const userId = req.user;
        const userPayments = await paymentModel
            .find({ userId })
            .populate('products.productId')
            .populate('couponId')
            .sort({ createdAt: -1 });
        return new OK({
            message: 'Lấy danh sách đơn hàng thành công',
            metadata: userPayments,
        }).send(res);
    }
}

module.exports = new PaymentController();
