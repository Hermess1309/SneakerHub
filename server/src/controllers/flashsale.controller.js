const flashsaleModel = require('../models/flashsale.model');
const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class FlashSaleController {
    async setFlashSale(req, res) {
        const { title, endTime, isActive } = req.body;

        if (!endTime) {
            throw new BadRequestError('Cần cung cấp thời gian kết thúc Flash Sale');
        }

        // Find existing configuration
        let config = await flashsaleModel.findOne();
        if (config) {
            config.title = title || config.title;
            config.endTime = new Date(endTime);
            config.isActive = isActive !== undefined ? isActive : config.isActive;
            await config.save();
        } else {
            config = await flashsaleModel.create({
                title: title || 'Flash Sale Chớp Nhoáng',
                endTime: new Date(endTime),
                isActive: isActive !== undefined ? isActive : true
            });
        }

        return new OK({
            message: 'Cập nhật Flash Sale thành công',
            metadata: config,
        }).send(res);
    }

    async getFlashSale(req, res) {
        const config = await flashsaleModel.findOne();
        return new OK({
            message: 'Lấy cấu hình Flash Sale thành công',
            metadata: config,
        }).send(res);
    }
}

module.exports = new FlashSaleController();
