const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Coupon = require('../models/coupon.model');
const Payment = require('../models/payment.model');

class GeminiService {
    constructor() {
        this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
        this.candidateModels = [
            process.env.GEMINI_MODEL,
            'gemini-3-flash-preview',
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash'
        ].filter(Boolean);
        this.fallbackModel = 'gemini-3.1-flash-lite';
        this.systemInstruction = `
Bạn là SneakerHub Assistant - chuyên viên tư vấn bán giày sneaker chuyên nghiệp, tận tâm và am hiểu văn hóa streetwear của cửa hàng SneakerHub.

Nguyên tắc bắt buộc:
1. Luôn sử dụng các công cụ (tools/functions) có sẵn để kiểm tra dữ liệu thực tế:
   - Khi khách hỏi tìm giày, mua giày, hỏi mẫu mã, size, giá tiền: BẮT BUỘC gọi searchProducts hoặc getProductDetails.
   - Khi khách hỏi khuyến mãi, giảm giá, voucher, coupon: BẮT BUỘC gọi getActiveCoupons. Tuyệt đối KHÔNG tự bịa mã giảm giá.
   - Khi khách hỏi đổi trả, bảo hành, vận chuyển, đo size: BẮT BUỘC gọi getStorePolicies.
   - Khi khách hỏi kiểm tra đơn hàng, xem trạng thái đơn: Gọi checkOrderStatus. Nếu khách chưa đăng nhập, nhắc khách đăng nhập.
2. Trả lời bằng tiếng Việt thân thiện, lịch sự, xưng "em" và gọi khách là "anh/chị".
3. Giá tiền luôn định dạng VND rõ ràng (ví dụ: 3.790.000đ).
4. Tư vấn chọn size: Nike Air Force 1 / Jordan 1 thường đi đúng size (true to size); Adidas Ultraboost / Yeezy nên tăng 0.5 đến 1 size; chân bè ngang nên tăng 0.5 size.
5. Nếu khách muốn gặp nhân viên trực tiếp hoặc khiếu nại gay gắt: Khuyên khách chuyển sang tab "Nhân viên hỗ trợ" hoặc liên hệ Zalo 0899227066.
6. Khi giới thiệu sản phẩm từ kết quả tìm kiếm, hãy nêu tên chính xác, giá bán, phối màu và size còn sẵn.
`;

        this.toolsDeclaration = [
            {
                functionDeclarations: [
                    {
                        name: 'searchProducts',
                        description: 'Tìm kiếm sản phẩm giày theo từ khóa, thương hiệu, khoảng giá hoặc size có sẵn trong kho.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                keyword: { type: 'STRING', description: 'Tên hoặc từ khóa sản phẩm (vd: Nike, Jordan, Vomero, Stan Smith)' },
                                brand: { type: 'STRING', description: 'Tên thương hiệu (vd: Nike, Adidas, Puma)' },
                                minPrice: { type: 'NUMBER', description: 'Mức giá tối thiểu (VND)' },
                                maxPrice: { type: 'NUMBER', description: 'Mức giá tối đa (VND)' },
                                size: { type: 'STRING', description: 'Size giày cần tìm (vd: 39, 40, 41, 42, 43)' }
                            }
                        }
                    },
                    {
                        name: 'getProductDetails',
                        description: 'Lấy thông tin chi tiết đầy đủ của một sản phẩm giày bao gồm giá, tồn kho, chất liệu, phối màu và các size có sẵn.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                productId: { type: 'STRING', description: 'Mã ID (ObjectId) của sản phẩm' },
                                productName: { type: 'STRING', description: 'Tên sản phẩm cần xem chi tiết' }
                            }
                        }
                    },
                    {
                        name: 'getActiveCoupons',
                        description: 'Tra cứu danh sách các mã giảm giá và khuyến mãi thực tế đang có hiệu lực trong hệ thống.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {}
                        }
                    },
                    {
                        name: 'getStorePolicies',
                        description: 'Tra cứu các chính sách chính thức của SneakerHub: đổi trả, bảo hành, vận chuyển hoặc bảng size.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                topic: {
                                    type: 'STRING',
                                    description: 'Chủ đề: return_policy (đổi trả), warranty_policy (bảo hành), shipping_policy (vận chuyển), size_guide (chọn size)'
                                }
                            },
                            required: ['topic']
                        }
                    },
                    {
                        name: 'checkOrderStatus',
                        description: 'Tra cứu trạng thái đơn hàng của người dùng hiện tại.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                orderId: { type: 'STRING', description: 'Mã đơn hàng cần kiểm tra (nếu có)' }
                            }
                        }
                    }
                ]
            }
        ];
    }

    // Tool 1: searchProducts
    async searchProducts({ keyword, brand, minPrice, maxPrice, size, limit = 5 }) {
        try {
            const query = {};

            if (brand) {
                const category = await Category.findOne({ nameCategory: new RegExp(brand.trim(), 'i') });
                if (category) {
                    query.categoryProduct = category._id;
                }
            }

            if (keyword && keyword.trim()) {
                query.nameProduct = new RegExp(keyword.trim(), 'i');
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                query.priceProduct = {};
                if (minPrice !== undefined && !isNaN(minPrice)) query.priceProduct.$gte = Number(minPrice);
                if (maxPrice !== undefined && !isNaN(maxPrice)) query.priceProduct.$lte = Number(maxPrice);
            }

            if (size && String(size).trim()) {
                const sizeStr = String(size).trim();
                query['metadata.size'] = new RegExp(`(^|,\\s*)${sizeStr}(\\s*,|$)`, 'i');
            }

            const products = await Product.find(query)
                .select('_id nameProduct priceProduct discountProduct stockProduct metadata imagesProduct')
                .limit(Math.min(limit, 8))
                .lean();

            return products.map(p => ({
                _id: p._id,
                nameProduct: p.nameProduct,
                priceProduct: p.priceProduct,
                discountProduct: p.discountProduct,
                stockProduct: p.stockProduct,
                colorway: p.metadata?.author || 'Tiêu chuẩn',
                availableSizes: p.metadata?.size || 'Liên hệ',
                image: p.imagesProduct && p.imagesProduct.length > 0 ? p.imagesProduct[0] : null
            }));
        } catch (error) {
            console.error('Error in searchProducts tool:', error.message);
            return [];
        }
    }

    // Tool 2: getProductDetails
    async getProductDetails({ productId, productName }) {
        try {
            let product;
            if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                product = await Product.findById(productId).populate('categoryProduct').lean();
            } else if (productName && productName.trim()) {
                product = await Product.findOne({ nameProduct: new RegExp(productName.trim(), 'i') }).populate('categoryProduct').lean();
            }

            if (!product) {
                return { error: 'Không tìm thấy sản phẩm trong hệ thống.' };
            }

            return {
                _id: product._id,
                nameProduct: product.nameProduct,
                priceProduct: product.priceProduct,
                discountProduct: product.discountProduct,
                stockProduct: product.stockProduct,
                category: product.categoryProduct?.nameCategory || 'Sneaker',
                description: product.descriptionProduct,
                colorway: product.metadata?.author || 'Tiêu chuẩn',
                material: product.metadata?.publisher || 'Da / Lưới cao cấp',
                gender: product.metadata?.publishingHouse || 'Unisex',
                origin: product.metadata?.translator || 'Chính hãng',
                availableSizes: product.metadata?.size || 'Đầy đủ size',
                condition: product.metadata?.coverType || 'Mới 100% (Fullbox)',
                metadata: product.metadata || {},
                images: (product.imagesProduct || []).slice(0, 3)
            };
        } catch (error) {
            console.error('Error in getProductDetails tool:', error.message);
            return { error: 'Lỗi khi tra cứu chi tiết sản phẩm.' };
        }
    }

    // Tool 3: getActiveCoupons
    async getActiveCoupons() {
        try {
            const now = new Date();
            const coupons = await Coupon.find({
                quantity: { $gt: 0 },
                endDate: { $gte: now },
                startDate: { $lte: now }
            }).lean();

            return coupons.map(c => ({
                code: c.nameCoupon,
                discountPercent: c.discount,
                minOrderPrice: c.minPrice,
                remainingQuantity: c.quantity,
                expiryDate: c.endDate ? c.endDate.toISOString().split('T')[0] : 'Không xác định'
            }));
        } catch (error) {
            console.error('Error in getActiveCoupons tool:', error.message);
            return [];
        }
    }

    // Tool 4: getStorePolicies
    async getStorePolicies({ topic }) {
        const policies = {
            return_policy: 'Chính sách đổi trả: Khách hàng được đổi size hoặc đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng. Điều kiện: Giày còn nguyên hộp, tem mác và chưa qua sử dụng. SneakerHub hỗ trợ phí đổi 2 chiều nếu lỗi do nhà sản xuất hoặc shop giao nhầm size.',
            warranty_policy: 'Chính sách bảo hành: Tất cả giày chính hãng tại SneakerHub được bảo hành keo, chỉ, đế trong vòng 6 tháng. Hỗ trợ vệ sinh giày miễn phí trọn đời cho khách hàng thân thiết.',
            shipping_policy: 'Chính sách vận chuyển: Giao hàng toàn quốc. Nội thành TP.HCM và Hà Nội nhận hàng sau 1-2 ngày; các tỉnh khác từ 2-4 ngày. Miễn phí vận chuyển cho đơn hàng thanh toán trước từ 2.000.000đ trở lên.',
            size_guide: 'Hướng dẫn chọn size giày chuẩn SneakerHub:\n1. Đặt gót chân sát tường, đo chiều dài bàn chân (cm).\n2. Đối chiếu: 24cm -> size 38.5; 24.5cm -> size 39; 25cm -> size 40; 25.5cm -> size 40.5; 26cm -> size 41; 26.5cm -> size 42; 27cm -> size 42.5; 27.5cm -> size 43; 28cm -> size 44.\n3. Lưu ý: Form Nike AF1/Jordan chọn True-to-size. Form Adidas Ultraboost/Yeezy tăng 0.5-1 size. Chân bè ngang nên tăng 0.5 size.'
        };

        return policies[topic] || policies.return_policy;
    }

    // Tool 5: checkOrderStatus
    async checkOrderStatus({ orderId, currentUserId }) {
        try {
            if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
                return { error: 'Anh/chị vui lòng đăng nhập tài khoản để tra cứu thông tin đơn hàng cá nhân nhé ạ.' };
            }

            const query = { userId: currentUserId };
            if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
                query._id = orderId;
            }

            const orders = await Payment.find(query)
                .sort({ createdAt: -1 })
                .limit(orderId ? 1 : 3)
                .populate('products.productId', 'nameProduct priceProduct imagesProduct')
                .lean();

            if (!orders || orders.length === 0) {
                return {
                    error: orderId
                        ? 'Không tìm thấy đơn hàng này trong tài khoản của bạn.'
                        : 'Tài khoản của anh/chị hiện chưa có đơn hàng nào tại SneakerHub ạ.'
                };
            }

            const statusMap = {
                pending: 'Đang xử lý',
                confirmed: 'Đã xác nhận',
                delivered: 'Đang giao hàng',
                completed: 'Giao hàng thành công',
                cancelled: 'Đã hủy'
            };

            return orders.map(o => ({
                orderId: o._id,
                status: statusMap[o.status] || o.status,
                totalAmount: o.finalPrice || o.totalPrice,
                paymentMethod: (o.paymentMethod || 'cod').toUpperCase(),
                createdAt: o.createdAt ? o.createdAt.toISOString().split('T')[0] : 'N/A',
                items: (o.products || []).map(p => ({
                    productName: p.productId?.nameProduct || 'Sản phẩm',
                    quantity: p.quantity
                }))
            }));
        } catch (error) {
            console.error('Error in checkOrderStatus tool:', error.message);
            return { error: 'Lỗi khi kiểm tra thông tin đơn hàng.' };
        }
    }

    // Execute tool by name
    async executeTool(name, args, currentUserId) {
        switch (name) {
            case 'searchProducts':
                return await this.searchProducts(args);
            case 'getProductDetails':
                return await this.getProductDetails(args);
            case 'getActiveCoupons':
                return await this.getActiveCoupons();
            case 'getStorePolicies':
                return await this.getStorePolicies(args);
            case 'checkOrderStatus':
                return await this.checkOrderStatus({ ...args, currentUserId });
            default:
                return { error: `Không nhận diện được công cụ ${name}` };
        }
    }

    // Call Gemini API with automatic Function Calling Loop
    async chat({ userMessage, history = [], currentUserId = null }) {
        const apiKey = this.apiKey || process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || this.defaultModel;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY chưa được cấu hình.');
        }

        // Prepare message contents
        const contents = [];

        // Add last 6 messages from history
        if (Array.isArray(history)) {
            const trimmed = history.slice(-6);
            for (const h of trimmed) {
                if (h.senderId === 'user') {
                    contents.push({ role: 'user', parts: [{ text: String(h.content).substring(0, 500) }] });
                } else if (h.senderId === 'ai') {
                    contents.push({ role: 'model', parts: [{ text: String(h.content).substring(0, 1000) }] });
                }
            }
        }

        // Add current user prompt
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        const capturedProducts = [];

        // Call Gemini with retry on fallback model
        const callApi = async (modelToUse) => {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;
            const payload = {
                systemInstruction: {
                    parts: [{ text: this.systemInstruction }]
                },
                contents: contents,
                tools: this.toolsDeclaration,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            };

            return await axios.post(url, payload, { timeout: 20000 });
        };

        // Multi-model fallback execution
        const callApiWithFallback = async () => {
            const modelsToTry = [
                model,
                'gemini-3-flash-preview',
                'gemini-3.5-flash-lite',
                'gemini-3.1-flash-lite',
                'gemini-3.5-flash'
            ];
            const uniqueModels = [...new Set(modelsToTry.filter(Boolean))];

            let lastError = null;
            for (const m of uniqueModels) {
                try {
                    return await callApi(m);
                } catch (err) {
                    lastError = err;
                    const status = err.response ? err.response.status : null;
                    if (status === 429 || status === 503 || status === 404) {
                        console.warn(`Model ${m} returned ${status}, trying next fallback model...`);
                        continue;
                    }
                    throw err;
                }
            }
            throw lastError;
        };

        let response = await callApiWithFallback();

        let candidate = response.data?.candidates?.[0];
        let parts = candidate?.content?.parts || [];

        // Check for function calls (up to 2 iterations)
        let iteration = 0;
        while (iteration < 2) {
            const functionCallPart = parts.find(p => p.functionCall);
            if (!functionCallPart) break;

            iteration++;
            const { name, args } = functionCallPart.functionCall;

            // Execute local tool
            const toolResult = await this.executeTool(name, args || {}, currentUserId);

            // If tool was searchProducts or getProductDetails, collect products for UI cards
            if (name === 'searchProducts' && Array.isArray(toolResult)) {
                for (const p of toolResult) {
                    if (!capturedProducts.some(cp => cp._id?.toString() === p._id?.toString())) {
                        capturedProducts.push(p);
                    }
                }
            } else if (name === 'getProductDetails' && toolResult._id) {
                if (!capturedProducts.some(cp => cp._id?.toString() === toolResult._id?.toString())) {
                    capturedProducts.push({
                        _id: toolResult._id,
                        nameProduct: toolResult.nameProduct,
                        priceProduct: toolResult.priceProduct,
                        discountProduct: toolResult.discountProduct,
                        image: toolResult.images?.[0]
                    });
                }
            }

            // Append model call and function response into conversation turns
            contents.push({
                role: 'model',
                parts: [functionCallPart]
            });

            contents.push({
                role: 'user',
                parts: [
                    {
                        functionResponse: {
                            name: name,
                            response: { result: toolResult }
                        }
                    }
                ]
            });

            // Call model again with function result
            response = await callApiWithFallback();

            candidate = response.data?.candidates?.[0];
            parts = candidate?.content?.parts || [];
        }

        // Extract final text
        const textParts = parts.filter(p => p.text).map(p => p.text);
        const finalText = textParts.join('\n').trim() || 'Dạ SneakerHub Assistant có thể hỗ trợ gì thêm cho anh/chị ạ?';

        return {
            success: true,
            message: finalText,
            products: capturedProducts.slice(0, 4)
        };
    }
}

module.exports = new GeminiService();
