import { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { listCategory } from '../config/CategoryRequest';

// Custom Arrow Components
const CustomPrevArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
    >
        <LeftOutlined className="text-xl text-gray-800" />
    </button>
);

const CustomNextArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
    >
        <RightOutlined className="text-xl text-gray-800" />
    </button>
);

function Banner() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await listCategory();
                setCategories(res.metadata || []);
            } catch (err) {
                console.error("Failed to load categories in Banner:", err);
            }
        };
        fetchCategories();
    }, []);

    const settings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        fade: true,
        cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
        appendDots: (dots) => (
            <div style={{ bottom: '24px' }}>
                <ul className="flex items-center justify-center gap-2"> {dots} </ul>
            </div>
        ),
        customPaging: () => (
            <div className="w-3 h-3 bg-white/60 rounded-full hover:bg-white transition-all duration-300 cursor-pointer" />
        ),
    };

    const images = [
        {
            id: 1,
            url: 'https://res.cloudinary.com/u1vmfjx6/image/upload/v1786549719/1207f601-432d-4782-aa6b-ed5b852ac8b1.png',
            title: 'Bộ sưu tập Nike',
            subtitle: 'Khám phá các sản phẩm Nike mới nhất',
        },
        {
            id: 2,
            url: 'https://theme.hstatic.net/1000237375/1000756917/14/slider_item_2_image.jpg?v=1840',
            title: 'Ưu đãi đặc biệt',
            subtitle: 'Giảm giá lên đến 50%',
        },
        {
            id: 3,
            url: 'https://theme.hstatic.net/1000237375/1000756917/14/slider_item_4_image.jpg?v=1840',
            title: 'Phong cách độc đáo',
            subtitle: 'Tạo dấu ấn riêng của bạn',
        },
    ];

    const handleBannerClick = (imageId) => {
        if (imageId === 1) {
            const nikeCat = categories.find(cat => cat.nameCategory.toLowerCase() === 'nike');
            if (nikeCat) {
                searchParams.set('brand', nikeCat._id);
                setSearchParams(searchParams);
            }
        }
    };

    return (
        <div className="pt-32 bg-gray-50">
            <div className="banner-container relative overflow-hidden">
                <Slider {...settings}>
                    {images.map((image) => (
                        <div 
                            key={image.id} 
                            className="relative cursor-pointer focus:outline-none"
                            onClick={() => handleBannerClick(image.id)}
                        >
                            <div className="relative h-[450px] sm:h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden group">
                                {/* Slide Image with hover zoom effect */}
                                <img
                                    className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                                    src={image.url}
                                    alt={image.title}
                                    loading="lazy"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

                                {/* Floating content container */}
                                <div className="absolute inset-y-0 left-0 flex items-center px-6 sm:px-12 md:px-20 lg:px-28 text-white z-10 w-full md:w-3/4">
                                    <div className="space-y-4 md:space-y-6 max-w-xl text-left">
                                        <span className="inline-block px-3 py-1 bg-blue-600 text-[10px] md:text-xs font-extrabold uppercase tracking-widest rounded-md shadow-sm">
                                            Bộ Sưu Tập Mới
                                        </span>
                                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight uppercase drop-shadow-md">
                                            {image.title}
                                        </h2>
                                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 drop-shadow-sm font-medium leading-relaxed">
                                            {image.subtitle}
                                        </p>
                                        <button className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black hover:bg-blue-600 hover:text-white font-extrabold text-xs md:text-sm rounded-lg transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 border-none cursor-pointer">
                                            KHÁM PHÁ NGAY
                                            <span className="text-sm font-light transition-transform duration-300 group-hover:translate-x-1">→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}

export default Banner;
