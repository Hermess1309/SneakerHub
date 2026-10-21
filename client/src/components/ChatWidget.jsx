import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { listProduct } from '../config/ProductRequest';
import { requestGetMessages, requestSendMessage } from '../config/MessageRequest';
import { requestSendGeminiMessage } from '../config/ChatRequest';
import { Badge, message } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Sparkles, Headphones, Paperclip, Smile } from 'lucide-react';

// Normalizes strings for resilient fuzzy matching
const normalizeText = (str) => {
    return (str || '')
        .toLowerCase()
        .replace(/[‘'’“”\"\"-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Matches a single product from an inline bold snippet (e.g. **Giày Nike Vomero 18** or **Nike Court Lite 4**)
const findSingleMatchedProduct = (snippet, products) => {
    if (!snippet || !products || !products.length) return null;
    const normSnippet = normalizeText(snippet);
    if (normSnippet.length < 4) return null;

    const skipWords = [
        'nike', 'adidas', 'puma', 'new balance', 'giá bán', 'mã sản phẩm', 
        'size sẵn có', 'bảng size', 'chính sách', 'đổi trả', 'bảo hành', 
        'thanh toán', '37.5', '38', '38.5', '39', '40', '41', '42'
    ];
    if (skipWords.includes(normSnippet)) return null;

    // 1. Direct containment match
    for (const prod of products) {
        const normName = normalizeText(prod.nameProduct);
        if (normName.includes(normSnippet) || normSnippet.includes(normName)) {
            return prod;
        }
    }

    // 2. Keyword match with model numbers preserved (e.g. ['nike', 'vomero', '18'])
    const stopWords = ['giay', 'giày', 'mau', 'mẫu', 'nam', 'nu', 'nữ', 'cac', 'các', 'va', 'và', 'doi', 'đôi'];
    const words = normSnippet
        .split(' ')
        .filter(w => (w.length > 2 || /\d/.test(w)) && !stopWords.includes(w));

    if (words.length >= 2) {
        for (const prod of products) {
            const normName = normalizeText(prod.nameProduct);
            if (words.every(w => normName.includes(w))) {
                return prod;
            }
        }
    }

    return null;
};

// Finds all products mentioned in an AI message text to render product cards
const findMatchedProducts = (text, products) => {
    if (!text || !products || !products.length) return [];
    const normText = normalizeText(text);
    const matches = [];

    const boldMatches = [...text.matchAll(/\*\*(.*?)\*\*/g)].map(m => m[1].trim());

    for (const prod of products) {
        const normName = normalizeText(prod.nameProduct);
        const author = normalizeText(prod.metadata?.author);
        let matched = false;

        // 1. Check if product code is in text (e.g. HM6804 607, FD6574-112)
        if (author && author.length >= 4 && normText.includes(author)) {
            matched = true;
        }

        // 2. Check code pattern in product name
        if (!matched) {
            const codeMatch = prod.nameProduct.match(/[A-Z0-9]{4,8}[-\s][0-9]{3}/i);
            if (codeMatch && normText.includes(normalizeText(codeMatch[0]))) {
                matched = true;
            }
        }

        // 3. Check bold segments
        if (!matched) {
            for (const bold of boldMatches) {
                const normBold = normalizeText(bold);
                if (normBold.length >= 4) {
                    const skipWords = [
                        'nike', 'adidas', 'puma', 'new balance', 'giá bán', 'mã sản phẩm', 
                        'size sẵn có', 'bảng size', 'chính sách', 'đổi trả', 'bảo hành', 
                        'thanh toán', '37.5', '38', '38.5', '39', '40', '41', '42'
                    ];
                    if (skipWords.includes(normBold)) continue;

                    if (normName.includes(normBold) || normBold.includes(normName)) {
                        matched = true;
                        break;
                    }

                    const stopWords = ['giay', 'giày', 'mau', 'mẫu', 'nam', 'nu', 'nữ', 'cac', 'các', 'va', 'và', 'doi', 'đôi'];
                    const boldWords = normBold
                        .split(' ')
                        .filter(w => (w.length > 2 || /\d/.test(w)) && !stopWords.includes(w));

                    if (boldWords.length >= 2 && boldWords.every(w => normName.includes(w))) {
                        matched = true;
                        break;
                    }
                }
            }
        }

        // 4. Check core model phrase (e.g. "vomero 18", "court lite 4", "book 2", "kd19")
        if (!matched) {
            const cleanModel = prod.nameProduct
                .replace(/^giày\s*(?:sneaker|chạy bộ|tennis|pickleball|bóng rổ)?\s*(?:nam|nữ)?\s*/i, '')
                .replace(/\s*[‘'’].*$/, '')
                .trim();
            const normModel = normalizeText(cleanModel);
            if (normModel.length >= 6 && normText.includes(normModel)) {
                matched = true;
            }
        }

        if (matched && !matches.some(m => m._id?.toString() === prod._id?.toString())) {
            matches.push(prod);
        }
    }
    return matches.slice(0, 4);
};

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
    const [isAiTyping, setIsAiTyping] = useState(false);
    
    // Human Chat States
    const [humanMessages, setHumanMessages] = useState([]);
    
    // AI Chat States (loaded from sessionStorage if present)
    const [aiMessages, setAiMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem('sneakerhub_ai_chat_session');
            if (saved) return JSON.parse(saved);
        } catch {
            // ignore JSON parse error
        }
        return [
            {
                _id: 'ai-init',
                senderId: 'ai',
                content: 'Dạ xin chào! Em là Trợ lý ảo SneakerHub Assistant. Em có thể hỗ trợ anh/chị tư vấn chọn size giày, tìm kiếm sản phẩm hot hoặc kiểm tra chính sách đổi trả. Anh/chị hãy bấm chọn nút hỏi nhanh hoặc gửi câu hỏi để em giải đáp nhé!',
                createdAt: new Date().toISOString()
            }
        ];
    });

    // Save AI messages to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem('sneakerhub_ai_chat_session', JSON.stringify(aiMessages));
        } catch {
            // ignore storage quota error
        }
    }, [aiMessages]);

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

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Reset unread count when opening chat
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            scrollToBottom();
        }
    }, [isOpen, humanMessages, aiMessages, activeMode]);

    const renderMessageText = (content) => {
        if (!content) return null;

        const lines = content.split('\n');

        return (
            <div className="space-y-1.5 leading-relaxed">
                {lines.map((line, lineIdx) => {
                    if (!line.trim()) {
                        return <div key={lineIdx} className="h-1.5" />;
                    }

                    // Handle special size guide token if present in this line
                    let subSegments = [line];
                    if (line.includes('[Bảng hướng dẫn chọn size]')) {
                        const parts = line.split('[Bảng hướng dẫn chọn size]');
                        subSegments = [parts[0], '__SIZE_GUIDE_BUTTON__', parts[1]];
                    }

                    return (
                        <div key={lineIdx} className="text-[13px]">
                            {subSegments.map((segment, segIdx) => {
                                if (segment === '__SIZE_GUIDE_BUTTON__') {
                                    return (
                                        <button
                                            key={segIdx}
                                            onClick={() => setShowSizeGuide(true)}
                                            className="bg-[#007aff] hover:bg-[#0062cc] text-white px-2.5 py-1 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1 mx-1 my-0.5"
                                        >
                                            📏 Xem bảng size giày
                                        </button>
                                    );
                                }

                                // Parse bold tokens **...**
                                const parts = segment.split(/(\*\*.*?\*\*)/g);
                                return parts.map((part, pIdx) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        const innerText = part.slice(2, -2).trim();
                                        const matchedProduct = findSingleMatchedProduct(innerText, productList);

                                        if (matchedProduct) {
                                            return (
                                                <Link
                                                    key={`${segIdx}-${pIdx}`}
                                                    to={`/product/${matchedProduct._id}`}
                                                    className="text-[#007aff] hover:text-[#0056b3] font-bold underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 inline-flex items-center gap-0.5 mx-0.5 transition-colors cursor-pointer"
                                                    title={`Xem ${matchedProduct.nameProduct}`}
                                                >
                                                    {innerText}
                                                    <span className="text-[10px] no-underline">↗</span>
                                                </Link>
                                            );
                                        }

                                        return (
                                            <strong key={`${segIdx}-${pIdx}`} className="font-bold text-gray-900">
                                                {innerText}
                                            </strong>
                                        );
                                    }

                                    return <span key={`${segIdx}-${pIdx}`}>{part}</span>;
                                });
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Gemini AI Chat Request Logic
    const handleAiChat = async (userText) => {
        setIsAiTyping(true);
        setSuggestedProducts([]);

        // Build history context (last 6 messages)
        const historyContext = aiMessages.slice(-6).map(m => ({
            senderId: m.senderId === 'ai' ? 'ai' : 'user',
            content: m.content
        }));

        try {
            const res = await requestSendGeminiMessage({
                message: userText,
                history: historyContext
            });

            const replyText = res.metadata?.message || 'Dạ SneakerHub Assistant có thể hỗ trợ gì thêm cho anh/chị ạ?';
            let products = res.metadata?.products || [];

            // If backend returned no products, scan replyText against productList on client
            if (!products || products.length === 0) {
                products = findMatchedProducts(replyText, productList);
            }

            setAiMessages(prev => [
                ...prev,
                {
                    _id: `ai-${Date.now()}`,
                    senderId: 'ai',
                    content: replyText,
                    products: products,
                    createdAt: new Date().toISOString()
                }
            ]);

            if (products.length > 0) {
                setSuggestedProducts(products);
            }
        } catch (error) {
            console.error('Error calling Gemini AI:', error);
            setAiMessages(prev => [
                ...prev,
                {
                    _id: `ai-${Date.now()}`,
                    senderId: 'ai',
                    content: 'Dạ, hiện tại kết nối tới trợ lý AI đang bị gián đoạn trong giây lát. Anh/chị có thể chuyển sang tab "Nhân viên hỗ trợ" hoặc liên hệ Zalo 0899227066 để được nhân viên SneakerHub hỗ trợ ngay nhé ạ!',
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setIsAiTyping(false);
            scrollToBottom();
        }
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
            handleAiChat(text);
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
            } catch {
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
                                <>
                                    {aiMessages.map((msg) => {
                                        const isSelf = msg.senderId !== 'ai';
                                        
                                        if (!isSelf) {
                                            const msgProducts = (msg.products && msg.products.length > 0)
                                                ? msg.products
                                                : findMatchedProducts(msg.content, productList);

                                            // AI message: light gray bubble, dark text, black circle avatar on left
                                            return (
                                                <div key={msg._id} className="flex gap-2.5 items-start w-full">
                                                    {/* Circular black avatar logo */}
                                                    <div className="w-7 h-7 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-[8px] shrink-0 border border-gray-800 shadow-sm select-none">
                                                        SH
                                                    </div>
                                                    <div className="flex flex-col items-start max-w-[85%]">
                                                        <div className="bg-[#f1f0f0] text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[13px] leading-relaxed shadow-sm">
                                                            {renderMessageText(msg.content)}
                                                        </div>

                                                        {/* Clickable Product Recommendation Cards */}
                                                        {msgProducts && msgProducts.length > 0 && (
                                                            <div className="mt-2.5 w-full flex flex-col gap-1.5 animate-fade-in">
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 pl-1">
                                                                    👟 Giày gợi ý cho bạn:
                                                                </span>
                                                                <div className="flex flex-col gap-2 w-full">
                                                                    {msgProducts.map((p) => {
                                                                        const imgSrc = p.image || p.imagesProduct?.[0] || p.imageProduct?.[0];
                                                                        const price = p.priceProduct;
                                                                        const discount = Number(p.discountProduct) || 0;
                                                                        const hasDiscount = discount > 0;
                                                                        const finalPrice = hasDiscount 
                                                                            ? Math.round(price * (1 - discount / 100))
                                                                            : price;

                                                                        return (
                                                                            <div
                                                                                key={p._id}
                                                                                className="bg-white border border-gray-200 hover:border-[#007aff] rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 group"
                                                                            >
                                                                                {imgSrc ? (
                                                                                    <img
                                                                                        src={imgSrc}
                                                                                        alt={p.nameProduct}
                                                                                        className="w-13 h-13 object-cover rounded-lg border border-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-13 h-13 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                                                                                        👟
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-grow min-w-0 flex flex-col justify-between">
                                                                                    <Link
                                                                                        to={`/product/${p._id}`}
                                                                                        className="text-xs font-bold text-gray-800 hover:text-[#007aff] line-clamp-2 block leading-snug transition-colors"
                                                                                        title={p.nameProduct}
                                                                                    >
                                                                                        {p.nameProduct}
                                                                                    </Link>
                                                                                    <div className="mt-1.5 flex items-center justify-between gap-1">
                                                                                        <div>
                                                                                            <span className="text-xs font-extrabold text-[#007aff]">
                                                                                                {finalPrice ? `${finalPrice.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                                                                                            </span>
                                                                                            {hasDiscount ? (
                                                                                                <span className="text-[10px] text-gray-400 line-through ml-1">
                                                                                                    {price.toLocaleString('vi-VN')}đ
                                                                                                </span>
                                                                                            ) : null}
                                                                                        </div>
                                                                                        <Link
                                                                                            to={`/product/${p._id}`}
                                                                                            className="text-[11px] font-semibold bg-[#007aff] hover:bg-[#0062cc] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-colors shrink-0"
                                                                                        >
                                                                                            Xem ↗
                                                                                        </Link>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

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
                                    })}

                                    {/* Typing indicator bubble */}
                                    {isAiTyping && (
                                        <div className="flex gap-2.5 items-start w-full animate-fade-in">
                                            <div className="w-7 h-7 bg-black text-white font-extrabold rounded-full flex items-center justify-center text-[8px] shrink-0 border border-gray-800 shadow-sm select-none">
                                                SH
                                            </div>
                                            <div className="bg-[#f1f0f0] text-gray-500 px-3.5 py-3 rounded-2xl rounded-tl-none text-[13px] flex items-center gap-1.5 shadow-sm">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                            </div>
                                        </div>
                                    )}
                                </>
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
                                        className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {p.image ? (
                                            <img src={p.image} alt={p.nameProduct} className="w-6 h-6 object-cover rounded" />
                                        ) : (
                                            <span>👟</span>
                                        )}
                                        <span className="truncate max-w-[130px] font-bold">{p.nameProduct}</span>
                                        {p.priceProduct ? (
                                            <span className="text-[11px] text-blue-600 font-extrabold">{p.priceProduct.toLocaleString()}đ</span>
                                        ) : null}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleQuickReply('Gợi ý cho mình các mẫu giày sneaker hot nhất tại shop')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🔍 Tìm sản phẩm
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Tư vấn cho mình cách chọn size giày chuẩn theo chân')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    📏 Tư vấn kích thước
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Kiểm tra đơn hàng gần nhất của mình')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    📦 Kiểm tra đơn hàng
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Shop hiện có những mã giảm giá và khuyến mãi nào còn dùng được?')}
                                    className="bg-white border border-gray-200 hover:border-black text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-sm"
                                >
                                    🏷️ Xem khuyến mãi
                                </button>
                                <button
                                    onClick={() => handleQuickReply('Chính sách bảo hành và đổi trả giày của shop như thế nào?')}
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
                                placeholder={isAiTyping && activeMode === 'ai' ? "Trợ lý AI đang soạn câu trả lời..." : "Nhập tin nhắn, nhấn Enter để gửi..."}
                                value={inputText}
                                disabled={isAiTyping && activeMode === 'ai'}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-transparent border-none py-2 text-sm text-gray-800 focus:outline-none placeholder-gray-400 disabled:opacity-50"
                            />
                            <Smile className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                            {inputText.trim() && !(isAiTyping && activeMode === 'ai') && (
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
