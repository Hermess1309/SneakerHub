import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CardBody from '../components/CardBody';
import Footer from '../components/Footer';
import { useEffect, useState } from 'react';
import { productDetail, listProductByCategory, listProduct } from '../config/ProductRequest';
import { Spin, Select, message, Modal } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    MinusOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useStore } from '../hooks/useStore';
import { requestAddToCart } from '../config/CartRequest';

function DetailProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [sizeError, setSizeError] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    
    // Tab control state
    const [activeTab, setActiveTab] = useState('description');
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);

    // Image Magnifier State
    const [zoomState, setZoomState] = useState({
        showZoom: false,
        lensX: 0,
        lensY: 0,
        bgX: 0,
        bgY: 0
    });

    const handleMouseMove = (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const lensWidth = 200;
        const lensHeight = 200;
        
        let lX = x - lensWidth / 2;
        let lY = y - lensHeight / 2;
        
        lX = Math.max(0, Math.min(lX, rect.width - lensWidth));
        lY = Math.max(0, Math.min(lY, rect.height - lensHeight));
        
        const pX = (lX / (rect.width - lensWidth)) * 100;
        const pY = (lY / (rect.height - lensHeight)) * 100;
        
        setZoomState({
            showZoom: true,
            lensX: lX,
            lensY: lY,
            bgX: pX,
            bgY: pY
        });
    };

    const handleMouseLeave = () => {
        setZoomState(prev => ({ ...prev, showZoom: false }));
    };

    const { dataUser, getCart, cart } = useStore();

    // Fetch product detail and related products
    const fetchProductData = async () => {
        setLoading(true);
        try {
            const res = await productDetail(id);
            const prod = res.metadata.product;
            setProduct(prod);
            setFeedbacks(res.metadata.feedbacks || []);

            // Fetch related products
            let related = [];
            const catId = prod.categoryProduct?._id || prod.categoryProduct;
            if (catId) {
                try {
                    const relRes = await listProductByCategory(catId);
                    related = (relRes.metadata || []).filter(p => p._id !== id);
                } catch (e) {
                    console.error('Error fetching brand related products:', e);
                }
            }

            // Fallback: If no related products found of same brand, or catId is missing
            if (related.length === 0) {
                try {
                    const allRes = await listProduct();
                    related = (allRes.metadata || []).filter(p => p._id !== id);
                } catch (e) {
                    console.error('Error fetching fallback related products:', e);
                }
            }

            // Randomize and select 4 products
            if (related.length > 0) {
                const shuffled = [...related].sort(() => Math.random() - 0.5);
                setRelatedProducts(shuffled.slice(0, 4));
            } else {
                setRelatedProducts([]);
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
            message.error('Không thể tải thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductData();
        // Reset state on id change
        setQuantity(1);
        setSelectedImage(0);
        setSelectedSize(null);
        setSizeError(false);
    }, [id]);

    // Scroll Reveal Intersection Observer Animation for related products
    useEffect(() => {
        if (loading || relatedProducts.length === 0) return;

        const timer = setTimeout(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const el = entry.target;
                            const delay = el.getAttribute('data-delay') || '0';
                            setTimeout(() => {
                                el.classList.add('revealed');
                            }, parseInt(delay));
                            observer.unobserve(el);
                        }
                    });
                },
                {
                    threshold: 0,
                    rootMargin: '0px 0px 300px 0px',
                }
            );

            const elements = document.querySelectorAll('.reveal-item');
            elements.forEach((el) => {
                el.classList.remove('revealed');
                observer.observe(el);
            });

            return () => {
                elements.forEach((el) => observer.unobserve(el));
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [loading, relatedProducts]);

    if (loading) {
        return (
            <div>
                <Header />
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div>
                <Header />
                <div className="container mx-auto px-4 py-32 text-center bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-600">Không tìm thấy sản phẩm</h2>
                    <button 
                        onClick={() => navigate('/')} 
                        className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const discountedPrice = product.priceProduct - (product.priceProduct * product.discountProduct) / 100;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        })
            .format(price)
            .replace('₫', 'đ');
    };

    const handleAddToCart = async (showSuccess = true) => {
        if (product?.metadata?.size && !selectedSize) {
            setSizeError(true);
            return false;
        }

        

        try {
            const data = {
                productId: id,
                quantity,
            };
            const res = await requestAddToCart(data);
            await getCart();
            if (showSuccess) {
                setShowAddSuccessModal(true);
            }
            return true;
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
            return false;
        }
    };

    const handleBuyNow = async () => {
        const success = await handleAddToCart(false);
        if (success) {
            navigate('/cart');
        }
    };

    const brandName = product.categoryProduct?.nameCategory || 'Sneaker';

    const getProductCode = () => {
        if (!product) return '';
        const parts = product.nameProduct.split(' ');
        const lastPart = parts[parts.length - 1];
        if (lastPart && (lastPart.includes('-') || /\d/.test(lastPart))) {
            return lastPart;
        }
        return product._id.substring(18).toUpperCase();
    };

    const getProductColor = () => {
        if (!product) return 'Nhiều màu';
        const match = product.nameProduct.match(/[‘'“"\[]([^’'”"\]]+)[’'”"\]]/);
        if (match && match[1]) {
            return match[1];
        }
        return "Nhiều màu";
    };

    const uniqueImages = product ? [...new Set(product.imagesProduct || [])] : [];

    return (
        <div className="bg-white min-h-screen pt-32">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* 1. TOP LAYOUT SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-12">
                    
                    {/* Left Column: Product Image Gallery */}
                    <div className="lg:col-span-7">
                        <div className="flex gap-4 items-start">
                            {/* Vertical Thumbnails List */}
                            {(() => {
                                return (
                                    <>
                                        {uniqueImages.length > 1 && (
                                            <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                                                {uniqueImages.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => setSelectedImage(index)}
                                                        className={`cursor-pointer w-20 h-20 border flex items-center justify-center p-1 bg-white transition-all ${
                                                            selectedImage === index
                                                                ? 'border-black'
                                                                : 'border-gray-200 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt=""
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Main Image Container */}
                                        <div className="flex-1 relative border border-gray-100 flex items-center justify-center p-4 bg-white select-none">
                                            <div 
                                                className="h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden w-full relative cursor-zoom-in"
                                                onMouseMove={handleMouseMove}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseEnter={() => setZoomState(prev => ({ ...prev, showZoom: true }))}
                                            >
                                                <img
                                                    src={uniqueImages[selectedImage] || 'https://via.placeholder.com/500'}
                                                    alt={product.nameProduct}
                                                    className="max-w-full max-h-full object-contain pointer-events-none"
                                                />

                                                {/* Gallery Slider Arrows */}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage(prev => prev > 0 ? prev - 1 : uniqueImages.length - 1);
                                                    }}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full border shadow-sm flex items-center justify-center transition cursor-pointer z-30"
                                                >
                                                    <LeftOutlined className="text-gray-600" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage(prev => prev < uniqueImages.length - 1 ? prev + 1 : 0);
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full border shadow-sm flex items-center justify-center transition cursor-pointer z-30"
                                                >
                                                    <RightOutlined className="text-gray-600" />
                                                </button>

                                                {/* Magnifier Lens */}
                                                {zoomState.showZoom && (
                                                    <div 
                                                        className="absolute hidden lg:block border border-gray-300/40 bg-white/35 pointer-events-none z-20 shadow-inner"
                                                        style={{
                                                            width: '200px',
                                                            height: '200px',
                                                            left: `${zoomState.lensX}px`,
                                                            top: `${zoomState.lensY}px`,
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Zoom Preview Box (placed outside overflow-hidden) */}
                                            {zoomState.showZoom && (
                                                <div 
                                                    className="absolute hidden lg:block left-[103%] top-0 w-[500px] h-[500px] border border-gray-200 shadow-2xl bg-white z-40 overflow-hidden rounded-2xl"
                                                    style={{
                                                        backgroundImage: `url(${uniqueImages[selectedImage] || 'https://via.placeholder.com/500'})`,
                                                        backgroundPosition: `${zoomState.bgX}% ${zoomState.bgY}%`,
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundSize: '250% 250%',
                                                    }}
                                                />
                                            )}

                                            {/* Discount Badge overlay */}
                                            {product.discountProduct > 0 && (
                                                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded shadow-sm">
                                                    -{product.discountProduct}%
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Right Column: Product Detail Attributes */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Breadcrumbs */}
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <Link to="/" className="hover:text-black transition">Trang chủ</Link>
                            <span>»</span>
                            <span>Thương hiệu</span>
                            <span>»</span>
                            <span className="capitalize font-medium">{brandName}</span>
                            <span>»</span>
                            <span className="text-gray-800 font-semibold truncate max-w-[200px]">{product.nameProduct}</span>
                        </div>

                        {/* Product Title */}
                        <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                            {product.nameProduct}
                        </h1>

                        {/* Price Area */}
                        <div>
                            {product.discountProduct > 0 ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(product.priceProduct)}
                                    </span>
                                    <span className="text-xl font-bold text-red-600">
                                        {formatPrice(discountedPrice)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-black">
                                    {formatPrice(product.priceProduct)}
                                </span>
                            )}
                        </div>

                        {/* Size Selector */}
                        {product.metadata?.size && (
                            <div className="py-3 border-t border-b border-gray-100 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-500">Kích thước:</span>
                                    <button 
                                        onClick={() => setShowSizeGuide(true)}
                                        className="text-sm font-bold text-black hover:text-gray-700 flex items-center gap-1.5 transition bg-transparent border-none cursor-pointer p-0"
                                    >
                                        {/* Ruler Icon */}
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14h6m-6 4h3m-3-8h3" />
                                        </svg>
                                        Hướng dẫn chọn size
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.metadata.size.split(',').map(s => s.trim()).map(sizeVal => (
                                        <button
                                            key={sizeVal}
                                            onClick={() => {
                                                setSelectedSize(sizeVal);
                                                setSizeError(false);
                                            }}
                                            className={`w-12 h-10 font-bold border transition-all duration-200 cursor-pointer text-xs ${
                                                selectedSize === sizeVal
                                                    ? 'border-black bg-black text-white'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                            }`}
                                        >
                                            {sizeVal}
                                        </button>
                                    ))}
                                </div>
                                {sizeError && (
                                    <p className="text-red-500 text-xs font-semibold mt-1">
                                        Vui lòng chọn size của bạn
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Inventory status */}
                        <div className="flex items-center gap-2">
                            {product.stockProduct > 0 ? (
                                <span className="border border-green-500 text-green-500 rounded-full px-3 py-0.5 text-xs font-semibold">
                                    Còn hàng
                                </span>
                            ) : (
                                <span className="border border-red-500 text-red-500 rounded-full px-3 py-0.5 text-xs font-semibold">
                                    Hết hàng
                                </span>
                            )}
                        </div>

                        {/* Product Description Block (Matching User Screenshot) */}
                        <div className="space-y-1.5 text-sm text-gray-800 pt-2">
                            <p className="font-bold text-black text-sm">Mô tả sản phẩm :</p>
                            <p className="pl-1 text-gray-700">- Thương hiệu : {brandName}</p>
                            <p className="pl-1 text-gray-700">- Màu sắc : {getProductColor()}</p>
                            <p className="pl-1 text-gray-700">- Mã sản phẩm : {getProductCode()}</p>
                        </div>

                        {/* Quantity and Actions Row (Matching User Screenshot) */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-gray-200 h-12 w-28 bg-white shrink-0 select-none">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-full flex items-center justify-center text-black font-extrabold text-sm hover:bg-gray-50 transition cursor-pointer border-none bg-transparent disabled:opacity-30"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="flex-1 text-center font-bold text-sm text-black">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stockProduct, quantity + 1))}
                                    className="w-8 h-full flex items-center justify-center text-black font-extrabold text-sm hover:bg-gray-50 transition cursor-pointer border-none bg-transparent disabled:opacity-30"
                                    disabled={quantity >= product.stockProduct}
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={() => handleAddToCart(true)}
                                className="flex-1 h-12 bg-[#3f3f3f] hover:bg-[#2f2f2f] text-white font-bold text-sm tracking-wider uppercase transition cursor-pointer border-none shadow-sm flex items-center justify-center disabled:opacity-50"
                                disabled={product.stockProduct === 0}
                            >
                                Thêm vào giỏ
                            </button>

                            {/* Buy Now Button */}
                            <button
                                onClick={handleBuyNow}
                                className="flex-1 h-12 bg-white hover:bg-gray-50 text-black font-bold text-sm tracking-wider uppercase transition cursor-pointer border border-black shadow-sm flex items-center justify-center disabled:opacity-50"
                                disabled={product.stockProduct === 0}
                            >
                                Mua ngay
                            </button>
                        </div>

                    </div>
                </div>

                {/* 2. TABS SECTION (Centered tabs layout) */}
                <div className="border-t border-gray-200 pt-10 mb-12">
                    <div className="flex justify-center gap-8 border-b border-gray-200 pb-3 mb-8">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`text-sm font-semibold tracking-wider pb-2 transition cursor-pointer border-b-2 bg-transparent border-none ${
                                activeTab === 'description'
                                    ? 'text-black border-black font-bold'
                                    : 'text-gray-400 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`text-sm font-semibold tracking-wider pb-2 transition cursor-pointer border-b-2 bg-transparent border-none ${
                                activeTab === 'info'
                                    ? 'text-black border-black font-bold'
                                    : 'text-gray-400 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Thông tin bổ sung
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`text-sm font-semibold tracking-wider pb-2 transition cursor-pointer border-b-2 bg-transparent border-none ${
                                activeTab === 'reviews'
                                    ? 'text-black border-black font-bold'
                                    : 'text-gray-400 border-transparent hover:text-gray-700'
                            }`}
                        >
                            Đánh giá {feedbacks.length}
                        </button>
                    </div>

                    {/* Tab contents */}
                    <div className="max-w-4xl mx-auto text-gray-700 text-sm leading-relaxed space-y-6">
                        {activeTab === 'description' && (
                            <div className="space-y-6">
                                <p>{product.descriptionProduct}</p>
                                
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">Độ bám</h3>
                                    <p>Phần đế ngoài sử dụng chất liệu cao su đúc chuyên dụng với công thức chống mài mòn vượt trội, mang lại độ bám đường ổn định trên mọi mặt sân. Thiết kế gai cao su giúp tăng diện tích tiếp xúc, hỗ trợ người dùng tự tin tăng tốc và thay đổi hướng đột ngột mà vẫn giữ thăng bằng tối ưu.</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">Độ đệm</h3>
                                    <p>Sở hữu công nghệ đệm khí đàn hồi cao được phân bổ ở phần gót và bàn chân, giúp giảm chấn lực hiệu quả trong từng bước nhảy. Lớp đệm êm ái hấp thụ xung lực từ mặt đất tốt, giảm áp lực tối đa lên vùng mắt cá chân và khớp gối khi vận động cường độ cao.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="border border-gray-200">
                                <div className="grid grid-cols-3 border-b border-gray-100 py-3.5 px-4 bg-gray-50/50">
                                    <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">Thuộc tính</span>
                                    <span className="col-span-2 font-medium text-gray-800 text-xs uppercase tracking-wider">Thông tin chi tiết</span>
                                </div>
                                {product.metadata?.author && (
                                    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-4">
                                        <span className="font-semibold text-gray-500">Màu sắc</span>
                                        <span className="col-span-2 text-gray-700">{product.metadata.author}</span>
                                    </div>
                                )}
                                {product.metadata?.publisher && (
                                    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-4">
                                        <span className="font-semibold text-gray-500">Chất liệu</span>
                                        <span className="col-span-2 text-gray-700">{product.metadata.publisher}</span>
                                    </div>
                                )}
                                {product.metadata?.publishingHouse && (
                                    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-4">
                                        <span className="font-semibold text-gray-500">Đối tượng</span>
                                        <span className="col-span-2 text-gray-700">{product.metadata.publishingHouse}</span>
                                    </div>
                                )}
                                {product.metadata?.translator && (
                                    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-4">
                                        <span className="font-semibold text-gray-500">Xuất xứ</span>
                                        <span className="col-span-2 text-gray-700">{product.metadata.translator}</span>
                                    </div>
                                )}
                                {product.metadata?.coverType && (
                                    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-4">
                                        <span className="font-semibold text-gray-500">Tình trạng</span>
                                        <span className="col-span-2 text-gray-700">{product.metadata.coverType}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 py-3 px-4">
                                    <span className="font-semibold text-gray-500">Tồn kho</span>
                                    <span className="col-span-2 text-gray-700">{product.stockProduct} đôi sẵn có</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                {feedbacks.length > 0 ? (
                                    feedbacks.map((fb, idx) => (
                                        <div key={fb._id || idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm uppercase">
                                                        {fb.userId?.fullName?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {fb.userId?.fullName || 'Người dùng ẩn danh'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={`text-lg ${i < fb.rating ? 'text-amber-400' : 'text-gray-200'}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-1">
                                                {fb.content}
                                            </p>
                                            {fb.imagesFeedback && fb.imagesFeedback.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {fb.imagesFeedback.map((img, imgIdx) => (
                                                        <img 
                                                            key={imgIdx} 
                                                            src={img} 
                                                            alt="Review attachment" 
                                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 italic">
                                        Chưa có đánh giá nào cho sản phẩm này.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. RELATED PRODUCTS SECTION (Sản phẩm tương tự) */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-gray-200 pt-10">
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">
                                Sản phẩm tương tự
                            </h2>
                            <div className="flex-grow h-[1px] bg-gray-200" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((item, idx) => (
                                <CardBody key={item._id} dataItem={item} index={idx} />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Size Guide Modal */}
            <Modal
                title={<span className="font-bold text-lg text-gray-800">Hướng dẫn chọn size</span>}
                open={showSizeGuide}
                onCancel={() => setShowSizeGuide(false)}
                footer={null}
                width={700}
                centered
            >
                <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 text-sm text-gray-700 leading-relaxed scrollbar-custom">
                    
                    {/* Header */}
                    <div className="text-center space-y-2 pb-4 border-b border-gray-100">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                            HƯỚNG DẪN CHỌN SIZE GIÀY
                        </h3>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                            CÁCH ĐO CỠ CHÂN VÀ XÁC ĐỊNH SIZE GIÀY VIỆT NAM, US, UK CHUẨN XÁC
                        </p>
                    </div>

                    {/* Step Guide */}
                    <div className="space-y-4">
                        <p className="italic text-gray-600">
                            Chọn được giày vừa size luôn là một bài toán khó đối với các khách hàng thường xuyên mua giày online. 
                            Đặc biệt khi chọn giày thể thao bạn cần size vừa vặn để tăng hiệu quả luyện tập. Hãy cùng thực hiện nhanh những bước sau đây để tìm ra size giày chuẩn nhất dành cho mình nhé.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                            <p className="font-bold text-gray-800 text-sm">CHUẨN BỊ:</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                <li>1 tờ giấy trắng lớn, phải to hơn bàn chân bạn.</li>
                                <li>1 cây bút chì.</li>
                                <li>1 cây thước đo.</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <p className="font-bold text-gray-800 text-sm">CÁCH THỰC HIỆN:</p>
                            <p className="italic text-xs text-gray-500">Quy ước: Cỡ giày là N | Chiều dài bàn chân là L</p>
                            
                            <div className="space-y-2 pl-2">
                                <p className="font-semibold text-gray-800">Bước 1: Vẽ kích cỡ chân</p>
                                <p className="text-gray-600 pl-4 font-normal">
                                    Đặt tờ giấy xuống sàn nhà, sau đó đặt bàn chân của bạn thật chắc chắn lên tờ giấy.
                                    Dùng bút chì để vẽ lại khung bàn chân của mình cho thật chuẩn. Bạn nên giữ bút chì thẳng đứng và vuông góc với tờ giấy để vẽ được chính xác hơn.
                                </p>
                                
                                <p className="font-semibold text-gray-800">Bước 2: Đánh dấu số đo chiều dài và chiều rộng</p>
                                <p className="text-gray-600 pl-4 font-normal">
                                    Sử dụng bút chì để vẽ một đường thẳng chạm vào các điểm cao nhất, thấp nhất và 2 bên của bản phác thảo bàn chân để đo chiều dài chân.
                                </p>

                                <p className="font-semibold text-gray-800">Bước 3: Xác định chiều dài bàn chân (L)</p>
                                <p className="text-gray-600 pl-4 font-normal">
                                    Sử dụng thước kẻ để đo chiều dài từ phía dưới dòng kẻ trên đến dòng kẻ dưới mà bạn đã vẽ.
                                    Sau khi đo xong, bạn có thể làm tròn số trong khoảng 0.5 cm. Bạn nên làm tròn xuống để trừ hao cho sai lệch khi vẽ.
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center space-y-2">
                            <p className="font-extrabold text-red-600 text-sm uppercase tracking-wider">Công thức tính size:</p>
                            <p className="text-base font-black text-gray-900">
                                SIZE GIÀY = CHIỀU DÀI CHÂN + 0.5 CM <span className="text-xs font-normal text-gray-500">(Trừ hao chiều ngang + vớ)</span>
                            </p>
                            <p className="text-xs text-gray-600 italic">
                                VD: Chiều dài bàn chân đo được là L = 25 cm thì size giày phù hợp sẽ là 25.5 cm (tương đương size 40.5 của Nike, size 40 2/3 của Adidas, size 40.5 của Asics...)
                            </p>
                        </div>
                    </div>

                    {/* Size Chart Table */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <p className="font-bold text-gray-800 text-sm">BẢNG QUY ĐỔI SIZE GIÀY CHUẨN (CM):</p>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-center border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                        <th className="py-2 px-3 border-r border-gray-200">Chiều dài chân (cm)</th>
                                        <th className="py-2 px-3 border-r border-gray-200">Size Việt Nam/EU</th>
                                        <th className="py-2 px-3 border-r border-gray-200">Size US (Nam)</th>
                                        <th className="py-2 px-3">Size UK</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 divide-y divide-gray-100">
                                    <tr className="hover:bg-gray-50"><td className="py-2 border-r border-gray-200">22.0 - 22.5</td><td className="py-2 border-r border-gray-200 font-bold text-black">36</td><td className="py-2 border-r border-gray-200">4.5</td><td className="py-2">3.5</td></tr>
                                    <tr className="bg-gray-50/50 hover:bg-gray-50"><td className="py-2 border-r border-gray-200">22.5 - 23.0</td><td className="py-2 border-r border-gray-200 font-bold text-black">37</td><td className="py-2 border-r border-gray-200">5.0</td><td className="py-2">4.0</td></tr>
                                    <tr className="hover:bg-gray-50"><td className="py-2 border-r border-gray-200">23.0 - 23.5</td><td className="py-2 border-r border-gray-200 font-bold text-black">38</td><td className="py-2 border-r border-gray-200">6.0</td><td className="py-2">5.0</td></tr>
                                    <tr className="bg-gray-50/50 hover:bg-gray-50"><td className="py-2 border-r border-gray-200">23.5 - 24.0</td><td className="py-2 border-r border-gray-200 font-bold text-black">39</td><td className="py-2 border-r border-gray-200">7.0</td><td className="py-2">6.0</td></tr>
                                    <tr className="hover:bg-gray-50"><td className="py-2 border-r border-gray-200">24.0 - 24.5</td><td className="py-2 border-r border-gray-200 font-bold text-black">40</td><td className="py-2 border-r border-gray-200">7.5</td><td className="py-2">6.5</td></tr>
                                    <tr className="bg-gray-50/50 hover:bg-gray-50"><td className="py-2 border-r border-gray-200">24.5 - 25.0</td><td className="py-2 border-r border-gray-200 font-bold text-black">41</td><td className="py-2 border-r border-gray-200">8.5</td><td className="py-2">7.5</td></tr>
                                    <tr className="hover:bg-gray-50"><td className="py-2 border-r border-gray-200">25.0 - 25.5</td><td className="py-2 border-r border-gray-200 font-bold text-black">42</td><td className="py-2 border-r border-gray-200">9.0</td><td className="py-2">8.0</td></tr>
                                    <tr className="bg-gray-50/50 hover:bg-gray-50"><td className="py-2 border-r border-gray-200">25.5 - 26.0</td><td className="py-2 border-r border-gray-200 font-bold text-black">43</td><td className="py-2 border-r border-gray-200">10.0</td><td className="py-2">9.0</td></tr>
                                    <tr className="hover:bg-gray-50"><td className="py-2 border-r border-gray-200">26.0 - 26.5</td><td className="py-2 border-r border-gray-200 font-bold text-black">44</td><td className="py-2 border-r border-gray-200">10.5</td><td className="py-2">9.5</td></tr>
                                    <tr className="bg-gray-50/50 hover:bg-gray-50"><td className="py-2 border-r border-gray-200">26.5 - 27.0</td><td className="py-2 border-r border-gray-200 font-bold text-black">45</td><td className="py-2 border-r border-gray-200">11.5</td><td className="py-2">10.5</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Added to Cart Success Modal (Matching User Screenshot) */}
            <Modal
                open={showAddSuccessModal}
                onCancel={() => setShowAddSuccessModal(false)}
                footer={null}
                width={850}
                centered
                closeIcon={
                    <div className="border border-gray-300 p-1 bg-white hover:bg-gray-50 transition cursor-pointer">
                        <span className="text-sm font-light px-1">✕</span>
                    </div>
                }
                title={null}
            >
                <div className="pt-4 pb-2 space-y-6">
                    {/* Header */}
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-4">
                        ĐÃ THÊM VÀO GIỎ!
                    </h3>

                    {/* Content Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Column: Product Info */}
                        <div className="md:col-span-6 flex gap-4">
                            {/* Product Image */}
                            <img
                                src={uniqueImages[selectedImage] || 'https://via.placeholder.com/150'}
                                alt={product.nameProduct}
                                className="w-40 h-40 object-contain bg-gray-50 border border-gray-100 p-2 flex-shrink-0"
                            />
                            
                            {/* Product Details */}
                            <div className="space-y-1 text-sm text-gray-600">
                                <h4 className="font-extrabold text-black uppercase leading-snug">
                                    {product.nameProduct}
                                </h4>
                                <p className="font-bold text-black text-base">
                                    {formatPrice(discountedPrice)}
                                </p>
                                <p className="pt-2"><span className="font-semibold text-gray-800">Màu sắc:</span> {getProductColor()}</p>
                                <p>
                                    <span className="font-semibold text-gray-800">Kích cỡ:</span> {selectedSize || 'Chưa chọn'}
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-800">Số lượng:</span> {quantity}
                                </p>
                            </div>
                        </div>

                        {/* Divider Line on Desktop */}
                        <div className="hidden md:block w-[1px] bg-gray-200 h-40 self-center" />

                        {/* Right Column: Cart Summary */}
                        <div className="md:col-span-5 space-y-4">
                            <div>
                                <h4 className="font-extrabold text-black text-base uppercase tracking-wider mb-2">
                                    GIỎ HÀNG CỦA BẠN
                                </h4>
                                {(() => {
                                    const cartData = cart?.cart;
                                    const cartProducts = cartData?.products || [];
                                    const totalItems = cartProducts.filter(item => item.productId && item.productId._id).length;
                                    
                                    const getPrice = (p) => {
                                        const price = p.priceProduct || 0;
                                        const discount = p.discountProduct || 0;
                                        return price - (price * discount) / 100;
                                    };
                                    const cartSubtotal = cartProducts.reduce((sum, item) => {
                                        if (!item.productId) return sum;
                                        return sum + getPrice(item.productId) * item.quantity;
                                    }, 0);

                                    return (
                                        <div className="space-y-2.5 text-sm text-gray-600">
                                            <p className="font-semibold text-black">{totalItems} mặt hàng</p>
                                            <div className="flex justify-between">
                                                <span>Tổng Giá Trị Sản Phẩm:</span>
                                                <span className="font-semibold text-black">{formatPrice(cartSubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Tổng Phí Giao Hàng:</span>
                                                <span className="text-green-600 font-semibold">Miễn phí</span>
                                            </div>
                                            
                                            <div className="border-t border-black pt-2 flex justify-between font-extrabold text-black text-base">
                                                <span>Tổng cộng:</span>
                                                <span>{formatPrice(cartSubtotal)}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 italic mt-0.5">(Đã bao gồm thuế)</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            <p className="text-xs font-bold text-green-700 leading-tight">
                                Hội viên được miễn phí vận chuyển không giới hạn
                            </p>

                            {/* Buttons */}
                            <div className="space-y-2.5 pt-2">
                                <button
                                    onClick={() => {
                                        setShowAddSuccessModal(false);
                                        navigate('/checkout');
                                    }}
                                    className="w-full h-12 bg-[#2a6f4d] hover:bg-[#1f533a] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer border-none flex items-center justify-between px-6"
                                >
                                    <span>Thanh toán ngay</span>
                                    <span>→</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setShowAddSuccessModal(false);
                                        navigate('/cart');
                                    }}
                                    className="w-full h-12 bg-white hover:bg-gray-50 text-black font-bold text-xs uppercase tracking-wider transition cursor-pointer border border-black flex items-center justify-between px-6"
                                >
                                    <span>Xem lại giỏ hàng</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </Modal>

            <Footer />
        </div>
    );
}

export default DetailProduct;
