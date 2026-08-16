const cloudinary = require('../config/cloudDinary');
const categoryModel = require('../models/category.model');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

const fs = require('fs/promises');

const getPublicId = require('../utils/getPublicId');

class CategoryController {
    async createCategory(req, res) {
        const { nameCategory, imageCategory: bodyImageCategory } = req.body;
        let imageCategory = bodyImageCategory;

        if (!imageCategory && req.file) {
            const { path, filename } = req.file;
            if (!nameCategory || !path || !filename) {
                try { await fs.unlink(path); } catch (e) {}
                throw new BadRequestError('Thiếu thông tin danh mục');
            }
            
            let url = '';
            try {
                if (process.env.CLOUD_DINARY_KEY && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                    const uploadResult = await cloudinary.uploader.upload(path, {
                        folder: 'categorys',
                        resource_type: 'image',
                    });
                    url = uploadResult.url;
                    await fs.unlink(path);
                }
            } catch (err) {
                console.warn("Cloudinary upload failed, falling back to local static serve:", err);
            }

            if (!url) {
                url = `http://localhost:3000/uploads/categorys/${filename}`;
            }
            imageCategory = url;
        }

        if (!nameCategory || !imageCategory) {
            throw new BadRequestError('Thiếu thông tin danh mục');
        }

        const newCategory = await categoryModel.create({
            nameCategory,
            imageCategory,
        });

        return new Created({
            message: 'Tạo danh mục thành công',
            metadata: newCategory,
        }).send(res);
    }

    async getAllCategory(req, res) {
        const categories = await categoryModel.find();
        return new OK({
            message: 'Lấy danh mục thành công',
            metadata: categories,
        }).send(res);
    }

    async updateCategory(req, res) {
        const { id } = req.params;
        const { nameCategory } = req.body;
        if (!nameCategory || !id) {
            throw new BadRequestError('Thiếu thông tin danh mục');
        }

        const findCategory = await categoryModel.findById(id);
        if (!findCategory) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        let imageCategory = findCategory.imageCategory;

        if (req.file) {
            const { path, filename } = req.file;
            let url = '';
            try {
                if (process.env.CLOUD_DINARY_KEY && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                    const uploadResult = await cloudinary.uploader.upload(path, {
                        folder: 'categorys',
                        resource_type: 'image',
                    });
                    url = uploadResult.url;
                    await fs.unlink(path);
                    try {
                        await cloudinary.uploader.destroy(getPublicId(findCategory.imageCategory));
                    } catch (e) {}
                }
            } catch (err) {
                console.warn("Cloudinary upload failed, falling back to local static serve:", err);
            }

            if (!url) {
                url = `http://localhost:3000/uploads/categorys/${filename}`;
            }
            imageCategory = url;
        }

        const updateCategory = await categoryModel.findByIdAndUpdate(
            id,
            { nameCategory, imageCategory },
            { new: true },
        );

        return new OK({
            message: 'Cập nhật danh mục thành công',
            metadata: updateCategory,
        }).send(res);
    }

    async deleteCategory(req, res) {
        const { id } = req.params;

        if (!id) {
            throw new BadRequestError('Thiếu thông tin danh mục');
        }

        const findCategory = await categoryModel.findById(id);

        if (!findCategory) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        try {
            if (findCategory.imageCategory && !findCategory.imageCategory.includes('localhost') && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                await cloudinary.uploader.destroy(getPublicId(findCategory.imageCategory));
            }
        } catch (err) {
            console.warn("Cloudinary image destruction bypassed or failed:", err);
        }

        await findCategory.deleteOne();

        return new OK({
            message: 'Xóa danh mục thành công',
            metadata: findCategory,
        }).send(res);
    }
}

module.exports = new CategoryController();
