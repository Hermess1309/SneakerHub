const feedbackModel = require('../models/feedback.model');
const paymentModel = require('../models/payment.model');

const { NotFoundError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const cloudinary = require('../config/cloudDinary');

class FeedbackController {
    async createFeedback(req, res) {
        const id = req.user;
        const { paymentId, content, rating, productId } = req.body;
        const dataImages = req.files || [];
        const findPayment = await paymentModel.findById(paymentId);

        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        if (findPayment.status !== 'completed') {
            throw new BadRequestError('Đơn hàng chưa hoàn thành');
        }

        // Verify the order belongs to the user
        if (findPayment.userId.toString() !== id.toString()) {
            throw new BadRequestError('Bạn không có quyền đánh giá đơn hàng này');
        }

        // Verify the product was actually purchased in this order
        const hasProduct = findPayment.products.some(p => p.productId && p.productId.toString() === productId.toString());
        if (!hasProduct) {
            throw new BadRequestError('Sản phẩm này không nằm trong đơn hàng đã mua');
        }

        // Verify they haven't already reviewed this product for this order
        const existingFeedback = await feedbackModel.findOne({ userId: id, productId, paymentId });
        if (existingFeedback) {
            throw new BadRequestError('Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi');
        }

        let imagesFeedback = [];

        for (const image of dataImages) {
            const { path, filename } = image;
            const { url } = await cloudinary.uploader.upload(path, {
                folder: 'feedbacks',
                resource_type: 'image',
            });
            imagesFeedback.push(url || filename);
        }

        const newFeedback = await feedbackModel.create({
            userId: id,
            productId,
            paymentId,
            content,
            rating: Number(rating),
            imagesFeedback,
        });

        return new Created({
            message: 'Đánh giá sản phẩm thành công',
            metadata: newFeedback,
        }).send(res);
    }
}

module.exports = new FeedbackController();
