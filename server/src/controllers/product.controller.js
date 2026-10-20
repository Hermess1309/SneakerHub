const cloudinary = require('../config/cloudDinary');
const { Created, OK } = require('../core/success.response');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const fs = require('fs/promises');
const mongoose = require('mongoose');

const getPublicId = require('../utils/getPublicId');

const productModel = require('../models/product.model');
const feedbackModel = require('../models/feedback.model');
const categoryModel = require('../models/category.model');

const CLOUDINARY_FOLDER = 'sneakerhub';

const cleanupFiles = async (files) => {
    if (!files || !Array.isArray(files)) return;
    for (const file of files) {
        if (file && file.path) {
            await fs.unlink(file.path).catch(() => {});
        }
    }
};

const rollbackCloudinaryUploads = async (publicIds) => {
    if (!publicIds || !Array.isArray(publicIds)) return;
    for (const pid of publicIds) {
        if (pid) {
            await cloudinary.uploader.destroy(pid).catch(() => {});
        }
    }
};

class ProductController {
    async uploadSingleImage(req, res) {
        const file = req.file;
        if (!file) {
            throw new BadRequestError('Vui lòng chọn tệp hình ảnh để tải lên');
        }

        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: CLOUDINARY_FOLDER,
                resource_type: 'image',
            });
            await fs.unlink(file.path).catch(() => {});
            const secureUrl = uploadResult.secure_url || uploadResult.url;
            return new OK({
                message: 'Tải ảnh lên Cloudinary thành công',
                metadata: {
                    url: secureUrl,
                    public_id: uploadResult.public_id,
                },
            }).send(res);
        } catch (err) {
            if (file && file.path) {
                await fs.unlink(file.path).catch(() => {});
            }
            throw new BadRequestError(`Tải ảnh lên Cloudinary thất bại: ${err.message}`);
        }
    }

    async createProduct(req, res) {
        const dataImages = req.files || [];
        const {
            nameProduct,
            priceProduct,
            discountProduct,
            stockProduct,
            descriptionProduct,
            categoryProduct,
            metadata,
            imagesProduct: bodyImagesProduct,
        } = req.body;

        // 1. Text & Structural Validation (Fail fast before uploading images)
        if (!nameProduct || typeof nameProduct !== 'string' || !nameProduct.trim()) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Vui lòng nhập tên sản phẩm');
        }

        const trimmedName = nameProduct.trim();

        // Check duplicate name
        const existing = await productModel.findOne({ nameProduct: trimmedName });
        if (existing) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Sản phẩm với tên này đã tồn tại');
        }

        // Validate Price
        if (priceProduct === undefined || priceProduct === null || priceProduct === '') {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Vui lòng nhập đơn giá sản phẩm');
        }
        const numPrice = Number(priceProduct);
        if (isNaN(numPrice) || numPrice < 0) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Đơn giá không hợp lệ (phải là số >= 0)');
        }

        // Validate Stock
        if (stockProduct === undefined || stockProduct === null || stockProduct === '') {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Vui lòng nhập số lượng tồn kho');
        }
        const numStock = Number(stockProduct);
        if (isNaN(numStock) || numStock < 0) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Số lượng tồn kho không hợp lệ (phải là số >= 0)');
        }

        // Validate Discount
        const numDiscount = Number(discountProduct || 0);
        if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Khuyến mãi phải từ 0% đến 100%');
        }

        // Validate Description
        if (!descriptionProduct || typeof descriptionProduct !== 'string' || !descriptionProduct.trim()) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Vui lòng nhập mô tả sản phẩm');
        }

        // Validate Category
        if (!categoryProduct || !mongoose.Types.ObjectId.isValid(categoryProduct)) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Danh mục/thương hiệu không hợp lệ');
        }
        const foundCategory = await categoryModel.findById(categoryProduct);
        if (!foundCategory) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Danh mục/thương hiệu không tồn tại');
        }

        // Parse manual URLs if provided
        let manualUrls = [];
        if (bodyImagesProduct) {
            try {
                const parsed = Array.isArray(bodyImagesProduct)
                    ? bodyImagesProduct
                    : (typeof bodyImagesProduct === 'string' ? JSON.parse(bodyImagesProduct) : []);
                manualUrls = (Array.isArray(parsed) ? parsed : [parsed])
                    .filter(u => typeof u === 'string' && u.trim().startsWith('http'));
            } catch {
                if (typeof bodyImagesProduct === 'string') {
                    manualUrls = bodyImagesProduct.split(',').map(s => s.trim()).filter(u => u.startsWith('http'));
                }
            }
        }

        if (dataImages.length === 0 && manualUrls.length === 0) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Vui lòng cung cấp ít nhất một hình ảnh sản phẩm');
        }

        // 2. Cloudinary Upload Process
        const uploadedPublicIds = [];
        const uploadedUrls = [];

        try {
            for (const image of dataImages) {
                const uploadResult = await cloudinary.uploader.upload(image.path, {
                    folder: CLOUDINARY_FOLDER,
                    resource_type: 'image',
                });
                uploadedPublicIds.push(uploadResult.public_id);
                const secureUrl = uploadResult.secure_url || uploadResult.url;
                uploadedUrls.push(secureUrl);
                await fs.unlink(image.path).catch(() => {});
            }
        } catch (uploadErr) {
            // Clean up any remaining temp files on disk
            await cleanupFiles(dataImages);
            // Roll back any assets uploaded in this batch to Cloudinary
            await rollbackCloudinaryUploads(uploadedPublicIds);
            throw new BadRequestError(`Tải ảnh lên Cloudinary thất bại: ${uploadErr.message}`);
        }

        const finalImages = [...uploadedUrls, ...manualUrls];
        if (finalImages.length === 0) {
            await rollbackCloudinaryUploads(uploadedPublicIds);
            throw new BadRequestError('Không có ảnh hợp lệ để lưu sản phẩm');
        }

        // 3. Database Insertion with Rollback on DB Error
        let newProduct;
        try {
            const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
            newProduct = await productModel.create({
                nameProduct: trimmedName,
                priceProduct: numPrice,
                discountProduct: numDiscount,
                stockProduct: numStock,
                descriptionProduct: descriptionProduct.trim(),
                categoryProduct,
                metadata: parsedMetadata,
                imagesProduct: finalImages,
            });
        } catch (dbErr) {
            // Roll back Cloudinary assets if DB creation fails
            await rollbackCloudinaryUploads(uploadedPublicIds);
            throw dbErr;
        }

        return new Created({
            message: 'Tạo sản phẩm thành công',
            metadata: newProduct,
        }).send(res);
    }

    async getAllProduct(req, res) {
        const products = await productModel.find();
        return new OK({
            message: 'Lấy danh sách sản phẩm thành công',
            metadata: products,
        }).send(res);
    }

    async updateProduct(req, res) {
        const { id } = req.params;
        const {
            nameProduct,
            priceProduct,
            discountProduct,
            stockProduct,
            descriptionProduct,
            categoryProduct,
            metadata,
            oldImagesProduct,
        } = req.body;

        const dataImages = req.files || [];

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('ID sản phẩm không hợp lệ');
        }

        const findProduct = await productModel.findById(id);
        if (!findProduct) {
            await cleanupFiles(dataImages);
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        // Validate name if provided
        let trimmedName = findProduct.nameProduct;
        if (nameProduct) {
            trimmedName = nameProduct.trim();
            const existingWithSameName = await productModel.findOne({
                nameProduct: trimmedName,
                _id: { $ne: id }
            });
            if (existingWithSameName) {
                await cleanupFiles(dataImages);
                throw new BadRequestError('Tên sản phẩm đã được sử dụng bởi sản phẩm khác');
            }
        }

        // Validate numbers
        const numPrice = priceProduct !== undefined && priceProduct !== '' ? Number(priceProduct) : findProduct.priceProduct;
        if (isNaN(numPrice) || numPrice < 0) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Đơn giá không hợp lệ (phải là số >= 0)');
        }

        const numStock = stockProduct !== undefined && stockProduct !== '' ? Number(stockProduct) : findProduct.stockProduct;
        if (isNaN(numStock) || numStock < 0) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Số lượng tồn kho không hợp lệ (phải là số >= 0)');
        }

        const numDiscount = discountProduct !== undefined && discountProduct !== '' ? Number(discountProduct) : findProduct.discountProduct;
        if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
            await cleanupFiles(dataImages);
            throw new BadRequestError('Khuyến mãi phải từ 0% đến 100%');
        }

        // Parse existing old images
        let parsedOldImages = [];
        if (oldImagesProduct) {
            try {
                parsedOldImages = typeof oldImagesProduct === 'string' ? JSON.parse(oldImagesProduct) : oldImagesProduct;
                if (!Array.isArray(parsedOldImages)) parsedOldImages = [parsedOldImages];
            } catch {
                parsedOldImages = [];
            }
        } else {
            parsedOldImages = findProduct.imagesProduct || [];
        }

        // Upload new images to Cloudinary folder sneakerhub
        const uploadedPublicIds = [];
        const uploadedUrls = [];

        try {
            for (const image of dataImages) {
                const uploadResult = await cloudinary.uploader.upload(image.path, {
                    folder: CLOUDINARY_FOLDER,
                    resource_type: 'image',
                });
                uploadedPublicIds.push(uploadResult.public_id);
                const secureUrl = uploadResult.secure_url || uploadResult.url;
                uploadedUrls.push(secureUrl);
                await fs.unlink(image.path).catch(() => {});
            }
        } catch (uploadErr) {
            await cleanupFiles(dataImages);
            await rollbackCloudinaryUploads(uploadedPublicIds);
            throw new BadRequestError(`Tải ảnh lên Cloudinary thất bại: ${uploadErr.message}`);
        }

        const finalImages = [...parsedOldImages, ...uploadedUrls];
        if (finalImages.length === 0) {
            await rollbackCloudinaryUploads(uploadedPublicIds);
            throw new BadRequestError('Sản phẩm phải có ít nhất một hình ảnh');
        }

        let parsedMetadata = findProduct.metadata;
        if (metadata) {
            try {
                parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch {
                parsedMetadata = metadata;
            }
        }

        const updateProduct = await productModel.findByIdAndUpdate(
            id,
            {
                nameProduct: trimmedName,
                priceProduct: numPrice,
                discountProduct: numDiscount,
                stockProduct: numStock,
                descriptionProduct: descriptionProduct ? descriptionProduct.trim() : findProduct.descriptionProduct,
                categoryProduct: categoryProduct || findProduct.categoryProduct,
                metadata: parsedMetadata,
                imagesProduct: finalImages,
            },
            { new: true },
        );

        if (!updateProduct) {
            throw new NotFoundError('Cập nhật sản phẩm thất bại');
        }

        return new OK({
            message: 'Cập nhật thông tin sản phẩm thành công',
            metadata: updateProduct,
        }).send(res);
    }

    async getProductById(req, res) {
        const { id } = req.params;
        const product = await productModel.findById(id).populate('categoryProduct');
        const feedbacks = await feedbackModel.find({ productId: id }).populate('userId', 'fullName avatar email');
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        return new OK({
            message: 'Lấy thông tin sản phẩm thành công',
            metadata: { product, feedbacks },
        }).send(res);
    }

    async deleteProduct(req, res) {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError('Thiếu thông tin sản phẩm');
        }

        const findProduct = await productModel.findById(id);
        if (!findProduct) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        for (const image of findProduct.imagesProduct) {
            try {
                if (image && !image.includes('localhost') && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                    await cloudinary.uploader.destroy(getPublicId(image));
                }
            } catch (err) {
                console.warn("Cloudinary image destruction bypassed or failed:", err);
            }
        }

        await findProduct.deleteOne();

        return new OK({
            message: 'Xóa sản phẩm thành công',
            metadata: findProduct,
        }).send(res);
    }

    async getProductByCategory(req, res) {
        const { idCategory } = req.params;

        let product = [];
        if (idCategory) {
            product = await productModel.find({ categoryProduct: idCategory });
        } else {
            product = await productModel.find();
        }

        return new OK({
            message: 'Lấy sản phẩm theo danh mục thành công',
            metadata: product,
        }).send(res);
    }
}

module.exports = new ProductController();
