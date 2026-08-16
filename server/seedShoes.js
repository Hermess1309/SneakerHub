const mongoose = require('mongoose');
const Category = require('./src/models/category.model');
const Product = require('./src/models/product.model');
require('dotenv').config();

const categories = [
    {
        nameCategory: "Nike",
        imageCategory: "https://sneakerdaily.vn/wp-content/uploads/2022/03/Nike-chinh-hang-tai-Sneaker-Daily.jpg"
    },
    {
        nameCategory: "Adidas",
        imageCategory: "https://sneakerdaily.vn/wp-content/uploads/2022/03/adidas-chinh-hang-tai-Sneaker-Daily.jpg"
    },
    {
        nameCategory: "Jordan",
        imageCategory: "https://sneakerdaily.vn/wp-content/uploads/2022/03/Jordan-chinh-hang-tai-Sneaker-Daily.jpg"
    },
    {
        nameCategory: "New Balance",
        imageCategory: "https://sneakerdaily.vn/wp-content/uploads/2025/06/New-Balance-chinh-hang-tai-Sneak.jpg"
    },
    {
        nameCategory: "Asics",
        imageCategory: "https://sneakerdaily.vn/wp-content/uploads/2025/06/asics.jpg"
    }
];

const seedShoes = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookstore";
        console.log(`Connecting to MongoDB at ${uri} for shoe seeding...`);
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log("Connected successfully. Clearing old categories and products...");

        // Clear existing database collections
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log("Cleared old database tables.");

        // Insert new categories (Brands)
        const insertedCategories = await Category.insertMany(categories);
        console.log(`Inserted ${insertedCategories.length} sneaker brands.`);

        const nikeId = insertedCategories[0]._id;
        const adidasId = insertedCategories[1]._id;
        const jordanId = insertedCategories[2]._id;
        const nbId = insertedCategories[3]._id;
        const asicsId = insertedCategories[4]._id;

        const products = [
            {
                nameProduct: "Nike Air Force 1 '07",
                priceProduct: 2900000,
                discountProduct: 10,
                stockProduct: 45,
                descriptionProduct: "Mẫu giày huyền thoại Nike Air Force 1 với thiết kế cổ điển màu trắng tinh khiết, chất da bền bỉ cùng đệm Air êm ái thích hợp cho mọi hoạt động hàng ngày.",
                imagesProduct: [
                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600",
                    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600",
                    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600",
                    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600"
                ],
                categoryProduct: nikeId,
                metadata: {
                    author: "Trắng tinh (All White)", // color
                    publisher: "Da nhân tạo cao cấp (Leather)", // material
                    publishingHouse: "Unisex", // gender
                    translator: "Việt Nam", // origin
                    size: "38, 39, 40, 41, 42", // sizes
                    coverType: "Mới 100% (Fullbox)" // condition
                }
            },
            {
                nameProduct: "Adidas Ultraboost 22",
                priceProduct: 4200000,
                discountProduct: 15,
                stockProduct: 30,
                descriptionProduct: "Giày chạy bộ cao cấp của Adidas với đế đệm Boost hoàn trả năng lượng tối đa, thân giày bằng vải dệt Primeknit thoáng khí và ôm sát bàn chân.",
                imagesProduct: [
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600",
                    "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=600",
                    "https://images.unsplash.com/photo-1508180589062-f1dc3e87d4d9?q=80&w=600",
                    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600"
                ],
                categoryProduct: adidasId,
                metadata: {
                    author: "Đỏ/Đen (Core Red/Black)", // color
                    publisher: "Vải dệt Primeknit tái chế", // material
                    publishingHouse: "Nam/Nữ", // gender
                    translator: "Indonesia", // origin
                    size: "39, 40, 41, 42, 43", // sizes
                    coverType: "Mới 100% (Fullbox)" // condition
                }
            },
            {
                nameProduct: "Air Jordan 1 Retro High 'Chicago'",
                priceProduct: 5500000,
                discountProduct: 5,
                stockProduct: 15,
                descriptionProduct: "Phiên bản Jordan cổ cao huyền thoại mang phối màu Chicago đỏ/trắng/đen kinh điển. Biểu tượng của văn hóa sát mặt đất và phong cách đường phố bụi bặm.",
                imagesProduct: [
                    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600",
                    "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600",
                    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?q=80&w=600",
                    "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=600"
                ],
                categoryProduct: jordanId,
                metadata: {
                    author: "Đỏ/Trắng/Đen (Chicago)", // color
                    publisher: "Da hạt cao cấp (Full-grain Leather)", // material
                    publishingHouse: "Unisex", // gender
                    translator: "Trung Quốc", // origin
                    size: "40, 41, 42, 43, 44", // sizes
                    coverType: "Mới 100% (Fullbox)" // condition
                }
            },
            {
                nameProduct: "New Balance 550 'White Green'",
                priceProduct: 3500000,
                discountProduct: 0,
                stockProduct: 25,
                descriptionProduct: "Mang phong cách bóng rổ retro của thập niên 90, New Balance 550 có phối màu Trắng/Xanh lá thời thượng, tạo điểm nhấn cá tính cho mọi bộ outfit.",
                imagesProduct: [
                    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600",
                    "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600",
                    "https://images.unsplash.com/photo-1512374382149-4332c6c02151?q=80&w=600",
                    "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=600"
                ],
                categoryProduct: nbId,
                metadata: {
                    author: "Trắng/Xanh lá (White Green)", // color
                    publisher: "Da nubuck & Da lộn", // material
                    publishingHouse: "Unisex", // gender
                    translator: "Việt Nam", // origin
                    size: "37, 38, 39, 40, 41, 42", // sizes
                    coverType: "Mới 100% (Fullbox)" // condition
                }
            },
            {
                nameProduct: "Asics Gel-Kayano 29",
                priceProduct: 3800000,
                discountProduct: 10,
                stockProduct: 40,
                descriptionProduct: "Mẫu giày nâng đỡ bàn chân tối đa của Asics, trang bị công nghệ đệm Gel giảm chấn và FF Blast+ siêu nhẹ, hỗ trợ hoàn hảo cho việc chạy bộ đường dài.",
                imagesProduct: [
                    "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600",
                    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600",
                    "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=600",
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600"
                ],
                categoryProduct: asicsId,
                metadata: {
                    author: "Xanh dương/Cam", // color
                    publisher: "Lưới dệt kỹ thuật (Engineered Mesh)", // material
                    publishingHouse: "Nam", // gender
                    translator: "Việt Nam", // origin
                    size: "40, 41, 42, 43, 44", // sizes
                    coverType: "Mới 100% (Fullbox)" // condition
                }
            }
        ];

        // Insert new products
        const insertedProducts = await Product.insertMany(products);
        console.log(`Inserted ${insertedProducts.length} sneakers successfully.`);

        console.log("Shoe seeding completed successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Seeding error occurred:", error);
        process.exit(1);
    }
};

seedShoes();
