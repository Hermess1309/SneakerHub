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
            url: 'https://res.cloudinary.com/u1vmfjx6/image/upload/q_auto:best,f_auto/v1792760363/sneakerhub/banner_nike_mind001_v24.png',
            tag: 'BỘ SƯU TẬP MỚI',
            title: 'BỘ SƯU TẬP NIKE',
            subtitle: 'Khám phá các sản phẩm Nike mới nhất',
            buttonText: 'Khám phá ngay',
        },
        {
            id: 2,
            url: 'https://res.cloudinary.com/u1vmfjx6/image/upload/q_auto:best,f_auto/v1792758496/sneakerhub/banner_adidas_audi_f1.png',
            tag: 'ADIDAS X AUDI REVOLUT F1 TEAM',
            title: 'ADIDAS X AUDI REVOLUT F1 TEAM',
            subtitle: 'Viva São Paulo. Bộ sưu tập Sampa Soul.',
            buttonText: 'Mua ngay',
        },
        {
            id: 3,
            url: 'https://res.cloudinary.com/u1vmfjx6/image/upload/q_auto:best,f_auto/v1792769192/sneakerhub/banner_newbalance_collection_v1.png',
            tag: 'NEW BALANCE HERITAGE',
            title: 'BỘ SƯU TẬP NEW BALANCE',
            subtitle: 'Biểu tượng phong cách cổ điển & thời thượng',
            buttonText: 'Khám phá ngay',
        },
    ];

    const handleBannerClick = (imageId) => {
        if (imageId === 1) {
            const nikeCat = categories.find(cat => cat.nameCategory && cat.nameCategory.toLowerCase() === 'nike');
            if (nikeCat) {
                searchParams.set('brand', nikeCat._id);
                setSearchParams(searchParams);
            }
        } else if (imageId === 2) {
            const adidasCat = categories.find(cat => cat.nameCategory && cat.nameCategory.toLowerCase() === 'adidas');
            if (adidasCat) {
                searchParams.set('brand', adidasCat._id);
                setSearchParams(searchParams);
            }
        } else if (imageId === 3) {
            const nbCat = categories.find(cat => cat.nameCategory && cat.nameCategory.toLowerCase().includes('new balance'));
            if (nbCat) {
                searchParams.set('brand', nbCat._id);
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
                            <div 
                                className="relative w-full overflow-hidden group"
                                style={{ aspectRatio: '1024 / 426' }}
                            >
                                {/* Slide Image with hover zoom effect */}
                                <img
                                    className="w-full h-full object-cover object-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                                    src={image.url}
                                    alt={image.title}
                                    loading="lazy"
                                />

                                {/* Clean Editorial UI Card at bottom-left (No dark gradient, crisp white badges) */}
                                <div className="absolute left-4 sm:left-10 md:left-16 bottom-5 sm:bottom-8 md:bottom-12 z-20 flex flex-col items-start gap-1">
                                    <div className="bg-white text-black font-black text-[10px] sm:text-xs md:text-sm lg:text-base px-2.5 sm:px-3.5 py-1 uppercase tracking-wider shadow-sm">
                                        {image.title}
                                    </div>
                                    <div className="bg-white text-black text-[9px] sm:text-[11px] md:text-xs lg:text-sm px-2.5 sm:px-3.5 py-0.5 font-medium shadow-sm">
                                        {image.subtitle}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBannerClick(image.id);
                                        }}
                                        className="mt-1.5 sm:mt-2.5 bg-white hover:bg-black text-black hover:text-white transition-all duration-300 text-[10px] sm:text-xs md:text-sm font-bold px-3.5 sm:px-5 py-1.5 sm:py-2.5 inline-flex items-center gap-2 border border-black/10 shadow-sm cursor-pointer group/btn"
                                    >
                                        <span>{image.buttonText}</span>
                                        <span className="text-sm sm:text-base transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                                    </button>
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
