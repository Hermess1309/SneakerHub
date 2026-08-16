import { 
    CarOutlined, 
    SafetyCertificateOutlined, 
    CreditCardOutlined, 
    ClockCircleOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    FacebookOutlined,
    InstagramOutlined,
    YoutubeOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="w-full bg-gray-50 border-t border-gray-200 mt-20">
            {/* 1. Trust Signals Bar */}
            <div className="bg-white border-b border-gray-100 py-8">
                <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 text-xl border border-gray-100">
                            <CarOutlined />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Ship COD toàn quốc</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Miễn phí vận chuyển cho đơn hàng từ 999.000đ</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 text-xl border border-gray-100">
                            <SafetyCertificateOutlined />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Chất lượng tuyệt đối 100%</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Cam kết sản phẩm sneaker chính hãng 100%</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 text-xl border border-gray-100">
                            <CreditCardOutlined />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Thanh toán dễ dàng</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Phương thức thanh toán đa dạng và tiện lợi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 text-xl border border-gray-100">
                            <ClockCircleOutlined />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Tiết kiệm thời gian</h4>
                            <p className="text-gray-500 text-xs mt-0.5">Mua sắm trực tuyến nhanh chóng, an toàn</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Footer Area */}
            <div className="bg-black text-gray-300 py-16">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Left Column: Brand Info */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg tracking-wider">SNEAKERHUB</h3>
                        <div className="space-y-3 text-sm text-gray-400">
                            <div className="flex items-start gap-2.5">
                                <EnvironmentOutlined className="mt-1 flex-shrink-0 text-white" />
                                <span>Số 52, Đường số 6, Phường Hòa Hưng, Quận 10, TP. Hồ Chí Minh</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <PhoneOutlined className="flex-shrink-0 text-white" />
                                <a href="tel:0899227066" className="hover:text-white transition-colors">0899227066</a>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <MailOutlined className="flex-shrink-0 text-white" />
                                <a href="mailto:doanthanhhuy1309@gmail.com" className="hover:text-white transition-colors">doanthanhhuy1309@gmail.com</a>
                            </div>
                        </div>
                        <div className="pt-2">
                            <img 
                                src="https://theme.hstatic.net/1000230627/1000889163/14/logo_sale_no_background.png?v=2340" 
                                alt="Đã thông báo Bộ Công Thương" 
                                className="h-10 w-auto opacity-80 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>

                    {/* Middle Column: Links */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Danh mục chính</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
                            <li><Link to="/?brand=6a7c54a848bb5df19e8f16c8" className="hover:text-white transition-colors">Giày Nike</Link></li>
                            <li><Link to="/?brand=6a7c54a848bb5df19e8f16ca" className="hover:text-white transition-colors">Giày Adidas</Link></li>
                            <li><Link to="/?brand=6a7c8eb3784c4410badd0313" className="hover:text-white transition-colors">Giày Jordan</Link></li>
                            <li><Link to="/?brand=6a7c8eb3784c4410badd0322" className="hover:text-white transition-colors">Giày New Balance</Link></li>
                        </ul>
                    </div>

                    {/* Right Column: Policies */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Chính sách cửa hàng</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><span className="cursor-pointer hover:text-white transition-colors">Điều khoản & điều kiện</span></li>
                            <li><span className="cursor-pointer hover:text-white transition-colors">Chính sách bảo hành</span></li>
                            <li><span className="cursor-pointer hover:text-white transition-colors">Chính sách giao hàng</span></li>
                            <li><span className="cursor-pointer hover:text-white transition-colors">Chính sách đổi trả 100%</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Bar */}
            <div className="bg-neutral-950 text-gray-500 py-6 border-t border-neutral-900 text-xs">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        © Bản quyền thuộc về <span className="text-gray-400 font-medium">SneakerHub</span> | Hotline: <span className="text-gray-400">0899227066</span>
                    </div>
                    {/* Social Icons & Payments */}
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3 text-base text-gray-400">
                            <a href="#" className="hover:text-white transition-colors"><FacebookOutlined /></a>
                            <a href="#" className="hover:text-white transition-colors"><InstagramOutlined /></a>
                            <a href="#" className="hover:text-white transition-colors"><YoutubeOutlined /></a>
                        </div>
                        <div className="flex items-center gap-2">
                            <img src="https://theme.hstatic.net/1000230627/1000889163/14/payment_1.png?v=2340" alt="Visa" className="h-4 object-contain filter grayscale opacity-60 hover:opacity-100 transition-opacity" />
                            <img src="https://theme.hstatic.net/1000230627/1000889163/14/payment_2.png?v=2340" alt="Mastercard" className="h-4 object-contain filter grayscale opacity-60 hover:opacity-100 transition-opacity" />
                            <img src="https://theme.hstatic.net/1000230627/1000889163/14/payment_3.png?v=2340" alt="Momo" className="h-4 object-contain filter grayscale opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
