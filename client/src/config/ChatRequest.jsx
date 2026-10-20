import request from './request';

const apiChat = '/api/chat';

// Send message to Gemini AI Assistant
export const requestSendGeminiMessage = async ({ message, history = [] }) => {
    const res = await request.post(`${apiChat}/gemini`, { message, history });
    return res.data;
};
