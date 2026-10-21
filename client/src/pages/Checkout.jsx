import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../hooks/useStore';
import { message } from 'antd';
import { requestUpdateInfoCart } from '../config/CartRequest';
import { requestPayment } from '../config/paymentRequest';
import codLogo from '../assets/images/payment-cod.png';
import momoLogo from '../assets/images/payment-momo.png';
import vnpayLogo from '../assets/images/payment-vnpay.png';

function Checkout() {
    const { cart, getCart } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        getCart();
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('error') === 'vnpay_failed') {
            message.warning('Giao dịch thanh toán qua VNPay đã bị hủy hoặc chưa hoàn tất.');
        }
    }, []);

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        email: '',
        note: '',
    });

    if (!cart || !cart.cart) {
        return (
            <div>
                <header>
                    <Header />
                </header>
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold text-gray-600">Không có sản phẩm để thanh toán</h2>
                    </div>
                </div>
            </div>
        );
    }

    const cartData = cart.cart;
    const products = (cartData.products || []).filter(item => item.productId && item.productId._id);

    const formatPrice = (price) => {
        const num = Number(price);
        if (isNaN(num)) return '0đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num).replace('₫', 'đ');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();

        // Validate form
        if (!shippingInfo.fullName || !shippingInfo.phoneNumber || !shippingInfo.address || !shippingInfo.email) {
            message.error('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }

        try {
            const data = {
                fullName: shippingInfo.fullName,
                phoneNumber: shippingInfo.phoneNumber,
                address: shippingInfo.address,
                email: shippingInfo.email,
            };
            await requestUpdateInfoCart(data);
            const typePayment = paymentMethod;

            if (paymentMethod === 'cod') {
                const res = await requestPayment({ typePayment: typePayment });
                await getCart();
                message.success('Đặt hàng thành công!');
                navigate(`/payment-success/${res.metadata._id}`);
            } else if (paymentMethod === 'momo') {
                const res = await requestPayment({ typePayment: typePayment });
                await getCart();
                const newWin = window.open(res.metadata.payUrl, '_blank');
                if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                    window.location.href = res.metadata.payUrl;
                } else {
                    message.info('Vui lòng hoàn tất thanh toán trên cổng MoMo');
                }
            } else if (paymentMethod === 'vnpay') {
                const res = await requestPayment({ typePayment: typePayment });
                await getCart();
                const newWin = window.open(res.metadata, '_blank');
                if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                    window.location.href = res.metadata;
                } else {
                    message.info('Vui lòng hoàn tất thanh toán trên cổng VNPay');
                }
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
        }
    };

    const paymentMethods = [
        {
            id: 'cod',
            name: 'Thanh toán khi nhận hàng (COD)',
            logo: codLogo,
            description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        },
        {
            id: 'momo',
            name: 'Ví MoMo',
            logo: momoLogo,
            description: 'Thanh toán qua ví điện tử MoMo',
        },
        {
            id: 'vnpay',
            name: 'VNPay',
            logo: vnpayLogo,
            description: 'Thanh toán qua cổng VNPay',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header>
                <Header />
            </header>

            <div className="container mx-auto px-4 pt-32 pb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh Toán</h1>

                <form onSubmit={handleSubmitOrder}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Section - Shipping Info & Payment */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Information */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Thông Tin Giao Hàng</h2>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Họ và tên <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={shippingInfo.fullName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập họ và tên"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={shippingInfo.phoneNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập số điện thoại"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="email"
                                            value={shippingInfo.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nhập email"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Địa chỉ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={shippingInfo.address}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Số nhà, tên đường"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                        <textarea
                                            name="note"
                                            value={shippingInfo.note}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ghi chú về đơn hàng (tùy chọn)"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Phương Thức Thanh Toán</h2>

                                <div className="space-y-3">
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                paymentMethod === method.id
                                                    ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value={method.id}
                                                        checked={paymentMethod === method.id}
                                                        onChange={() => setPaymentMethod(method.id)}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="w-11 h-11 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                                    <img
                                                        src={method.logo}
                                                        alt={method.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <span className="font-bold text-gray-900 block text-sm sm:text-base">
                                                        {method.name}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Đơn Hàng</h2>

                                {/* Products List */}
                                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                    {products.map((item) => {
                                        const product = item.productId;
                                        const price = product.priceProduct;
                                        const discount = product.discountProduct || 0;
                                        const priceAfterDiscount = price - (price * discount) / 100;
                                        const subtotal = priceAfterDiscount * item.quantity;

                                        return (
                                            <div key={item._id} className="flex gap-3 pb-4 border-b border-gray-200">
                                                <img
                                                    src={product.imagesProduct?.[0]}
                                                    alt={product.nameProduct}
                                                    className="w-16 h-20 object-cover rounded"
                                                />
                                                <div className="flex-grow">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                                                        {product.nameProduct}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        Số lượng: {item.quantity}
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {formatPrice(subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Price Summary */}
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Tạm tính</span>
                                        <span className="font-semibold">{formatPrice(cartData.totalPrice)}</span>
                                    </div>

                                    {cartData.couponId && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá</span>
                                            <span className="font-semibold">
                                                -{formatPrice(cartData.totalPrice - cartData.finalPrice)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-700">
                                        <span>Phí vận chuyển</span>
                                        <span className="font-semibold">Miễn phí</span>
                                    </div>

                                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                                        <span>Tổng cộng</span>
                                        <span className="text-red-600">
                                            {formatPrice(cartData.couponId ? cartData.finalPrice : cartData.totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition mt-6"
                                >
                                    Đặt Hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Checkout;
