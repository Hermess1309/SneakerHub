import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { listProduct } from '../config/ProductRequest';
import { requestGetMessages, requestSendMessage } from '../config/MessageRequest';
import { Badge, message } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Sparkles, Headphones, Paperclip, Smile } from 'lucide-react';

function ChatWidget() {
    const location = useLocation();
    const navigate = useNavigate();
    const { dataUser } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeMode, setActiveMode] = useState('ai'); // 'ai' or 'human'
    const [productList, setProductList] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [sizeBrand, setSizeBrand] = useState('nike'); // 'nike' or 'adidas'
    
    // Human Chat States
    const [humanMessages, setHumanMessages] = useState([]);
    
    // AI Chat States
    const [aiMessages, setAiMessages] = useState([
        {
            _id: 'ai-init',
            senderId: 'ai',
            content: 'Dạ xin chào! Em là Trợ lý ảo SneakerHub Assistant. Em có thể hỗ trợ anh/chị tư vấn chọn size giày, tìm kiếm sản phẩm hot hoặc kiểm tra chính sách đổi trả. Anh/chị hãy bấm chọn nút hỏi nhanh hoặc gửi câu hỏi để em giải đáp nhé!',
            createdAt: new Date().toISOString()
        }
    ]);

    const [inputText, setInputText] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const chatEndRef = useRef(null);

    // Fetch product catalog on mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await listProduct();
                setProductList(res.metadata || []);
            } catch (error) {
                console.error('Error fetching products for chat:', error);
            }
        };
        fetchProducts();
    }, []);

    // Hide chat box if URL starts with admin, login, register, OR if logged in as Admin
    const isHiddenPath = 
        location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/login') || 
        location.pathname.startsWith('/register') ||
        (dataUser && dataUser.isAdmin);

    // Fetch human chat messages
    const fetchHumanMessages = async () => {
        if (isHiddenPath || activeMode !== 'human') return;
        try {
            const res = await requestGetMessages();
            const newMsgs = res.metadata || [];
            
            // Calculate unread replies
            if (!isOpen && humanMessages.length > 0 && newMsgs.length > humanMessages.length) {
                const added = newMsgs.slice(humanMessages.length);
                const unreadReplies = added.filter(m => m.senderId !== (dataUser?._id || m.userId)).length;
                if (unreadReplies > 0) {
                    setUnreadCount(prev => prev + unreadReplies);
                }
            }

            setHumanMessages(newMsgs);
        } catch (error) {
            console.error('Error fetching chat messages:', error);
        }
    };

    // Auto poll human messages when open in human mode
    useEffect(() => {
        if (isHiddenPath || activeMode !== 'human') return;

        fetchHumanMessages();

        const timer = setInterval(() => {
            fetchHumanMessages();
        }, 3000);

        return () => clearInterval(timer);
    }, [activeMode, isOpen, isHiddenPath, dataUser]);

    // Reset unread count when opening chat
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            scrollToBottom();
        }
    }, [isOpen, humanMessages, aiMessages, activeMode]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const renderMessageText = (content) => {
        if (content.includes('[Bảng hướng dẫn chọn size]')) {
            const parts = content.split('[Bảng hướng dẫn chọn size]');
            return (
                <span className="whitespace-pre-line">
                    {parts[0]}
                    <button
                        onClick={() => setShowSizeGuide(true)}
                        className="bg-[#007aff] hover:bg-[#0062cc] text-white px-2.5 py-1 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors shadow-sm inline-block mx-1 my-1"
                    >
                        📏 Xem bảng size giày
                    </button>
                    {parts[1]}
                </span>
            );
        }
        if (content.includes('- ')) {
            const lines = content.split('\n');
            return (
                <div className="space-y-1">
                    {lines.map((line, idx) => {
                        const match = line.match(/^-\s*(.*?)\s*\((.*?)\)$/);
                        if (match) {
                            const prodName = match[1];
                            const prodDesc = match[2];
                            const prod = productList.find(p => p.nameProduct === prodName);
                            if (prod) {
                                return (
                                    <div key={idx}>
                                        - <Link to={`/product/${prod._id}`} className="text-blue-600 underline font-bold hover:text-blue-800" onClick={() => setIsOpen(false)}>{prodName}</Link> ({prodDesc})
                                    </div>
                                );
                            }
                        }
                        return <div key={idx}>{line}</div>;
                    })}
                </div>
            );
        }
        return <span className="whitespace-pre-line">{content}</span>;
    };

    // AI Bot Reply Logic
    const triggerAiReply = (userText) => {
        const textLower = userText.toLowerCase();
        let aiReply = '';
        let matchedProducts = [];

        // Clear previous suggestions on other questions
        setSuggestedProducts([]);

        if (textLower.includes('size') || textLower.includes('kích thước') || textLower.includes('kích cỡ') || textLower.includes('đo chân')) {
            aiReply = 'Dạ SneakerHub xin tư vấn kích thước (size) cho anh/chị ạ! Thông thường đối với Nike Air Force 1 hoặc Jordan 1, anh/chị nên chọn đúng size chuẩn (true to size). Với giày chạy bộ Adidas Ultraboost hoặc Yeezy, anh/chị nên tăng lên 0.5 đến 1 size để đi thoải mái nhất ạ.\n\nĐể biết kích thước chính xác nhất, anh/chị hãy bấm xem [Bảng hướng dẫn chọn size] tại đây nhé!';
        } else if (textLower.includes('tìm sản phẩm') || textLower.includes('mua giày') || textLower.includes('giày hot') || textLower.includes('sản phẩm')) {
            const getRandomProducts = (list, count = 3) => {
                if (!list || list.length === 0) return [];
                const shuffled = [...list].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
            };
            const randomProds = getRandomProducts(productList, 3);
            if (randomProds.length > 0) {
                matchedProducts = randomProds;
                aiReply = 'Dạ hiện tại SneakerHub đang có các dòng sản phẩm bán rất chạy như:\n' +
                    randomProds.map(p => `- ${p.nameProduct} (${p.descriptionProduct ? p.descriptionProduct.substring(0, 30) + '...' : 'Trẻ trung, năng động'})`).join('\n') +
                    '\nAnh/chị có thể tìm kiếm trên thanh tìm kiếm của Web hoặc click trực tiếp vào các nút gợi ý sản phẩm bên dưới để xem chi tiết nhé!';
            } else {
                aiReply = 'Dạ hiện tại shop chưa có sản phẩm nào có sẵn trên hệ thống ạ.';
            }
        } else if (textLower.includes('đơn hàng') || textLower.includes('kiểm tra đơn') || textLower.includes('lịch sử đơn')) {
            aiReply = 'Dạ để kiểm tra đơn hàng, anh/chị vui lòng đăng nhập tài khoản, nhấp vào Avatar góc trên cùng bên phải và chọn "Lịch sử mua hàng". Ở đó sẽ có mã vận đơn và trạng thái giao hàng chi tiết của anh/chị ạ!';
        } else if (textLower.includes('khuyến mãi') || textLower.includes('mã giảm giá') || textLower.includes('coupon') || textLower.includes('giảm giá')) {
            aiReply = 'Dạ hiện tại shop đang áp dụng chương trình khuyến mãi nhập mã **SNEAKERNEW** giảm ngay 10% cho đơn hàng đầu tiên, hoặc mã **FREESHIP** để miễn phí vận chuyển toàn quốc. Anh/chị nhanh tay áp dụng lúc thanh toán nhé!';
        } else if (textLower.includes('đổi trả') || textLower.includes('chính sách đổi') || textLower.includes('hoàn tiền') || textLower.includes('trả hàng')) {
            aiReply = 'Dạ chính sách đổi trả của SneakerHub cho phép anh/chị đổi size hoặc mẫu khác trong vòng 7 ngày kể từ khi nhận hàng (yêu cầu sản phẩm còn nguyên tem mác, hộp và chưa qua sử dụng). Shop hỗ trợ miễn phí đổi trả nếu phát sinh lỗi từ nhà sản xuất ạ.';
        } else {
            aiReply = 'Dạ, em là Trợ lý ảo SneakerHub Assistant. Em có thể hỗ trợ anh/chị tìm kiếm sản phẩm, tư vấn chọn size giày, kiểm tra khuyến mãi hoặc chính sách đổi trả. Anh/chị hãy click vào các nút gợi ý hỏi nhanh hoặc gõ câu hỏi để em giải đáp ngay ạ! Nếu cần gặp nhân viên hỗ trợ, anh/chị vui lòng nhấn tab "Nhân viên hỗ trợ" nhé!';
        }

        setTimeout(() => {
            setAiMessages(prev => [
                ...prev,
                {
                    _id: `ai-${Date.now()}`,
                    senderId: 'ai',
                    content: aiReply,
                    createdAt: new Date().toISOString()
                }
            ]);
            if (matchedProducts.length > 0) {
                setSuggestedProducts(matchedProducts);
            }
            scrollToBottom();
        }, 800); // 800ms simulation delay
    };

    const handleSendMessage = async (textToSend = null) => {
        const text = textToSend || inputText;
        if (!text.trim()) return;

        if (!textToSend) setInputText('');

        if (activeMode === 'ai') {
            const userMsg = {
                _id: `user-${Date.now()}`,
                senderId: dataUser?._id || 'guest',
                content: text,
                createdAt: new Date().toISOString()
            };
            setAiMessages(prev => [...prev, userMsg]);
            scrollToBottom();
            triggerAiReply(text);
        } else {
            const tempMsg = {
                _id: `temp-${Date.now()}`,
                userId: dataUser?._id || 'guest',
                senderId: dataUser?._id || 'guest',
                content: text,
                createdAt: new Date().toISOString()
            };
            setHumanMessages(prev => [...prev, tempMsg]);
            scrollToBottom();

            try {
                await requestSendMessage(text);
                fetchHumanMessages();
            } catch (error) {
                message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
            }
        }
    };

    const handleQuickReply = (text) => {
        handleSendMessage(text);
    };

    if (isHiddenPath) return null;

    // Welcome Zalo/waiting message for human support mode
    const humanWaitMessage = {
        _id: 'system-zalo-wait',
        senderId: 'system',
        content: 'Dạ, nhân viên hỗ trợ của SneakerHub sẽ phản hồi anh/chị trong ít phút nữa ạ. Nếu chưa thấy phản hồi ngay, anh/chị có thể liên hệ trực tiếp qua Zalo: 0899227066 để được hỗ trợ gấp nhé!',
        createdAt: new Date().toISOString()
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Toggle Button: Blue circular bubble icon */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-[#007aff] hover:bg-[#0062cc] text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 border-none cursor-pointer relative"
                >
                    <Badge count={unreadCount} offset={[0, 0]}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                            <path d="M18 7c0-2.21-1.79-4-4-4H6C3.79 3 2 4.79 2 7v5c0 1.48.81 2.77 2 3.46V19l3.54-2.12C8.16 16.95 8.58 17 9 17h5c2.21 0 4-1.79 4-4V7zm4 5V9c0-2.21-1.79-4-4-4v2c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-4c0 1.1-.9 2-2 2h3.54L20 21v-3.54c1.19-.69 2-1.98 2-3.46z"/>
                        </svg>
                    </Badge>
                </button>
            )}

            {/* Chat Box: Bright theme, solid blue header */}
            {isOpen && (
                <div className="w-80 sm:w-[360px] h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden transition-all duration-300">
                    {/* Header: Solid Blue, circular black logo with active indicator, title, down caret and option buttons */}
                    <div className="bg-[#007aff] text-white px-4 py-3.5 flex justify-between items-center shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            {/* Black circular logo with green active dot */}
                            <div className="w-10 h-10 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-xs relative shrink-0 shadow-inner border border-gray-800">
                                SH
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10b981] border-2 border-white rounded-full"></span>
                            </div>
                            <div>
                                <span className="font-bold text-sm block tracking-wide">SneakerHub</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Triple dots button (just visual/clickable) */}
                            <button className="bg-transparent hover:bg-white/10 text-white border-none rounded-full p-1.5 cursor-pointer flex items-center justify-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </button>
                            {/* Down arrow caret icon to close the chat */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-transparent hover:bg-white/10 text-white border-none rounded-full p-1.5 cursor-pointer flex items-center justify-center transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mode Tabs Row - clean light gray layout */}
                    <div className="bg-gray-50 p-1 flex gap-1 border-b border-gray-150 shrink-0">
                        <button
                            onClick={() => setActiveMode('ai')}
                            className={`flex-grow py-1.5 rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                                activeMode === 'ai'
                                    ? 'bg-white shadow-sm text-[#007aff]'
                                    : 'bg-transparent text-gray-500 hover:text-black'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI tư vấn
                        </button>
                        <button
                            onClick={() => setActiveMode('human')}
                            className={`flex-grow py-1.5 rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                                activeMode === 'human'
                                    ? 'bg-white shadow-sm text-[#007aff]'
                                    : 'bg-transparent text-gray-500 hover:text-black'
                            }`}
                        >
                            <Headphones className="w-3.5 h-3.5" />
                            Nhân viên hỗ trợ
                        </button>
                    </div>

                    {/* Messages Area - clean white background */}
                    <div className="flex-grow overflow-y-auto bg-white p-4">
                        {/* Centered Sub-header description matching screenshot */}
                        <div className="text-center py-2 px-4 text-gray-400 text-[11px] leading-normal select-none">
                            <p>Bắt đầu trò chuyện nhanh với SneakerHub.</p>
                            <p className="mt-0.5">Thông tin của bạn được ẩn và tin nhắn trò chuyện chỉ lưu trên trình duyệt web.</p>
                        </div>

                        {/* Centered Time Stamp matching screenshot */}
                        <div className="flex justify-center my-3 select-none">
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-3 py-1 rounded-full font-medium">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Hôm nay
                            </span>
                        </div>

                        <div className="space-y-4 mt-2">
                            {activeMode === 'ai' ? (
                                // Render AI conversation
                                aiMessages.map((msg) => {
                                    const isSelf = msg.senderId !== 'ai';
                                    
                                    if (!isSelf) {
                                        // AI message: light gray bubble, dark text, black circle avatar on left
                                        return (
                                            <div key={msg._id} className="flex gap-2.5 items-start w-full">
                                                {/* Circular black avatar logo */}
                                                <div className="w-7 h-7 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-[8px] shrink-0 border border-gray-800 shadow-sm select-none">
                                                    SH
                                                </div>
                                                <div className="flex flex-col items-start max-w-[75%]">
                                                    <div className="bg-[#f1f0f0] text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[13px] leading-relaxed shadow-sm">
                                                        {renderMessageText(msg.content)}
                                                    </div>
                                                    {msg._id === 'ai-init' && (
                                                        <button
                                                            onClick={() => setActiveMode('human')}
                                                            className="mt-2 text-xs font-semibold bg-[#007aff] hover:bg-[#0062cc] text-white px-3.5 py-1.5 rounded-full border-none cursor-pointer transition-all shadow-sm"
                                                        >
                                                            Chuyển sang nhân viên
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // User message: solid blue bubble, white text, aligned to right
                                        return (
                                            <div key={msg._id} className="flex flex-col items-end w-full">
                                                <div className="bg-[#007aff] text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-[13px] shadow-sm w-fit max-w-[75%]">
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-gray-400 mt-1 mr-1 select-none flex items-center gap-0.5">
                                                    ✓ Đã gửi
                                                </span>
                                            </div>
                                        );
                                    }
                                })
                            ) : (
                                // Render Human Agent conversation
                                <>
                                    {/* System welcome Zalo message shown at the top of human chat */}
                                    <div className="flex gap-2.5 items-start w-full">
                                        <div className="w-7 h-7 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-[8px] shrink-0 border border-gray-800 shadow-sm select-none">
                                            SH
                                        </div>
                                        <div className="bg-[#f1f0f0] text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[13px] leading-relaxed max-w-[75%] shadow-sm">
                                            {renderMessageText(humanWaitMessage.content)}
                                        </div>
                                    </div>

                                    {humanMessages.map((msg) => {
                                        const isSelf = msg.senderId === (dataUser?._id || 'guest');
                                        const isFromAdmin = msg.senderId !== (dataUser?._id || 'guest') && msg.senderId !== msg.userId;

                                        if (isFromAdmin) {
                                            // Admin message bubble: light gray
                                            return (
                                                <div key={msg._id} className="flex gap-2.5 items-start w-full">
                                                    <div className="w-7 h-7 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-[8px] shrink-0 border border-gray-800 shadow-sm select-none">
                                                        SH
                                                    </div>
                                                    <div className="flex flex-col items-start max-w-[75%]">
                                                        <div className="bg-[#f1f0f0] text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[13px] leading-relaxed shadow-sm">
                                                            {renderMessageText(msg.content)}
                                                        </div>
                                                        <span className="text-[9px] text-gray-450 mt-1 select-none">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // User message bubble: solid blue
                                            return (
                                                <div key={msg._id} className="flex flex-col items-end w-full">
                                                    <div className="bg-[#007aff] text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-[13px] shadow-sm w-fit max-w-[75%]">
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 mt-1 mr-1 select-none flex items-center gap-0.5">
                                                        ✓ Đã gửi ({new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                    </span>
                                                </div>
                                            );
                                        }
                                    })}
                                </>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Quick Reply Suggestions Row */}
                    <div className="px-3 py-2 border-t border-gray-150 bg-white flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
                        {suggestedProducts.length > 0 && activeMode === 'ai' ? (
                            <>
                                <button
                                    onClick={() => setSuggestedProducts([])}
                                    className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer shrink-0 hover:bg-gray-200 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🔙 Quay lại
                                </button>
                                {suggestedProducts.map(p => (
                                    <button
                                        key={p._id}
                                        onClick={() => {
                                            setIsOpen(false);
                                            setSuggestedProducts([]);
                                            navigate(`/product/${p._id}`);
                                        }}
                                        className="bg-blue-50 border border-blue-200 hover:border-blue-400 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer shrink-0 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        👟 {p.nameProduct}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleQuickReply('Tìm sản phẩm')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🔍 Tìm sản phẩm
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Tư vấn kích thước')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    📏 Tư vấn kích thước
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Kiểm tra đơn hàng')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    📦 Kiểm tra đơn hàng
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Xem khuyến mãi')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🏷️ Xem khuyến mãi
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Chính sách đổi trả')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🔄 Chính sách đổi trả
                                </button>
                            </>
                        )}
                    </div>

                    {showSizeGuide && (
                        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fade-in rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-[#007aff] text-white px-4 py-3 flex justify-between items-center shrink-0">
                                <span className="font-bold text-sm">Hướng dẫn chọn Size giày</span>
                                <button
                                    onClick={() => setShowSizeGuide(false)}
                                    className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full p-1.5 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                    <CloseOutlined className="text-xs" />
                                </button>
                            </div>

                            {/* Brand Tabs */}
                            <div className="bg-gray-50 p-1 flex gap-1 border-b border-gray-200 shrink-0">
                                <button
                                    onClick={() => setSizeBrand('nike')}
                                    className={`flex-grow py-1.5 rounded-lg border-none cursor-pointer text-xs font-bold transition-all ${
                                        sizeBrand === 'nike' ? 'bg-white text-[#007aff] shadow-sm' : 'text-gray-500 bg-transparent'
                                    }`}
                                >
                                    Nike / Jordan
                                </button>
                                <button
                                    onClick={() => setSizeBrand('adidas')}
                                    className={`flex-grow py-1.5 rounded-lg border-none cursor-pointer text-xs font-bold transition-all ${
                                        sizeBrand === 'adidas' ? 'bg-white text-[#007aff] shadow-sm' : 'text-gray-500 bg-transparent'
                                    }`}
                                >
                                    Adidas
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-[#f8fafc]">
                                <div className="bg-blue-50 border border-blue-150 p-3 rounded-xl text-[11px] text-blue-900 leading-normal">
                                    <span className="font-bold block mb-1">💡 Hướng dẫn đo chân tại nhà:</span>
                                    1. Đặt tờ giấy trắng A4 sát bức tường.<br />
                                    2. Đứng lên tờ giấy sao cho gót chân chạm nhẹ vào tường.<br />
                                    3. Dùng bút đánh dấu điểm đầu ngón chân dài nhất.<br />
                                    4. Đo chiều dài từ tường đến điểm đánh dấu (cm) và đối chiếu bảng bên dưới.
                                </div>

                                {/* Size Table */}
                                <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <table className="w-full text-center text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                                                <th className="py-2 px-1 border-r border-gray-200">EU Size</th>
                                                <th className="py-2 px-1 border-r border-gray-200">US Size</th>
                                                <th className="py-2 px-1">Chiều dài (cm)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sizeBrand === 'nike' ? (
                                                <>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">38.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">6.0</td>
                                                        <td className="py-2 px-1">24.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">39.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">6.5</td>
                                                        <td className="py-2 px-1">24.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">40.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">7.0</td>
                                                        <td className="py-2 px-1">25.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">40.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">7.5</td>
                                                        <td className="py-2 px-1">25.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">41.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">8.0</td>
                                                        <td className="py-2 px-1">26.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">42.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">8.5</td>
                                                        <td className="py-2 px-1">26.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">42.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">9.0</td>
                                                        <td className="py-2 px-1">27.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">43.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">9.5</td>
                                                        <td className="py-2 px-1">27.5</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">44.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">10.0</td>
                                                        <td className="py-2 px-1">28.0</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">38.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">5.5</td>
                                                        <td className="py-2 px-1">23.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">38.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">6.0</td>
                                                        <td className="py-2 px-1">24.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">39.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">6.5</td>
                                                        <td className="py-2 px-1">24.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">40.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">7.0</td>
                                                        <td className="py-2 px-1">25.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">40.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">7.5</td>
                                                        <td className="py-2 px-1">25.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">41.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">8.0</td>
                                                        <td className="py-2 px-1">26.0</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">42.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">8.5</td>
                                                        <td className="py-2 px-1">26.5</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-150 bg-gray-50/50">
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">42.5</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">9.0</td>
                                                        <td className="py-2 px-1">27.0</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 px-1 border-r border-gray-150 font-bold">43.0</td>
                                                        <td className="py-2 px-1 border-r border-gray-150">9.5</td>
                                                        <td className="py-2 px-1">27.5</td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Input controls footer: white input flat design */}
                    <div className="p-3 border-t border-gray-150 flex flex-col gap-1.5 bg-white shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex gap-3 items-center w-full"
                        >
                            <Paperclip className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                            <input
                                placeholder="Nhập tin nhắn, nhấn Enter để gửi..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-transparent border-none py-2 text-sm text-gray-800 focus:outline-none placeholder-gray-400"
                            />
                            <Smile className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                            {inputText.trim() && (
                                <button
                                    type="submit"
                                    className="bg-transparent hover:bg-gray-100 text-[#007aff] w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all shrink-0"
                                >
                                    <SendOutlined className="text-sm" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatWidget;
