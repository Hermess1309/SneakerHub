import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { listProduct } from '../config/ProductRequest';
import { requestGetMessages, requestSendMessage } from '../config/MessageRequest';
import { Input, Badge, message } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Sparkles, Headphones, Paperclip } from 'lucide-react';

function ChatWidget() {
    const location = useLocation();
    const { dataUser } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeMode, setActiveMode] = useState('ai'); // 'ai' or 'human'
    const [productList, setProductList] = useState([]);

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
    
    // Human Chat States
    const [humanMessages, setHumanMessages] = useState([]);
    
    // AI Chat States
    const [aiMessages, setAiMessages] = useState([
        {
            _id: 'ai-init',
            senderId: 'ai',
            content: 'Dạ xin chào! Em là Trợ lý ảo SneakerHub Assistant. Em có thể hỗ trợ anh/chị tư vấn chọn size giày, tìm kiếm sản phẩm hot hoặc kiểm tra chính sách đổi trả. Anh/chị hãy bấm chọn nút hỏi nhanh hoặc gửi câu hỏi để em trả lời nhé!',
            createdAt: new Date().toISOString()
        }
    ]);

    const [inputText, setInputText] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const chatEndRef = useRef(null);

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
        if (content.includes('- Nike') || content.includes('- Adidas') || content.includes('- Jordan')) {
            const lines = content.split('\n');
            return (
                <div className="space-y-1">
                    {lines.map((line, idx) => {
                        if (line.includes('Nike Air Force 1')) {
                            const nikeProd = productList.find(p => p.nameProduct?.toLowerCase().includes('force 1') || p.nameProduct?.toLowerCase().includes('nike air force'));
                            if (nikeProd) {
                                return (
                                    <div key={idx}>
                                        - <Link to={`/product/${nikeProd._id}`} className="text-blue-600 underline font-bold hover:text-blue-800" onClick={() => setIsOpen(false)}>Nike Air Force 1 '07</Link> (Trẻ trung, năng động)
                                    </div>
                                );
                            }
                        }
                        if (line.includes('Adidas Samba') || line.includes('Adidas Ultraboost')) {
                            const adidasProd = productList.find(p => p.nameProduct?.toLowerCase().includes('adidas'));
                            if (adidasProd) {
                                return (
                                    <div key={idx}>
                                        - <Link to={`/product/${adidasProd._id}`} className="text-blue-600 underline font-bold hover:text-blue-800" onClick={() => setIsOpen(false)}>{adidasProd.nameProduct}</Link> (Thanh lịch, dễ phối đồ)
                                    </div>
                                );
                            }
                        }
                        if (line.includes('Jordan 1')) {
                            const jordanProd = productList.find(p => p.nameProduct?.toLowerCase().includes('jordan 1') || p.nameProduct?.toLowerCase().includes('jordan'));
                            if (jordanProd) {
                                return (
                                    <div key={idx}>
                                        - <Link to={`/product/${jordanProd._id}`} className="text-blue-600 underline font-bold hover:text-blue-800" onClick={() => setIsOpen(false)}>Jordan 1 Low Retro</Link> (Thời trang, cá tính)
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

        if (textLower.includes('size') || textLower.includes('kích thước') || textLower.includes('kích cỡ') || textLower.includes('đo chân')) {
            aiReply = 'Dạ SneakerHub xin tư vấn kích thước (size) cho anh/chị ạ! Thông thường đối với Nike Air Force 1 hoặc Jordan 1, anh/chị nên chọn đúng size chuẩn (true to size). Với giày chạy bộ Adidas Ultraboost hoặc Yeezy, anh/chị nên tăng lên 0.5 đến 1 size để đi thoải mái nhất ạ. Anh/chị đang quan tâm dòng nào ạ?';
        } else if (textLower.includes('tìm sản phẩm') || textLower.includes('mua giày') || textLower.includes('giày hot') || textLower.includes('sản phẩm')) {
            aiReply = 'Dạ hiện tại SneakerHub đang có các dòng sản phẩm bán rất chạy như:\n- Nike Air Force 1 \'07 (Trẻ trung, năng động)\n- Adidas Samba OG (Thanh lịch, dễ phối đồ)\n- Jordan 1 Low Retro (Thời trang, cá tính)\nAnh/chị có thể tìm kiếm trên thanh tìm kiếm của Web hoặc click vào danh mục Thương hiệu để xem chi tiết nhé!';
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
            scrollToBottom();
        }, 6000); // 600ms simulation delay
    };

    const handleSendMessage = async (textToSend = null) => {
        const text = textToSend || inputText;
        if (!text.trim()) return;

        if (!textToSend) setInputText('');

        if (activeMode === 'ai') {
            // AI Mode
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
            // Human Mode (Admin Chat)
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

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Toggle Button: Blue circle with double chat bubble icon */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 border-none cursor-pointer relative"
                >
                    <Badge count={unreadCount} offset={[0, 0]}>
                        {/* Overlapping rectangular speech bubbles SVG path exactly matching the user image */}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                            <path d="M18 7c0-2.21-1.79-4-4-4H6C3.79 3 2 4.79 2 7v5c0 1.48.81 2.77 2 3.46V19l3.54-2.12C8.16 16.95 8.58 17 9 17h5c2.21 0 4-1.79 4-4V7zm4 5V9c0-2.21-1.79-4-4-4v2c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-4c0 1.1.9 2 2 2h3.54L20 21v-3.54c1.19-.69 2-1.98 2-3.46z"/>
                        </svg>
                    </Badge>
                </button>
            )}

            {/* Chat Box Popup */}
            {isOpen && (
                <div className="w-80 sm:w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden transition-all duration-300">
                    {/* Header: Navy blue, yellow avatar SH, title & subtitle */}
                    <div className="bg-[#1e3a8a] text-white px-4 py-3 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Yellow circle avatar containing "SH" */}
                            <div className="w-10 h-10 bg-[#eab308] text-black font-extrabold rounded-xl flex items-center justify-center text-sm shadow-md">
                                SH
                            </div>
                            <div>
                                <span className="font-bold text-sm block">SneakerHub Assistant</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-pulse"></span>
                                    <span className="text-[10px] text-gray-250">Đang hoạt động</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full p-1.5 cursor-pointer flex items-center justify-center transition-colors"
                        >
                            <CloseOutlined className="text-xs" />
                        </button>
                    </div>

                    {/* Mode Tabs Row */}
                    <div className="bg-gray-100 p-1 flex gap-1 border-b border-gray-200 shrink-0">
                        <button
                            onClick={() => setActiveMode('ai')}
                            className={`flex-grow py-1.5 rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                                activeMode === 'ai'
                                    ? 'bg-white shadow-sm text-black'
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
                                    ? 'bg-white shadow-sm text-black'
                                    : 'bg-transparent text-gray-500 hover:text-black'
                            }`}
                        >
                            <Headphones className="w-3.5 h-3.5" />
                            Nhân viên hỗ trợ
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-grow p-4 overflow-y-auto bg-[#f8fafc] space-y-4">
                        {activeMode === 'ai' ? (
                            // Render AI conversation
                            aiMessages.map((msg) => {
                                const isSelf = msg.senderId !== 'ai';
                                
                                if (!isSelf) {
                                    // AI messages styled as yellow card with title
                                    return (
                                        <div key={msg._id} className="flex flex-col items-start w-full">
                                            <div className="bg-[#fffbeb] border border-[#fde68a] text-yellow-950 p-3.5 rounded-xl text-sm leading-relaxed max-w-[85%] shadow-sm">
                                                <span className="font-extrabold text-[9px] text-amber-700 uppercase tracking-wider mb-1 block">
                                                    SNEAKERHUB AI
                                                </span>
                                                {renderMessageText(msg.content)}
                                            </div>
                                            {/* "Chuyển sang nhân viên" button inside AI welcome msg */}
                                            {msg._id === 'ai-init' && (
                                                <button
                                                    onClick={() => setActiveMode('human')}
                                                    className="mt-2 text-xs font-semibold bg-white border border-gray-300 hover:border-black text-gray-800 px-3 py-1.5 rounded-full cursor-pointer transition-all shadow-sm"
                                                >
                                                    Chuyển sang nhân viên
                                                </button>
                                            )}
                                        </div>
                                    );
                                } else {
                                    // User message in AI mode: Navy pill layout matching screenshot
                                    return (
                                        <div key={msg._id} className="flex flex-col items-end w-full">
                                            <div className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm shadow-sm">
                                                {msg.content}
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-1 mr-1">Đã gửi</span>
                                        </div>
                                    );
                                }
                            })
                        ) : (
                            // Render Human Agent conversation
                            humanMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
                                    <Headphones className="w-10 h-10 opacity-30 text-gray-800" />
                                    <p className="text-sm font-semibold">Bắt đầu trò chuyện với nhân viên</p>
                                    <p className="text-xs">Tin nhắn của bạn sẽ được gửi trực tiếp đến quản trị viên cửa hàng.</p>
                                </div>
                            ) : (
                                humanMessages.map((msg) => {
                                    const isSelf = msg.senderId === (dataUser?._id || 'guest');
                                    const isFromAdmin = msg.senderId !== (dataUser?._id || 'guest') && msg.senderId !== msg.userId;

                                    if (isFromAdmin) {
                                        // Admin bubble (Yellow/orange AI box on client side too for consistence)
                                        return (
                                            <div key={msg._id} className="flex flex-col items-start w-full">
                                                <div className="bg-[#fffbeb] border border-[#fde68a] text-yellow-950 p-3.5 rounded-xl text-sm leading-relaxed max-w-[85%] shadow-sm">
                                                    <span className="font-extrabold text-[9px] text-amber-700 uppercase tracking-wider mb-1 block">
                                                        NHÂN VIÊN HỖ TRỢ
                                                    </span>
                                                    {renderMessageText(msg.content)}
                                                </div>
                                                <span className="text-[9px] text-gray-400 mt-1 px-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        // User bubble (Navy blue matching AI mode)
                                        return (
                                            <div key={msg._id} className="flex flex-col items-end w-full">
                                                <div className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm shadow-sm">
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-gray-400 mt-1 mr-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    }
                                })
                            )
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Reply Suggestions Row */}
                    <div className="px-3 py-2 border-t border-gray-150 bg-white flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
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
                    </div>

                    {/* Input controls footer */}
                    <div className="p-3 border-t border-gray-200 flex flex-col gap-1.5 bg-white shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex gap-2.5 items-center w-full"
                        >
                            <Paperclip className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                            <input
                                placeholder="Nhập câu hỏi của bạn..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-800 focus:outline-none focus:border-black"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="bg-[#f43f5e] hover:bg-[#e11d48] text-white w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md shrink-0"
                            >
                                <SendOutlined className="text-sm text-white" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatWidget;
