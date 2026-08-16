import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { requestGetMessages, requestSendMessage } from '../config/MessageRequest';
import { Input, Button, Badge, message } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons';

function ChatWidget() {
    const location = useLocation();
    const { dataUser } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const chatEndRef = useRef(null);

    const isHiddenPath = 
        location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/login') || 
        location.pathname.startsWith('/register');

    // Fetch messages
    const fetchMessages = async (silent = false) => {
        try {
            const res = await requestGetMessages();
            const newMsgs = res.metadata || [];
            
            // Calculate unread replies (messages not sent by current user)
            if (!isOpen && messages.length > 0 && newMsgs.length > messages.length) {
                const added = newMsgs.slice(messages.length);
                const unreadReplies = added.filter(m => m.senderId !== (dataUser?._id || m.userId)).length;
                if (unreadReplies > 0) {
                    setUnreadCount(prev => prev + unreadReplies);
                }
            }

            setMessages(newMsgs);
        } catch (error) {
            console.error('Error fetching chat messages:', error);
        }
    };

    // Auto poll messages when open
    useEffect(() => {
        if (isHiddenPath) return;

        fetchMessages();

        const timer = setInterval(() => {
            fetchMessages(true);
        }, 3000);

        return () => clearInterval(timer);
    }, [isOpen, isHiddenPath, dataUser]);

    // Reset unread count when opening chat
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');
        
        // Optimistic update
        const tempMsg = {
            _id: `temp-${Date.now()}`,
            userId: dataUser?._id || 'guest',
            senderId: dataUser?._id || 'guest',
            content: text,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            await requestSendMessage(text);
            fetchMessages(true);
        } catch (error) {
            message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
        }
    };

    if (isHiddenPath) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 border-none cursor-pointer relative"
                >
                    <Badge count={unreadCount} offset={[0, 0]}>
                        <MessageOutlined className="text-2xl text-white" />
                    </Badge>
                </button>
            )}

            {/* Chat Box Popup */}
            {isOpen && (
                <div className="w-80 sm:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden transition-all duration-300">
                    {/* Header */}
                    <div className="bg-black text-white px-5 py-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="font-bold text-sm">Hỗ trợ trực tuyến SneakerHub</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-transparent text-white border-none cursor-pointer hover:opacity-75 transition-opacity"
                        >
                            <CloseOutlined className="text-lg" />
                        </button>
                    </div>

                    {/* Guest Banner */}
                    {!dataUser && (
                        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 text-center text-xs text-gray-650 flex flex-col sm:flex-row items-center justify-center gap-1.5 shrink-0">
                            <span>Bạn đang chat dưới vai trò <b>Khách vãng lai</b>.</span>
                            <Link to="/login" className="text-black font-semibold hover:underline">Đăng nhập</Link>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
                                <MessageOutlined className="text-4xl opacity-50" />
                                <p className="text-sm font-medium">Chào mừng bạn đến với SneakerHub!</p>
                                <p className="text-xs">Hãy nhắn tin để nhận hỗ trợ tư vấn giày hiệu từ Admin.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isSelf = msg.senderId === (dataUser?._id || 'guest') || (!dataUser && msg.senderId !== 'admin' && !msg.senderId?.isAdmin);
                                // Note: In DB, if it's sent by admin, senderId is admin's User ID. If it's sent by customer, senderId is customer's User ID.
                                // We can also verify if senderId matches dataUser?._id.
                                const isFromAdmin = msg.senderId !== (dataUser?._id || 'guest') && msg.senderId !== msg.userId;
                                
                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex flex-col ${!isFromAdmin ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                                                !isFromAdmin
                                                    ? 'bg-black text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-gray-200 flex gap-2 items-center bg-white shrink-0"
                    >
                        <Input
                            placeholder="Nhập tin nhắn..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="rounded-xl border-gray-300 focus:border-black focus:shadow-none"
                            onPressEnter={handleSendMessage}
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSendMessage}
                            className="bg-black border-none text-white hover:bg-gray-800 rounded-xl"
                        />
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatWidget;
