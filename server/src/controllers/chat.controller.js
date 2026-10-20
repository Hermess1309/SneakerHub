const geminiService = require('../services/gemini.service');
const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

class ChatController {
    handleGeminiChat = async (req, res) => {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            throw new BadRequestError('Nội dung tin nhắn không được để trống.');
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 1000) {
            throw new BadRequestError('Nội dung tin nhắn không được vượt quá 1000 ký tự.');
        }

        // Validate history format
        let cleanHistory = [];
        if (Array.isArray(history)) {
            cleanHistory = history
                .filter(item => item && (item.senderId === 'user' || item.senderId === 'ai') && typeof item.content === 'string')
                .slice(-8);
        }

        const currentUserId = req.user;

        try {
            const result = await geminiService.chat({
                userMessage: trimmedMessage,
                history: cleanHistory,
                currentUserId: currentUserId
            });

            return new OK({
                message: 'AI reply generated successfully',
                metadata: result
            }).send(res);
        } catch (error) {
            console.error('Gemini chat error in controller:', error.message);

            // Graceful Fallback - never crash server or break customer journey
            return new OK({
                message: 'AI fallback reply',
                metadata: {
                    success: true,
                    isFallback: true,
                    message: 'Dạ, hiện tại kết nối tới hệ thống AI đang bị quá tải hoặc gián đoạn trong giây lát. Anh/chị có thể bấm chuyển sang tab "Nhân viên hỗ trợ" hoặc liên hệ Zalo 0899227066 để nhân viên SneakerHub hỗ trợ ngay nhé ạ!',
                    products: []
                }
            }).send(res);
        }
    };
}

module.exports = new ChatController();
