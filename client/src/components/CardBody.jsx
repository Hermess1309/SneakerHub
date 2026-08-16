import { Card, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { requestAddToCart } from '../config/CartRequest';

function CardBody({ dataItem, index = 0 }) {
    const [imageError, setImageError] = useState(false);
    const [hoveredImageIndex, setHoveredImageIndex] = useState(0);
    const { getCart, dataUser } = useStore();

    // Favorites LocalStorage Helpers
    const getFavorites = () => {
        try {
            return JSON.parse(localStorage.getItem('wishlist') || '[]');
        } catch (e) {
            return [];
        }
    };

    const isFavorite = () => {
        const favs = getFavorites();
        return favs.some(f => f._id === dataItem._id);
    };

    const handleToggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dataUser || !dataUser._id) {
            message.warning('Vui lòng đăng nhập để lưu sản phẩm yêu thích!');
            return;
        }

        const favs = getFavorites();
        const isFav = favs.some(f => f._id === dataItem._id);
        let nextFavs;
        if (isFav) {
            nextFavs = favs.filter(f => f._id !== dataItem._id);
            message.success('Đã xoá khỏi danh sách yêu thích!');
        } else {
            nextFavs = [...favs, dataItem];
            message.success('Đã thêm vào danh sách yêu thích!');
        }
        localStorage.setItem('wishlist', JSON.stringify(nextFavs));
        window.dispatchEvent(new Event('wishlist-update'));
        setHoveredImageIndex(prev => prev);
    };

    // Calculate discounted price
    const discountedPrice = dataItem.priceProduct - (dataItem.priceProduct * dataItem.discountProduct) / 100;

    // Format price to VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        })
            .format(price)
            .replace('₫', 'đ'); // Format with lowercase 'đ'
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop navigation to detail page
        try {
            const data = {
                productId: dataItem._id,
                quantity: 1,
            };
            const res = await requestAddToCart(data);
            await getCart();
            message.success(res.message);
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        }
    };

    return (
        <div className="reveal-item h-full" data-delay={(index % 4) * 50}>
            <Card
                hoverable
                onMouseLeave={() => setHoveredImageIndex(0)}
                className="h-full overflow-hidden rounded-none border border-gray-100 hover:border-black hover:shadow-none transition-all duration-300 bg-white group flex flex-col justify-between relative"
                bodyStyle={{ padding: '16px 12px 12px 12px' }}
                cover={
                    <div className="relative overflow-hidden h-64 bg-white flex items-center justify-center p-4">
                        <Link to={`/product/${dataItem._id}`} className="w-full h-full flex items-center justify-center">
                            <img
                                alt={dataItem.nameProduct}
                                src={
                                    imageError
                                        ? 'https://via.placeholder.com/300x300?text=No+Image'
                                        : (dataItem.imagesProduct?.[hoveredImageIndex] || dataItem.imagesProduct?.[0])
                                }
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:-translate-y-3"
                                onError={() => setImageError(true)}
                            />
                        </Link>

                        {/* Image Thumbnails on Hover with horizontal scrolling */}
                        {dataItem.imagesProduct && dataItem.imagesProduct.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gray-100/90 py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <div className="flex gap-2 overflow-x-auto scrollbar-custom pb-1 justify-start">
                                    {dataItem.imagesProduct.map((imgUrl, idx) => (
                                        <div
                                            key={idx}
                                            onMouseEnter={() => setHoveredImageIndex(idx)}
                                            className={`w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5 border cursor-pointer transition-all duration-200 flex-shrink-0 ${
                                                hoveredImageIndex === idx 
                                                    ? 'border-black border-2 scale-105 shadow-sm' 
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            <img 
                                                src={imgUrl} 
                                                alt={`${dataItem.nameProduct} angle ${idx + 1}`}
                                                className="w-full h-full object-contain rounded-md" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trả góp 0% Badge */}
                        <div className="absolute top-3 left-3">
                            <span className="bg-yellow-400 text-black font-semibold text-[10px] px-2 py-0.5 rounded shadow-sm">
                                Trả góp 0%
                            </span>
                        </div>

                        {/* Quick Favorite Button (Heart icon) on Hover */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <button
                                onClick={handleToggleFavorite}
                                className="bg-white text-gray-800 p-2 rounded-full border border-gray-200 shadow-sm hover:border-black hover:text-black transition-colors duration-200 cursor-pointer flex items-center justify-center"
                                title="Thêm vào yêu thích"
                            >
                                {isFavorite() ? (
                                    <HeartFilled className="text-sm text-red-500" />
                                ) : (
                                    <HeartOutlined className="text-sm" />
                                )}
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col justify-between flex-1">
                    <div className="mb-3 text-center">
                        <h3 className="min-h-[40px]">
                            <Link 
                                to={`/product/${dataItem._id}`}
                                className="font-normal !text-black hover:!text-black text-sm line-clamp-2 transition-colors duration-200"
                            >
                                {dataItem.nameProduct}
                            </Link>
                        </h3>
                    </div>
 
                    <div className="mt-auto">
                        {dataItem.discountProduct > 0 ? (
                            /* Discount side-by-side centered */
                            <div className="flex justify-center items-center gap-2">
                                <span className="text-sm text-gray-500 line-through font-bold">
                                    {formatPrice(dataItem.priceProduct)}
                                </span>
                                <span className="text-sm font-bold text-red-600">
                                    {formatPrice(discountedPrice)}
                                </span>
                            </div>
                        ) : (
                            /* Single price centered */
                            <div className="text-center">
                                <span className="text-sm font-bold text-black">
                                    {formatPrice(dataItem.priceProduct)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default CardBody;
