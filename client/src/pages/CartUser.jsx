import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../hooks/useStore';
import { Trash2, Plus, Minus, Tag, Heart } from 'lucide-react';
import { requestApplyCounpon, requestDeleteProductCart, requestUpdateQuantity } from '../config/CartRequest';
import { message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

function CartUser() {
    const { cart, getCart } = useStore();
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [removingIds, setRemovingIds] = useState([]);
    const [couponInput, setCouponInput] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const cartData = cart?.cart;
        const coupons = cart?.coupons || [];
        if (cartData && cartData.couponId) {
            const matched = coupons.find(c => c._id === cartData.couponId);
            if (matched) {
                setSelectedCoupon(matched);
            } else if (!selectedCoupon) {
                const discountAmount = cartData.totalPrice - cartData.finalPrice;
                const discountPercent = cartData.totalPrice > 0 ? Math.round((discountAmount / cartData.totalPrice) * 100) : 0;
                if (discountPercent > 0) {
                    setSelectedCoupon({
                        _id: cartData.couponId,
                        nameCoupon: 'ĐÃ ÁP DỤNG',
                        discount: discountPercent,
                        minPrice: 0
                    });
                }
            }
        } else {
            setSelectedCoupon(null);
        }
    }, [cart?.cart?.couponId, cart?.coupons]);

    // Favorites LocalStorage Helpers
    const getFavorites = () => {
        try {
            return JSON.parse(localStorage.getItem('wishlist') || '[]');
        } catch (e) {
            return [];
        }
    };

    const isFavorite = (productId) => {
        const favs = getFavorites();
        return favs.some(f => f._id === productId);
    };

    const handleToggleFavorite = (product) => {
        const favs = getFavorites();
        const isFav = favs.some(f => f._id === product._id);
        let nextFavs;
        if (isFav) {
            nextFavs = favs.filter(f => f._id !== product._id);
            message.success('Đã xoá khỏi danh sách yêu thích!');
        } else {
            nextFavs = [...favs, product];
            message.success('Đã thêm vào danh sách yêu thích!');
        }
        localStorage.setItem('wishlist', JSON.stringify(nextFavs));
        window.dispatchEvent(new Event('wishlist-update'));
        setRemovingIds(prev => [...prev]); // Force render update
    };

    const handleImmediateDelete = async (productId, itemId) => {
        setRemovingIds(prev => [...prev, itemId]);
        setTimeout(async () => {
            try {
                await requestDeleteProductCart(productId);
                await getCart();
                setRemovingIds(prev => prev.filter(id => id !== itemId));
            } catch (error) {
                message.error('Không thể xóa sản phẩm');
                setRemovingIds(prev => prev.filter(id => id !== itemId));
            }
        }, 500);
    };

    if (!cart || !cart.cart) {
        return (
            <div>
                <header>
                    <Header />
                </header>
                <div className="container mx-auto px-4 pt-32 pb-8">
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold text-gray-600">Giỏ hàng của bạn đang trống</h2>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const cartData = cart.cart;
    const products = (cartData.products || []).filter(item => item.productId && item.productId._id);
    const coupons = cart.coupons || [];

    // Calculate prices
    const calculateProductPrice = (product) => {
        const price = product.productId.priceProduct || 0;
        const discount = product.productId.discountProduct || 0;
        return price - (price * discount) / 100;
    };

    const calculateSubtotal = (product) => {
        return calculateProductPrice(product) * product.quantity;
    };

    const totalPrice = products.reduce((sum, product) => sum + calculateSubtotal(product), 0);

    const calculateDiscount = () => {
        if (!selectedCoupon) return 0;
        if (totalPrice < selectedCoupon.minPrice) return 0;
        return totalPrice * (selectedCoupon.discount / 100);
    };

    const discount = calculateDiscount();
    const finalPrice = totalPrice - discount;


    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleQuantityChange = async (productId, change) => {
        try {
            const data = {
                productId,
                newQuantity: change,
            };
            const res = await requestUpdateQuantity(data);
            await getCart();
            message.success(res.message);
        } catch (error) {
            message.error(error.response.data.message);
        }
    };




    const handleCheckout = async () => {
        await getCart();
        navigate('/checkout');
    };

    const handleApplyCouponByName = async () => {
        if (!couponInput.trim()) {
            message.warning('Vui lòng nhập mã giảm giá!');
            return;
        }
        
        try {
            const res = await requestApplyCounpon({ couponId: couponInput.trim() });
            message.success(res.message);
            await getCart();
            
            const matched = coupons.find(c => c.nameCoupon.toUpperCase() === couponInput.trim().toUpperCase());
            if (matched) {
                setSelectedCoupon(matched);
            } else {
                setSelectedCoupon({
                    nameCoupon: couponInput.trim(),
                    discount: Math.round(((res.metadata.totalPrice - res.metadata.finalPrice) / res.metadata.totalPrice) * 100),
                    minPrice: 0
                });
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!');
        }
    };

    const applyCoupon = async (coupon) => {
        if (totalPrice >= coupon.minPrice) {
            setSelectedCoupon(coupon);
            const counponId = coupon._id;
            const res = await requestApplyCounpon({ couponId: counponId });
            message.success(res.message);
        } else {
            message.error(`Đơn hàng tối thiểu ${formatPrice(coupon.minPrice)} để áp dụng mã này`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header>
                <Header />
            </header>

            <div className="container mx-auto px-4 pt-32 pb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Giỏ Hàng Của Bạn</h1>

                {products.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-xl mx-auto space-y-6 my-10 border border-gray-100">
                        <div className="text-6xl">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-700">Giỏ hàng của bạn đang trống</h2>
                        <p className="text-gray-500">Hãy quay lại trang chủ và chọn cho mình những đôi giày Sneaker ưng ý nhất nhé!</p>
                        <Link to="/">
                            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-md cursor-pointer border-none">
                                Tiếp Tục Mua Sắm
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {products.map((item) => {
                                const product = item.productId;
                                const priceAfterDiscount = calculateProductPrice(item);
                                const subtotal = calculateSubtotal(item);
                                return (
                                    <div 
                                        key={item._id} 
                                        className={`bg-white rounded-lg shadow flex gap-4 transition-all duration-500 ease-in-out ${
                                            removingIds.includes(item._id)
                                                ? 'opacity-0 scale-95 max-h-0 p-0 m-0 overflow-hidden border-none'
                                                : 'opacity-100 max-h-[300px] p-4'
                                        }`}
                                    >
                                        {/* Product Image */}
                                        <Link to={`/product/${product._id}`} className="flex-shrink-0">
                                            <img
                                                src={product.imagesProduct?.[0] || '/placeholder.jpg'}
                                                alt={product.nameProduct}
                                                className="w-20 h-28 object-cover rounded-md hover:opacity-90 transition"
                                            />
                                        </Link>

                                        {/* Product Info */}
                                        <div className="flex-grow">
                                            <Link to={`/product/${product._id}`}>
                                                <h3 className="text-base font-semibold text-gray-800 mb-1 hover:text-blue-600 transition">
                                                    {product.nameProduct}
                                                </h3>
                                            </Link>
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {product.descriptionProduct}
                                            </p>

                                            {product.metadata && (
                                                <div className="text-xs text-gray-500 mb-2">
                                                    <p>
                                                        {product.metadata.author} • {product.metadata.publisher}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mb-3">
                                                {product.discountProduct > 0 && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {formatPrice(product.priceProduct)}
                                                    </span>
                                                )}
                                                <span className="text-base font-bold text-red-600">
                                                    {formatPrice(priceAfterDiscount)}
                                                </span>
                                                {product.discountProduct > 0 && (
                                                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-semibold">
                                                        -{product.discountProduct}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleQuantityChange(item.productId._id, item.quantity - 1)
                                                        }
                                                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-semibold w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleQuantityChange(item.productId._id, item.quantity + 1)
                                                        }
                                                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 transition"
                                                        disabled={item.quantity >= product.stockProduct}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600">Tổng</p>
                                                    <p className="text-base font-bold text-gray-800">
                                                        {formatPrice(subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-between h-24 pl-2 self-start flex-shrink-0">
                                            <button
                                                onClick={() => handleImmediateDelete(item.productId._id, item._id)}
                                                className="text-gray-400 hover:text-red-600 transition cursor-pointer border-none bg-transparent p-1"
                                                title="Xoá khỏi giỏ hàng"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <button
                                                onClick={() => handleToggleFavorite(product)}
                                                className="transition cursor-pointer border-none bg-transparent p-1 mt-auto"
                                                title={isFavorite(product._id) ? "Xoá khỏi yêu thích" : "Thêm vào yêu thích"}
                                            >
                                                <Heart 
                                                    size={18} 
                                                    className={isFavorite(product._id) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"} 
                                                />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Tóm Tắt Đơn Hàng</h2>

                                {/* Coupon Section */}
                                <div className="mb-6 border-t border-gray-100 pt-4">
                                    <h3 className="text-base font-bold text-gray-800 mb-3.5 flex items-center gap-2">
                                        <Tag size={18} />
                                        Mã Giảm Giá
                                    </h3>

                                    {/* Selected Coupon Panel */}
                                    {selectedCoupon && (
                                        <div className="mb-3.5 p-3 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center transition-all duration-300">
                                            <div>
                                                <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Đã áp dụng mã</p>
                                                <p className="text-sm font-extrabold text-green-800">{selectedCoupon.nameCoupon} (-{selectedCoupon.discount}%)</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    setSelectedCoupon(null);
                                                    setCouponInput('');
                                                    await requestApplyCounpon({ couponId: null });
                                                    await getCart();
                                                    message.success('Đã hủy áp dụng mã giảm giá');
                                                }}
                                                className="text-xs font-bold text-red-500 hover:text-red-750 transition cursor-pointer border-none bg-transparent"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    )}

                                    {/* Coupon Input Field */}
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Nhập mã giảm giá..."
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black font-semibold uppercase tracking-wider"
                                        />
                                        <button
                                            onClick={handleApplyCouponByName}
                                            className="px-4 py-2 bg-black text-white hover:bg-gray-800 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-none"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 font-semibold mb-2">Hoặc chọn mã có sẵn bên dưới:</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-custom">
                                        {coupons.map((coupon) => {
                                            const isValid = totalPrice >= coupon.minPrice;
                                            const isSelected = selectedCoupon?._id === coupon._id;

                                            return (
                                                <button
                                                    key={coupon._id}
                                                    onClick={() => applyCoupon(coupon)}
                                                    disabled={!isValid}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                                                        isSelected
                                                            ? 'border-green-500 bg-green-50'
                                                            : isValid
                                                            ? 'border-gray-200 hover:border-blue-300'
                                                            : 'border-gray-200 opacity-50 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-blue-600">{coupon.nameCoupon}</span>
                                                        <span className="text-red-600 font-bold">-{coupon.discount}%</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        Đơn tối thiểu: {formatPrice(coupon.minPrice)}
                                                    </p>
                                                    {isSelected && (
                                                        <p className="text-xs text-green-600 mt-1 font-semibold">
                                                            ✓ Đã áp dụng
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Tạm tính</span>
                                        <span className="font-semibold">{formatPrice(totalPrice)}</span>
                                    </div>

                                    {selectedCoupon && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá ({selectedCoupon.nameCoupon})</span>
                                            <span className="font-semibold">-{formatPrice(discount)}</span>
                                        </div>
                                    )}

                                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                                        <span>Tổng cộng</span>
                                        <span className="text-red-600">{formatPrice(finalPrice)}</span>
                                    </div>
                                </div>

                                <Link to="/checkout">
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition mt-6 cursor-pointer border-none"
                                    >
                                        Tiến Hành Thanh Toán
                                    </button>
                                </Link>
                                <Link to="/">
                                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold mt-3 hover:bg-gray-50 transition cursor-pointer">
                                        Tiếp Tục Mua Sắm
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <Footer />
        </div>
    );
}

export default CartUser;
