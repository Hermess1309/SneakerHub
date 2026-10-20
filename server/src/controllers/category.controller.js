const cloudinary = require('../config/cloudDinary');
const categoryModel = require('../models/category.model');
const productModel = require('../models/product.model');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');

const fs = require('fs/promises');
const mongoose = require('mongoose');

const getPublicId = require('../utils/getPublicId');

const CLOUDINARY_FOLDER = 'sneakerhub';

class CategoryController {
    async uploadCategoryImage(req, res) {
        const file = req.file;
        if (!file) {
            throw new BadRequestError('Vui lòng chọn tệp hình ảnh logo thương hiệu');
        }

        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: CLOUDINARY_FOLDER,
                resource_type: 'image',
            });
            await fs.unlink(file.path).catch(() => {});
            const secureUrl = uploadResult.secure_url || uploadResult.url;
            return new OK({
                message: 'Tải logo thương hiệu lên Cloudinary thành công',
                metadata: {
                    url: secureUrl,
                    public_id: uploadResult.public_id,
                },
            }).send(res);
        } catch (err) {
            if (file && file.path) {
                await fs.unlink(file.path).catch(() => {});
            }
            throw new BadRequestError(`Tải logo lên Cloudinary thất bại: ${err.message}`);
        }
    }

    async createCategory(req, res) {
        const { nameCategory, imageCategory: bodyImageCategory } = req.body;
        
        if (!nameCategory || typeof nameCategory !== 'string' || !nameCategory.trim()) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new BadRequestError('Vui lòng nhập tên thương hiệu');
        }

        const trimmedName = nameCategory.trim();
        const existing = await categoryModel.findOne({ nameCategory: trimmedName });
        if (existing) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new BadRequestError('Thương hiệu với tên này đã tồn tại');
        }

        let imageCategory = bodyImageCategory ? bodyImageCategory.trim() : '';

        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: CLOUDINARY_FOLDER,
                    resource_type: 'image',
                });
                await fs.unlink(path).catch(() => {});
                imageCategory = uploadResult.secure_url || uploadResult.url;
            } catch (err) {
                await fs.unlink(path).catch(() => {});
                throw new BadRequestError(`Tải ảnh logo lên Cloudinary thất bại: ${err.message}`);
            }
        }

        if (!imageCategory) {
            throw new BadRequestError('Vui lòng cung cấp logo thương hiệu');
        }

        const newCategory = await categoryModel.create({
            nameCategory: trimmedName,
            imageCategory,
        });

        return new Created({
            message: 'Tạo thương hiệu thành công',
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
        const { nameCategory, imageCategory: bodyImageCategory } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new BadRequestError('ID thương hiệu không hợp lệ');
        }

        if (!nameCategory || typeof nameCategory !== 'string' || !nameCategory.trim()) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new BadRequestError('Vui lòng nhập tên thương hiệu');
        }

        const findCategory = await categoryModel.findById(id);
        if (!findCategory) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new NotFoundError('Thương hiệu không tồn tại');
        }

        const trimmedName = nameCategory.trim();
        const existingName = await categoryModel.findOne({
            nameCategory: trimmedName,
            _id: { $ne: id }
        });
        if (existingName) {
            if (req.file) await fs.unlink(req.file.path).catch(() => {});
            throw new BadRequestError('Tên thương hiệu đã được sử dụng');
        }

        let imageCategory = bodyImageCategory ? bodyImageCategory.trim() : findCategory.imageCategory;

        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: CLOUDINARY_FOLDER,
                    resource_type: 'image',
                });
                await fs.unlink(path).catch(() => {});
                const newUrl = uploadResult.secure_url || uploadResult.url;

                // Destroy old image on Cloudinary if replaced
                if (findCategory.imageCategory && findCategory.imageCategory.includes('cloudinary.com')) {
                    const oldPid = getPublicId(findCategory.imageCategory);
                    if (oldPid) await cloudinary.uploader.destroy(oldPid).catch(() => {});
                }

                imageCategory = newUrl;
            } catch (err) {
                await fs.unlink(path).catch(() => {});
                throw new BadRequestError(`Tải ảnh logo lên Cloudinary thất bại: ${err.message}`);
            }
        }

        const updatedCategory = await categoryModel.findByIdAndUpdate(
            id,
            { nameCategory: trimmedName, imageCategory },
            { new: true },
        );

        return new OK({
            message: 'Cập nhật thương hiệu thành công',
            metadata: updatedCategory,
        }).send(res);
    }

    async deleteCategory(req, res) {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new BadRequestError('ID thương hiệu không hợp lệ');
        }

        const findCategory = await categoryModel.findById(id);
        if (!findCategory) {
            throw new NotFoundError('Thương hiệu không tồn tại');
        }

        // Prevent deletion if products exist in category
        const productCount = await productModel.countDocuments({ categoryProduct: id });
        if (productCount > 0) {
            throw new BadRequestError(`Không thể xóa thương hiệu đang có ${productCount} sản phẩm hoạt động`);
        }

        // Destroy image on Cloudinary
        try {
            if (findCategory.imageCategory && findCategory.imageCategory.includes('cloudinary.com')) {
                const pid = getPublicId(findCategory.imageCategory);
                if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
            }
        } catch (err) {
            console.warn("Cloudinary image destruction error:", err.message);
        }

        await findCategory.deleteOne();

        return new OK({
            message: 'Xóa thương hiệu thành công',
            metadata: findCategory,
        }).send(res);
    }
}

module.exports = new CategoryController();
