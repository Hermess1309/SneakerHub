import { useEffect, useState } from 'react';
import { listCategory } from '../config/CategoryRequest';
import { listProduct } from '../config/ProductRequest';
import CardBody from './CardBody';
import { Spin, Select, Radio, Checkbox } from 'antd';
import { FunnelPlotOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

const { Option } = Select;

function HomePage() {
    const [dataCategory, setDataCategory] = useState([]);
    const [dataProduct, setDataProduct] = useState([]);
    const [loading, setLoading] = useState(true);

    // React Router search params for state management
    const [searchParams, setSearchParams] = useSearchParams();
    const brandParam = searchParams.get('brand');
    const selectedCategories = brandParam ? brandParam.split(',') : [];

    // Advanced Filters State
    const [priceFilter, setPriceFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState([]);
    const [sortType, setSortType] = useState('newest');

    const priceRanges = [
        { key: 'all', label: 'Tất cả giá', min: 0, max: Infinity },
        { key: 'under1', label: 'Dưới 1.000.000đ', min: 0, max: 1000000 },
        { key: '1to2', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
        { key: '2to3', label: '2.000.000đ - 3.000.000đ', min: 2000000, max: 3000000 },
        { key: '3to5', label: '3.000.000đ - 5.000.000đ', min: 3000000, max: 5000000 },
    ];

    const availableSizes = ['37', '38', '39', '40', '41', '42', '43', '44'];

    const fetchCategory = async () => {
        const res = await listCategory();
        const filtered = (res.metadata || []).filter(cat => {
            const name = cat.nameCategory || "";
            return !name.includes(',') && 
                   !name.includes('Các dòng') && 
                   !name.includes('chạy bộ') && 
                   !name.includes('bóng rổ') &&
                   !name.includes('Samba') &&
                   !name.includes('Pickleball');
        });
        setDataCategory(filtered);
    };

    const fetchProduct = async () => {
        const res = await listProduct();
        const rawProducts = res.metadata || [];
        const shuffled = [...rawProducts].sort(() => Math.random() - 0.5);
        setDataProduct(shuffled);
    };

    // Initial load - fetch categories and all products
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchCategory();
            await fetchProduct();
            setLoading(false);
        };
        fetchData();
    }, []);

    // Reset sub-filters when brand category changes
    useEffect(() => {
        setPriceFilter('all');
        setSizeFilter([]);
    }, [brandParam]);

    // Scroll to top when brand category parameter changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [brandParam]);

    // Scroll Reveal Intersection Observer Animation
    useEffect(() => {
        if (loading) return;

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
    }, [loading, brandParam, priceFilter, sizeFilter, sortType]);

    const setSelectedCategory = (cat) => {
        if (cat === 'all') {
            searchParams.delete('brand');
            setSearchParams(searchParams);
        } else {
            searchParams.set('brand', cat);
            setSearchParams(searchParams);
        }
    };

    const handleBrandToggle = (brandId) => {
        let nextSelected;
        if (selectedCategories.includes(brandId)) {
            nextSelected = selectedCategories.filter(id => id !== brandId);
        } else {
            nextSelected = [...selectedCategories, brandId];
        }

        if (nextSelected.length === 0) {
            searchParams.delete('brand');
        } else {
            searchParams.set('brand', nextSelected.join(','));
        }
        setSearchParams(searchParams);
    };

    const handleLogoClick = (brandId) => {
        if (selectedCategories.length === 1 && selectedCategories.includes(brandId)) {
            searchParams.delete('brand');
        } else {
            searchParams.set('brand', brandId);
        }
        setSearchParams(searchParams);
    };

    // Helper to check if a product belongs to a brand (based on product name first, falling back to category)
    const isProductOfBrand = (p, brandWord) => {
        const nameLower = p.nameProduct.toLowerCase();
        const mainBrands = ['jordan', 'new balance', 'nike', 'adidas', 'asics'];
        
        // Find if product name mentions any main brands
        const mentionedBrand = mainBrands.find(b => nameLower.includes(b));
        if (mentionedBrand) {
            return mentionedBrand === brandWord;
        }
        
        // Fallback to category name if product name does not mention any brands
        const pCatId = p.categoryProduct?._id || p.categoryProduct;
        const pCat = dataCategory.find(cat => cat._id === pCatId);
        if (!pCat) return false;
        return pCat.nameCategory.toLowerCase().includes(brandWord);
    };

    // Get brand counts with smart brand matching
    const getBrandCount = (brandId) => {
        const selectedCat = dataCategory.find(cat => cat._id === brandId);
        if (!selectedCat) return 0;
        const selectedCatNameLower = selectedCat.nameCategory.toLowerCase();
        const mainBrands = ['jordan', 'new balance', 'nike', 'adidas', 'asics'];
        const matchedMainBrand = mainBrands.find(brand => selectedCatNameLower.includes(brand));
        
        if (matchedMainBrand) {
            return dataProduct.filter(p => isProductOfBrand(p, matchedMainBrand)).length;
        }
        return dataProduct.filter(p => (p.categoryProduct?._id || p.categoryProduct) === brandId).length;
    };

    // Toggle size filter selection
    const handleSizeToggle = (size) => {
        if (sizeFilter.includes(size)) {
            setSizeFilter(sizeFilter.filter(s => s !== size));
        } else {
            setSizeFilter([...sizeFilter, size]);
        }
    };

    // Filter and Sort Products client-side
    const getFilteredProducts = () => {
        let products = [...dataProduct];

        // 1. Filter by Brand Category (with smart brand matching & custom keyword fallbacks)
        if (selectedCategories.length > 0) {
            products = products.filter(p => {
                return selectedCategories.some(catId => {
                    const selectedCat = dataCategory.find(cat => cat._id === catId);
                    if (!selectedCat) {
                        const nameLower = p.nameProduct.toLowerCase();
                        const catLower = (p.categoryProduct?.nameCategory || '').toLowerCase();
                        
                        if (catId === 'mlb') return nameLower.includes('mlb') || catLower.includes('mlb');
                        if (catId === 'converse') return nameLower.includes('converse') || catLower.includes('converse');
                        if (catId === 'vans') return nameLower.includes('vans') || catLower.includes('vans');
                        if (catId === 'gym') return nameLower.includes('gym') || nameLower.includes('chạy bộ') || nameLower.includes('tập gym') || catLower.includes('gym') || catLower.includes('chạy bộ') || catLower.includes('tập gym');
                        if (catId === 'premium') {
                            const finalPrice = p.priceProduct - (p.priceProduct * (p.discountProduct || 0)) / 100;
                            return finalPrice >= 2500000 || nameLower.includes('jordan 1 high') || nameLower.includes('travis scott');
                        }
                        
                        // Sub-categories
                        if (catId === 'sneaker-nam') return nameLower.includes('nam') || catLower.includes('nam');
                        if (catId === 'sneaker-nu') return nameLower.includes('nữ') || nameLower.includes('nu') || catLower.includes('nữ') || catLower.includes('nu');
                        if (catId === 'flash-deal') return p.discountProduct > 0;
                        if (catId === 'popular') return p.stockProduct < 10;
                        
                        // Smart generic keyword matching: e.g. "new-balance-9060" matches name containing "new", "balance", and "9060"
                        if (catId.includes('-')) {
                            const parts = catId.split('-');
                            return parts.every(part => nameLower.includes(part) || catLower.includes(part));
                        }
                        
                        return false;
                    }

                    const selectedCatNameLower = selectedCat.nameCategory.toLowerCase();
                    const mainBrands = ['jordan', 'new balance', 'nike', 'adidas', 'asics'];
                    const matchedMainBrand = mainBrands.find(brand => selectedCatNameLower.includes(brand));
                    
                    if (matchedMainBrand) {
                        return isProductOfBrand(p, matchedMainBrand);
                    } else {
                        return (p.categoryProduct?._id || p.categoryProduct) === catId;
                    }
                });
            });
        }

        // 2. Filter by Price Range
        if (priceFilter !== 'all') {
            const activeRange = priceRanges.find(r => r.key === priceFilter);
            if (activeRange) {
                products = products.filter(p => {
                    const finalPrice = p.priceProduct - (p.priceProduct * (p.discountProduct || 0)) / 100;
                    return finalPrice >= activeRange.min && finalPrice <= activeRange.max;
                });
            }
        }

        // 3. Filter by Size
        if (sizeFilter.length > 0) {
            products = products.filter(p => {
                if (!p.metadata?.size) return false;
                const pSizes = p.metadata.size.split(',').map(s => s.trim());
                return sizeFilter.some(sf => pSizes.includes(sf));
            });
        }

        // 4. Sort Products
        if (sortType === 'priceAsc') {
            products.sort((a, b) => {
                const priceA = a.priceProduct - (a.priceProduct * (a.discountProduct || 0)) / 100;
                const priceB = b.priceProduct - (b.priceProduct * (b.discountProduct || 0)) / 100;
                return priceA - priceB;
            });
        } else if (sortType === 'priceDesc') {
            products.sort((a, b) => {
                const priceA = a.priceProduct - (a.priceProduct * (a.discountProduct || 0)) / 100;
                const priceB = b.priceProduct - (b.priceProduct * (b.discountProduct || 0)) / 100;
                return priceB - priceA;
            });
        }

        return products;
    };

    const finalProducts = getFilteredProducts();

    const customBrandNames = {
        'mlb': 'MLB',
        'converse': 'Converse',
        'vans': 'Vans',
        'gym': 'Giày Tập Gym',
        'premium': 'Giày Cao Cấp',
        'nike-dunk': 'Nike Dunk',
        'air-force-1': 'Air Force 1',
        'nike-vomero': 'Nike Vomero',
        'nike-cortez': 'Nike Cortez',
        'adidas-samba': 'adidas Samba',
        'adidas-gazelle': 'adidas Gazelle',
        'adidas-stan-smith': 'adidas Stan Smith',
        'adidas-superstar': 'adidas Superstar',
        'sneaker-nam': 'Giày Sneaker Nam',
        'sneaker-nu': 'Giày Sneaker Nữ',
        'flash-deal': 'Flash Deal / Khuyến Mãi',
        'travis-scott': 'Air Jordan x Travis Scott'
    };

    const activeBrandName = selectedCategories
        .map(catId => {
            const cat = dataCategory.find(cat => cat._id === catId);
            if (cat) return cat.nameCategory;
            return customBrandNames[catId] || catId;
        })
        .filter(Boolean)
        .join(', ');

    // Display categories on the homepage logo bar
    const brandCategories = dataCategory;

    // Filtered lists for landing page sections
    const flashDealProducts = dataProduct.filter(p => p.discountProduct > 0);
    
    const popularProducts = dataProduct.filter(p => 
        p.nameProduct.toLowerCase().includes('travis scott') || 
        p.nameProduct.toLowerCase().includes('samba') || 
        p.nameProduct.toLowerCase().includes('530') || 
        p.nameProduct.toLowerCase().includes('challenger') ||
        p.nameProduct.toLowerCase().includes('vomero')
    );

    const jordanProducts = dataProduct.filter(p => 
        p.nameProduct.toLowerCase().includes('jordan 1') || 
        p.nameProduct.toLowerCase().includes('jordan i')
    );

    const shownIds = new Set([
        ...flashDealProducts.slice(0, 5).map(p => p._id),
        ...popularProducts.slice(0, 5).map(p => p._id),
        ...jordanProducts.slice(0, 5).map(p => p._id)
    ]);
    const otherProducts = dataProduct.filter(p => !shownIds.has(p._id));

    const hasActiveBrandFilter = selectedCategories.length > 0;

    return (
        <div className={`bg-gray-50 min-h-screen transition-all duration-300 ${hasActiveBrandFilter ? 'pt-24 sm:pt-28 md:pt-32' : ''}`}>
            <div className="container mx-auto px-4 py-8">
                
                {/* Brand Logos Bar under banner (Made larger) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 reveal-item" data-delay="0">
                    <div className="flex flex-wrap justify-center items-center gap-14 md:gap-20">
                        {brandCategories.map((category) => (
                            <div
                                key={category._id}
                                onClick={() => handleLogoClick(category._id)}
                                className={`flex flex-col items-center cursor-pointer transition-all duration-300 transform ${
                                    selectedCategories.includes(category._id) ? 'scale-115' : 'hover:scale-110'
                                }`}
                            >
                                <img
                                    src={category.imageCategory || 'https://via.placeholder.com/200x80'}
                                    alt={category.nameCategory}
                                    className={`h-24 w-48 object-contain transition-all duration-300 ${
                                        selectedCategories.includes(category._id)
                                            ? 'opacity-100 grayscale-0 filter drop-shadow-md'
                                            : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                                    }`}
                                />
                                <span className={`text-xs mt-3 font-bold transition-colors duration-300 ${
                                    selectedCategories.includes(category._id) ? 'text-black' : 'text-gray-400'
                                }`}>
                                    {category.nameCategory}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedCategories.length === 0 ? (
                    /* HOMEPAGE VIEW (Full width, section-based layout) */
                    loading ? (
                        <div className="flex justify-center items-center h-96">
                            <Spin size="large" tip="Đang tải sản phẩm..." />
                        </div>
                    ) : (
                        <main className="w-full space-y-16">
                            
                            {/* 1. FLASH DEAL SECTION */}
                            {flashDealProducts.length > 0 && (
                                <section className="reveal-item" data-delay="0">
                                    <div className="flex flex-col items-center justify-center text-center mb-10">
                                        <div 
                                            onClick={() => setSelectedCategory('flash-deal')}
                                            className="group cursor-pointer inline-flex flex-col items-center select-none"
                                        >
                                            <h2 className="relative text-2xl md:text-3xl font-bold text-black uppercase tracking-widest pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:bg-black after:transition-all after:duration-300 group-hover:after:w-full">
                                                Flash Deal
                                            </h2>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {flashDealProducts.slice(0, 5).map((item, idx) => (
                                            <CardBody key={item._id} dataItem={item} index={idx} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 2. TOP POPULAR SECTION */}
                            {popularProducts.length > 0 && (
                                <section className="reveal-item" data-delay="100">
                                    <div className="flex flex-col items-center justify-center text-center mb-10">
                                        <div 
                                            onClick={() => setSelectedCategory('all')}
                                            className="group cursor-pointer inline-flex flex-col items-center select-none"
                                        >
                                            <h2 className="relative text-2xl md:text-3xl font-bold text-black uppercase tracking-widest pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:bg-black after:transition-all after:duration-300 group-hover:after:w-full">
                                                Top Popular
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {popularProducts.slice(0, 5).map((item, idx) => (
                                            <CardBody key={item._id} dataItem={item} index={idx + 5} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. AIR JORDAN 1 SECTION */}
                            {jordanProducts.length > 0 && (
                                <section className="reveal-item" data-delay="200">
                                    <div className="flex flex-col items-center justify-center text-center mb-10">
                                        <div 
                                            onClick={() => {
                                                const jordanCat = dataCategory.find(cat => cat.nameCategory.toLowerCase() === 'jordan');
                                                if (jordanCat) {
                                                    setSelectedCategory(jordanCat._id);
                                                } else {
                                                    setSelectedCategory('jordan');
                                                }
                                            }}
                                            className="group cursor-pointer inline-flex flex-col items-center select-none"
                                        >
                                            <h2 className="relative text-2xl md:text-3xl font-bold text-black uppercase tracking-widest pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:bg-black after:transition-all after:duration-300 group-hover:after:w-full">
                                                Air Jordan 1
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {jordanProducts.slice(0, 5).map((item, idx) => (
                                            <CardBody key={item._id} dataItem={item} index={idx + 10} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 4. SNEAKER SECTION */}
                            {otherProducts.length > 0 && (
                                <section className="reveal-item" data-delay="300">
                                    <div className="flex flex-col items-center justify-center text-center mb-10">
                                        <div 
                                            onClick={() => setSelectedCategory('all')}
                                            className="group cursor-pointer inline-flex flex-col items-center select-none"
                                        >
                                            <h2 className="relative text-2xl md:text-3xl font-bold text-black uppercase tracking-widest pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:bg-black after:transition-all after:duration-300 group-hover:after:w-full">
                                                Sneaker
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {otherProducts.slice(0, 10).map((item, idx) => (
                                            <CardBody key={item._id} dataItem={item} index={idx + 15} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </main>
                    )
                ) : (
                    /* BRAND CATEGORY VIEW (With sidebar filters) */
                    <div>
                        <div className="mb-6 text-center reveal-item" data-delay="0">
                            <h1 className="text-5xl font-extralight tracking-widest text-gray-800 lowercase my-4">
                                {activeBrandName}
                            </h1>
                            
                            {/* Breadcrumbs and Sorting bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 py-3 border-b border-gray-200 mb-6 gap-3">
                                <div className="flex items-center gap-1">
                                    <span className="hover:text-black cursor-pointer" onClick={() => setSelectedCategory('all')}>Trang chủ</span>
                                    <span>»</span>
                                    <span>Thương hiệu</span>
                                    <span>»</span>
                                    <span className="text-gray-800 font-bold lowercase">{activeBrandName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Sắp xếp:</span>
                                    <Select
                                        defaultValue="newest"
                                        style={{ width: 140 }}
                                        onChange={(value) => setSortType(value)}
                                        className="font-medium"
                                    >
                                        <Option value="newest">Mới nhất</Option>
                                        <Option value="priceAsc">Giá tăng dần</Option>
                                        <Option value="priceDesc">Giá giảm dần</Option>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Advanced Sidebar Filters */}
                            <aside className="w-full lg:w-64 flex-shrink-0">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6 sticky top-24">
                                    <div className="flex items-center gap-2 pb-3 border-b text-gray-800">
                                        <FunnelPlotOutlined className="text-blue-500 text-lg" />
                                        <span className="font-bold text-base">Bộ lọc tìm kiếm</span>
                                    </div>

                                    {/* Price Filter */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Khoảng giá</h4>
                                        <Radio.Group 
                                            onChange={(e) => setPriceFilter(e.target.value)} 
                                            value={priceFilter}
                                            className="flex flex-col gap-2.5"
                                        >
                                            {priceRanges.map(range => (
                                                <Radio key={range.key} value={range.key} className="text-gray-600 hover:text-black">
                                                    {range.label}
                                                </Radio>
                                            ))}
                                        </Radio.Group>
                                    </div>

                                    {/* Size Filter */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Kích thước (Size)</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {availableSizes.map(size => {
                                                const isSelected = sizeFilter.includes(size);
                                                return (
                                                    <button
                                                        key={size}
                                                        onClick={() => handleSizeToggle(size)}
                                                        className={`h-9 rounded-lg font-semibold text-xs border transition-all duration-200 cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Brand Checkboxes */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Thương hiệu</h4>
                                        <div className="flex flex-col gap-2.5">
                                            {brandCategories.map(cat => (
                                                <Checkbox
                                                    key={cat._id}
                                                    checked={selectedCategories.includes(cat._id)}
                                                    onChange={() => handleBrandToggle(cat._id)}
                                                    className="text-gray-600 hover:text-black"
                                                >
                                                    <span className="capitalize">{cat.nameCategory}</span>
                                                    <span className="text-gray-400 text-xs ml-1.5">({getBrandCount(cat._id)})</span>
                                                </Checkbox>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content - Product Grid */}
                            <main className="flex-1">
                                {loading ? (
                                    <div className="flex justify-center items-center h-96">
                                        <Spin size="large" tip="Đang tải sản phẩm..." />
                                    </div>
                                ) : (
                                    <>
                                        {finalProducts.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                {finalProducts.map((item, idx) => (
                                                    <CardBody key={item._id} dataItem={item} index={idx} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                                <div className="text-gray-300 text-6xl mb-4">👟</div>
                                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                                    Không tìm thấy đôi giày nào
                                                </h3>
                                                <p className="text-gray-500 text-sm">Vui lòng điều chỉnh hoặc thử xóa các bộ lọc để hiển thị nhiều kết quả hơn.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </main>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default HomePage;
