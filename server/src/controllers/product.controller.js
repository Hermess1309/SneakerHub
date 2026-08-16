const cloudinary = require('../config/cloudDinary');
const { Created, OK } = require('../core/success.response');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const fs = require('fs/promises');

const getPublicId = require('../utils/getPublicId');

const productModel = require('../models/product.model');
const feedbackModel = require('../models/feedback.model');

class ProductController {
    async createProduct(req, res) {
        const dataImages = req.files;
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

        let imagesProduct = [];

        if (bodyImagesProduct) {
            imagesProduct = Array.isArray(bodyImagesProduct)
                ? bodyImagesProduct
                : (typeof bodyImagesProduct === 'string' ? JSON.parse(bodyImagesProduct) : []);
        } else if (dataImages && dataImages.length > 0) {
            for (const image of dataImages) {
                const { path, filename } = image;
                let url = '';
                try {
                    if (process.env.CLOUD_DINARY_KEY && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                        const uploadResult = await cloudinary.uploader.upload(path, {
                            folder: 'products',
                            resource_type: 'image',
                        });
                        url = uploadResult.url;
                        await fs.unlink(path);
                    }
                } catch (err) {
                    console.warn("Cloudinary upload failed, falling back to local static serve:", err);
                }
                if (!url) {
                    url = `http://localhost:3000/uploads/products/${filename}`;
                }
                imagesProduct.push(url);
            }
        }

        if (
            !nameProduct ||
            !priceProduct ||
            !discountProduct ||
            !stockProduct ||
            !descriptionProduct ||
            !categoryProduct ||
            imagesProduct.length === 0 ||
            !metadata
        ) {
            throw new BadRequestError('Thiếu thông tin sản phẩm');
        }

        const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

        const newProduct = await productModel.create({
            nameProduct,
            priceProduct,
            discountProduct,
            stockProduct,
            descriptionProduct,
            categoryProduct,
            metadata: parsedMetadata,
            imagesProduct,
        });

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

        const dataImages = req.files;

        if (
            !id ||
            !nameProduct ||
            !priceProduct ||
            !discountProduct ||
            !stockProduct ||
            !descriptionProduct ||
            !categoryProduct ||
            !metadata ||
            !oldImagesProduct
        ) {
            throw new BadRequestError('Thiếu thông tin sản phẩm');
        }

        const findProduct = await productModel.findById(id);
        if (!findProduct) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        let imagesProduct = [];

        if (dataImages && dataImages.length > 0) {
            for (const image of dataImages) {
                const { path, filename } = image;
                let url = '';
                try {
                    if (process.env.CLOUD_DINARY_KEY && process.env.CLOUD_DINARY_KEY !== 'your_cloudinary_key') {
                        const uploadResult = await cloudinary.uploader.upload(path, {
                            folder: 'products',
                            resource_type: 'image',
                        });
                        url = uploadResult.url;
                        await fs.unlink(path);
                    }
                } catch (err) {
                    console.warn("Cloudinary upload failed, falling back to local static serve:", err);
                }
                if (!url) {
                    url = `http://localhost:3000/uploads/products/${filename}`;
                }
                imagesProduct.push(url);
            }
        }

        const parserOldImages = oldImagesProduct ? JSON.parse(oldImagesProduct) : [];

        const finalImages = [...parserOldImages, ...imagesProduct];

        const parserMetadata = metadata ? JSON.parse(metadata) : undefined;

        const updateProduct = await productModel.findByIdAndUpdate(
            id,
            {
                nameProduct,
                priceProduct,
                discountProduct,
                stockProduct,
                descriptionProduct,
                categoryProduct,
                metadata: parserMetadata,
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
