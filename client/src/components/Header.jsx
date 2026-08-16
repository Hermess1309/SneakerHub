import { useEffect, useState } from 'react';
import logo from '../assets/images/logo.jpg';
import { Button, Input, Avatar, Dropdown, message, Badge, Drawer } from 'antd';
import { SearchOutlined, UserOutlined, DownOutlined, ShoppingCartOutlined, HeartOutlined } from '@ant-design/icons';

import { useStore } from '../hooks/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { requestLogout } from '../config/UserRequest';
import { listProduct } from '../config/ProductRequest';
import { listCategory } from '../config/CategoryRequest';

function Header() {
    const { dataUser, cart } = useStore();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showWishlist, setShowWishlist] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await listProduct();
                setProducts(res.metadata || []);
            } catch (err) {
                console.error("Failed to load products in Header search:", err);
            }
        };
        const fetchCategories = async () => {
            try {
                const res = await listCategory();
                setCategories(res.metadata || []);
            } catch (err) {
                console.error("Failed to load categories in Header:", err);
            }
        };
        const loadWishlist = () => {
            try {
                setWishlistItems(JSON.parse(localStorage.getItem('wishlist') || '[]'));
            } catch (e) {
                setWishlistItems([]);
            }
        };

        fetchProducts();
        fetchCategories();
        loadWishlist();

        window.addEventListener('wishlist-update', loadWishlist);
        return () => {
            window.removeEventListener('wishlist-update', loadWishlist);
        };
    }, []);

    const getCategoryIdByName = (name) => {
        const cat = categories.find(c => c.nameCategory && c.nameCategory.toLowerCase() === name.toLowerCase());
        return cat ? cat._id : null;
    };

    const handleCategoryClick = (key) => {
        if (key === 'all') {
            navigate('/');
            return;
        }
        
        const mainBrands = ['nike', 'adidas', 'jordan', 'new balance', 'asics'];
        if (mainBrands.includes(key.toLowerCase())) {
            const catId = getCategoryIdByName(key);
            if (catId) {
                navigate(`/?brand=${catId}`);
                return;
            }
        }
        
        navigate(`/?brand=${key}`);
    };

    const nikeDropdownItems = [
        { key: 'nike-lebron', label: 'Giày Nike LeBron', onClick: () => handleCategoryClick('nike-lebron') },
        { key: 'nike-kd', label: 'Giày Nike KD', onClick: () => handleCategoryClick('nike-kd') },
        { key: 'nike-zoom', label: 'Nike Air Zoom', onClick: () => handleCategoryClick('nike-zoom') },
        { key: 'nike-chạy', label: 'Nike Chạy bộ', onClick: () => handleCategoryClick('nike-chạy') },
        { key: 'nike-tennis', label: 'Nike Tennis / Pickleball', onClick: () => handleCategoryClick('nike-tennis') },
        { key: 'Nike', label: 'Tất cả Nike', onClick: () => {
            const nikeId = getCategoryIdByName('Nike');
            handleCategoryClick(nikeId || 'Nike');
        } },
    ];

    const adidasDropdownItems = [
        { key: 'adidas-samba', label: 'adidas Samba', onClick: () => handleCategoryClick('adidas-samba') },
        { key: 'adidas-tennis', label: 'adidas Tennis / Pickleball', onClick: () => handleCategoryClick('adidas-tennis') },
        { key: 'Adidas', label: 'Tất cả Adidas', onClick: () => {
            const adidasId = getCategoryIdByName('Adidas');
            handleCategoryClick(adidasId || 'Adidas');
        } },
    ];

    const jordanDropdownItems = [
        { key: 'jordan-1-low', label: 'Air Jordan 1 Low', onClick: () => handleCategoryClick('jordan-1-low') },
        { key: 'Jordan', label: 'Tất cả Jordan', onClick: () => {
            const jordanId = getCategoryIdByName('Jordan');
            handleCategoryClick(jordanId || 'Jordan');
        } },
    ];

    const newBalanceDropdownItems = [
        { key: 'new-balance-9060', label: 'New Balance 9060', onClick: () => handleCategoryClick('new-balance-9060') },
        { key: 'new-balance-1906', label: 'New Balance 1906', onClick: () => handleCategoryClick('new-balance-1906') },
        { key: 'new-balance-530', label: 'New Balance 530', onClick: () => handleCategoryClick('new-balance-530') },
        { key: 'new-balance-574', label: 'New Balance 574', onClick: () => handleCategoryClick('new-balance-574') },
        { key: 'New Balance', label: 'Tất cả New Balance', onClick: () => {
            const nbId = getCategoryIdByName('New Balance');
            handleCategoryClick(nbId || 'New Balance');
        } },
    ];

    const asicsDropdownItems = [
        { key: 'asics-challenger', label: 'Asics Gel-Challenger', onClick: () => handleCategoryClick('asics-challenger') },
        { key: 'asics-speed', label: 'Asics Solution Speed', onClick: () => handleCategoryClick('asics-speed') },
        { key: 'asics-resolution', label: 'Asics Gel-Resolution', onClick: () => handleCategoryClick('asics-resolution') },
        { key: 'asics-chạy', label: 'Asics Chạy bộ', onClick: () => handleCategoryClick('asics-chạy') },
        { key: 'Asics', label: 'Tất cả Asics', onClick: () => {
            const asicsId = getCategoryIdByName('Asics');
            handleCategoryClick(asicsId || 'Asics');
        } },
    ];

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim() === '') {
            setSuggestions([]);
        } else {
            const queryLower = query.toLowerCase();
            const filtered = products.filter(p =>
                p.nameProduct.toLowerCase().includes(queryLower) ||
                (p.categoryProduct?.nameCategory || '').toLowerCase().includes(queryLower)
            );
            setSuggestions(filtered);
        }
    };

    const handleLogout = async () => {
        try {
            await requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    const userMenuItems = [
        { key: 'profile', label: 'Thông tin cá nhân', href: '/info-user', onClick: () => navigate('/profile') },
        { key: 'bookings', label: 'Đơn hàng của tôi', href: '/bookings', onClick: () => navigate('/order') },
        { key: 'warranty', label: 'Quản lý bảo hành', href: '/warranty', onClick: () => navigate('/warranty') },
        ...(dataUser?.isAdmin ? [{ key: 'admin', label: 'Trang quản trị (Admin)', onClick: () => navigate('/admin') }] : []),
        { key: 'logout', label: 'Đăng xuất', onClick: handleLogout },
    ];

    return (
        <div className="bg-white shadow-md fixed top-0 z-50 w-full">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-row items-center justify-between gap-8">
                    {/* Logo */}
                    <Link to={'/'}>
                        <div className="flex items-center gap-2">
                            <img
                                src={logo}
                                alt="logo"
                                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity rounded-lg"
                            />
                            <h1 className="text-2xl font-bold">SneakerHub</h1>
                        </div>
                    </Link>

                    {/* Search Bar with Autocomplete Dropdown */}
                    <div className="flex-1 max-w-2xl relative">
                        <Input
                            size="large"
                            placeholder="Tìm kiếm sản phẩm, danh mục..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            className="rounded-lg"
                            style={{ borderRadius: '8px' }}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        />
                        {showDropdown && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                                {suggestions.map((p) => {
                                    const discountedPrice = p.priceProduct - (p.priceProduct * (p.discountProduct || 0)) / 100;
                                    return (
                                        <Link
                                            key={p._id}
                                            to={`/product/${p._id}`}
                                            onClick={() => {
                                                setSearchQuery('');
                                                setShowDropdown(false);
                                            }}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors duration-150"
                                        >
                                            <img
                                                src={p.imagesProduct?.[0]}
                                                alt={p.nameProduct}
                                                className="w-12 h-12 object-contain bg-white rounded border border-gray-100"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-normal text-gray-800 truncate">
                                                    {p.nameProduct}
                                                </p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountedPrice).replace('₫', 'đ')}
                                                    </span>
                                                    {p.discountProduct > 0 && (
                                                        <span className="bg-[#0f5132] text-white text-[10px] px-1.5 py-0.5 font-bold">
                                                            {Math.round(p.discountProduct)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        {showDropdown && searchQuery && suggestions.length === 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 p-4 text-center text-gray-500 z-50 text-sm">
                                Không tìm thấy sản phẩm nào phù hợp.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Badge count={wishlistItems.length} size="small" color="red">
                            <Button
                                type="text"
                                icon={<HeartOutlined style={{ fontSize: '20px', color: wishlistItems.length > 0 ? '#ff4d4f' : 'inherit' }} />}
                                size="large"
                                onClick={() => setShowWishlist(true)}
                                className="hover:bg-gray-100 flex items-center justify-center"
                            />
                        </Badge>

                        <Link to={'/cart'}>
                            <Badge count={(cart?.cart?.products || []).filter(item => item.productId && item.productId._id).length} size="small">
                                <Button
                                    type="text"
                                    icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                                    size="large"
                                    className="hover:bg-gray-100 flex items-center justify-center"
                                />
                            </Badge>
                        </Link>

                        {dataUser && dataUser._id ? (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                placement="bottomRight"
                                trigger={['click']}
                                dropdownRender={(menu) => (
                                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 mt-1 min-w-[200px] overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-medium text-gray-800">
                                                {dataUser.fullName || 'Người dùng'}
                                            </p>

                                            <p className="text-xs text-gray-500 truncate">{dataUser.email}</p>
                                        </div>
                                        {menu}
                                    </div>
                                )}
                            >
                                <div className="flex items-center cursor-pointer gap-2">
                                    <Avatar
                                        icon={<UserOutlined />}
                                        className="bg-green-500 flex items-center justify-center"
                                        size="large"
                                        src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${dataUser.avatar}`}
                                    />
                                    <div className="hidden md:block">
                                        <span className="text-sm font-medium">{dataUser.fullName || 'Người dùng'}</span>
                                        <DownOutlined className="text-xs ml-1" />
                                    </div>
                                </div>
                            </Dropdown>
                        ) : (
                            <Link to={'/login'}>
                                <Button type="primary" icon={<UserOutlined />} size="large" className="rounded-lg">
                                    Đăng nhập
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            {/* Secondary Header Row: Horizontal Menu Bar */}
            <div className="border-t border-gray-100 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-10 gap-y-2 py-3 text-xs md:text-sm font-bold text-gray-800 uppercase tracking-wider">
                        
                        <Dropdown menu={{ items: nikeDropdownItems }} placement="bottom" trigger={['hover']}>
                            <span 
                                onClick={() => {
                                    const id = getCategoryIdByName('Nike');
                                    handleCategoryClick(id || 'Nike');
                                }}
                                className="cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center"
                            >
                                GIÀY NIKE <DownOutlined className="text-[10px] ml-1 opacity-70" />
                            </span>
                        </Dropdown>

                        <Dropdown menu={{ items: adidasDropdownItems }} placement="bottom" trigger={['hover']}>
                            <span 
                                onClick={() => {
                                    const id = getCategoryIdByName('Adidas');
                                    handleCategoryClick(id || 'Adidas');
                                }}
                                className="cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center"
                            >
                                ADIDAS <DownOutlined className="text-[10px] ml-1 opacity-70" />
                            </span>
                        </Dropdown>

                        <Dropdown menu={{ items: jordanDropdownItems }} placement="bottom" trigger={['hover']}>
                            <span 
                                onClick={() => {
                                    const id = getCategoryIdByName('Jordan');
                                    handleCategoryClick(id || 'Jordan');
                                }}
                                className="cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center"
                            >
                                JORDAN <DownOutlined className="text-[10px] ml-1 opacity-70" />
                            </span>
                        </Dropdown>

                        <Dropdown menu={{ items: newBalanceDropdownItems }} placement="bottom" trigger={['hover']}>
                            <span 
                                onClick={() => {
                                    const id = getCategoryIdByName('New Balance');
                                    handleCategoryClick(id || 'New Balance');
                                }}
                                className="cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center"
                            >
                                NEW BALANCE <DownOutlined className="text-[10px] ml-1 opacity-70" />
                            </span>
                        </Dropdown>

                        <Dropdown menu={{ items: asicsDropdownItems }} placement="bottom" trigger={['hover']}>
                            <span 
                                onClick={() => {
                                    const id = getCategoryIdByName('Asics');
                                    handleCategoryClick(id || 'Asics');
                                }}
                                className="cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center"
                            >
                                ASICS <DownOutlined className="text-[10px] ml-1 opacity-70" />
                            </span>
                        </Dropdown>

                        <span 
                            onClick={() => handleCategoryClick('flash-deal')}
                            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        >
                            FLASH DEAL
                        </span>

                        <span 
                            onClick={() => handleCategoryClick('popular')}
                            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        >
                            MUA NHIỀU NHẤT
                        </span>

                        <span 
                            onClick={() => handleCategoryClick('sneaker-nam')}
                            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        >
                            SNEAKER NAM
                        </span>

                        <span 
                            onClick={() => handleCategoryClick('sneaker-nu')}
                            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                        >
                            SNEAKER NỮ
                        </span>

                    </div>
                </div>
            </div>

            {/* Favorites Drawer */}
            <Drawer
                title={<span className="font-extrabold uppercase text-gray-800 tracking-wider">Sản Phẩm Yêu Thích</span>}
                placement="right"
                onClose={() => setShowWishlist(false)}
                open={showWishlist}
                width={380}
            >
                {wishlistItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-4xl mb-3">❤️</p>
                        <p className="text-sm">Danh sách yêu thích của bạn đang trống</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {wishlistItems.map((item) => {
                            const discount = item.discountProduct || 0;
                            const price = item.priceProduct || 0;
                            const finalPrice = price - (price * discount) / 100;
                            
                            const formatPrice = (val) => {
                                return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'đ');
                            };

                            return (
                                <div key={item._id} className="flex gap-3 pb-3 border-b border-gray-100 items-start">
                                    <img
                                        src={item.imagesProduct?.[0] || 'https://via.placeholder.com/150'}
                                        alt={item.nameProduct}
                                        className="w-16 h-20 object-contain bg-gray-50 border p-1 rounded"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <h4 
                                            onClick={() => {
                                                setShowWishlist(false);
                                                navigate(`/product/${item._id}`);
                                            }}
                                            className="text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-2 hover:text-blue-600 cursor-pointer"
                                        >
                                            {item.nameProduct}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {discount > 0 && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    {formatPrice(price)}
                                                </span>
                                            )}
                                            <span className="text-xs font-bold text-red-600">
                                                {formatPrice(finalPrice)}
                                            </span>
                                        </div>
                                        
                                        {/* Action Buttons in Drawer */}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setShowWishlist(false);
                                                    navigate(`/product/${item._id}`);
                                                }}
                                                className="text-[10px] px-2 py-1 bg-black text-white hover:bg-gray-800 transition rounded font-semibold cursor-pointer border-none"
                                            >
                                                Xem chi tiết
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Remove from favorites
                                                    const nextWishlist = wishlistItems.filter(w => w._id !== item._id);
                                                    localStorage.setItem('wishlist', JSON.stringify(nextWishlist));
                                                    setWishlistItems(nextWishlist);
                                                    // Dispatch sync event
                                                    window.dispatchEvent(new Event('wishlist-update'));
                                                    message.success('Đã xoá khỏi danh sách yêu thích');
                                                }}
                                                className="text-[10px] px-2 py-1 bg-white text-red-500 border border-red-200 hover:border-red-500 hover:bg-red-50 transition rounded font-semibold cursor-pointer"
                                            >
                                                Xoá
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Drawer>
        </div>
    );
}

export default Header;
