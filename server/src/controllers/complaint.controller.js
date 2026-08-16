const cloudinary = require('../config/cloudDinary');
const complaintModel = require('../models/complaint.model');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const fs = require('fs/promises');

class ComplaintController {
    async createComplaint(req, res) {
        const { paymentId, reason, content } = req.body;
        const userId = req.user; // from authUser/authAdmin middleware (decoded.id)

        if (!paymentId || !reason || !content) {
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    try { await fs.unlink(file.path); } catch (e) {}
                }
            }
            throw new BadRequestError('Thiếu thông tin khiếu nại (paymentId, lý do hoặc nội dung)');
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const { path, filename } = file;
                let url = '';
                try {
                    if (process.env.CLOUD_DINARY_KEY && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                        const uploadResult = await cloudinary.uploader.upload(path, {
                            folder: 'complaints',
                            resource_type: 'image',
                        });
                        url = uploadResult.url;
                        try { await fs.unlink(path); } catch (e) {}
                    }
                } catch (err) {
                    console.warn("Cloudinary upload failed for complaint image, falling back to local:", err);
                }

                if (!url) {
                    url = `http://localhost:3000/uploads/complaints/${filename}`;
                }
                images.push(url);
            }
        }

        const newComplaint = await complaintModel.create({
            userId,
            paymentId,
            reason,
            content,
            images,
            status: 'pending'
        });

        return new Created({
            message: 'Tạo khiếu nại thành công',
            metadata: newComplaint,
        }).send(res);
    }

    async getUserComplaints(req, res) {
        const userId = req.user;
        const complaints = await complaintModel.find({ userId })
            .populate('paymentId')
            .sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách khiếu nại của người dùng thành công',
            metadata: complaints,
        }).send(res);
    }

    async getAllComplaints(req, res) {
        const complaints = await complaintModel.find()
            .populate('userId', 'fullName email')
            .populate('paymentId')
            .sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy tất cả khiếu nại thành công',
            metadata: complaints,
        }).send(res);
    }

    async respondToComplaint(req, res) {
        const { id } = req.params;
        const { adminResponse, status } = req.body;

        if (!id || !status) {
            throw new BadRequestError('Thiếu ID khiếu nại hoặc trạng thái cập nhật');
        }

        if (!['pending', 'processing', 'resolved', 'rejected'].includes(status)) {
            throw new BadRequestError('Trạng thái không hợp lệ');
        }

        const updatedComplaint = await complaintModel.findByIdAndUpdate(
            id,
            { adminResponse, status },
            { new: true }
        ).populate('userId', 'fullName email').populate('paymentId');

        if (!updatedComplaint) {
            throw new NotFoundError('Không tìm thấy khiếu nại');
        }

        return new OK({
            message: 'Phản hồi khiếu nại thành công',
            metadata: updatedComplaint,
        }).send(res);
    }
}

module.exports = new ComplaintController();
